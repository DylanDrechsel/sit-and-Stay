import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PillButton } from '../../components/PillButton';
import { ASSIGN_SITTER, GET_AVAILABLE_EMPLOYEES, GET_JOB } from '../../graphql/job';
import { formatShortDate, formatTime } from '../../lib/datetime';
import type {
    OwnerManagerNavigation,
    OwnerManagerStackParamList,
} from '../../navigation/ownerManagerTypes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { AvailableEmployee, JobDetail } from '../../types/job';

/** Sentence-case a role for display: EMPLOYEE -> Employee. */
const formatRole = (role: string): string => role.charAt(0) + role.slice(1).toLowerCase();

const shortName = (first: string, last: string): string => `${first} ${last.charAt(0)}.`;

/**
 * One selectable sitter row.
 *
 * Unavailable sitters are selectable too — `getAvailableEmployees` is advisory
 * and `assignSitter` accepts anyone, so blocking the tap would invent a rule the
 * API doesn't have. It matters in practice: a business that never configured
 * weekly availability has *every* member come back unavailable, and a screen
 * that refused all of them would be unusable. The conflict is shown instead, and
 * the confirm button changes to "Assign anyway".
 */
function SitterRow({
    entry,
    selected,
    onSelect,
}: {
    entry: AvailableEmployee;
    selected: boolean;
    onSelect: () => void;
}) {
    const { member, isAvailable, conflictReason } = entry;
    return (
        <Pressable onPress={onSelect}>
            <View style={[styles.sitterCard, selected && styles.sitterCardSelected]}>
                <View style={styles.avatar}>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.sitterText}>
                    <Text style={styles.sitterName} numberOfLines={1}>
                        {shortName(member.user.firstName, member.user.lastName)}
                    </Text>
                    <Text
                        style={[styles.sitterMeta, !isAvailable && styles.sitterMetaConflict]}
                        numberOfLines={2}
                    >
                        {/* The server's own wording when it has one — it distinguishes
                            "no availability configured" from "off today" from a real
                            overlapping job, and re-deriving that here would risk
                            disagreeing with the decision it actually made. */}
                        {conflictReason ?? formatRole(member.role)}
                    </Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]} />
            </View>
        </Pressable>
    );
}

/** The job's own details — what's being assigned, before who's taking it. */
function JobSummary({ job }: { job: JobDetail }) {
    const petNames = job.pets.map((pet) => pet.name).join(', ');
    const careNotes = job.pets
        .flatMap((pet) =>
            [pet.medicalNotes, pet.careInstructions]
                .filter((note): note is string => note != null && note.trim().length > 0)
                .map((note) => `${pet.name}: ${note}`),
        );

    return (
        <>
            <View style={styles.card}>
                <Row label="Customer" value={`${job.customer.user.firstName} ${job.customer.user.lastName}`} />
                {job.customer.user.phone != null && (
                    <Row label="Phone" value={job.customer.user.phone} />
                )}
                <Row label="Pets" value={petNames} />
                <Row
                    label="When"
                    value={`${formatShortDate(job.scheduledStartTime)} · ${formatTime(job.scheduledStartTime)}–${formatTime(job.scheduledEndTime)}`}
                />
                <Row label="Service" value={`${job.service.title} · ${job.service.durationMinutes} min`} />
                {job.sessionNumber != null && job.totalSessions != null && (
                    <Row label="Session" value={`${job.sessionNumber} of ${job.totalSessions}`} />
                )}
                {/* Per-session rate. A package's combined total lives on Booking,
                    which Job has no relation to — see the JobDetail type. */}
                <Row label="Price" value={`$${job.price.toFixed(2)} this session`} />
                <Row label="Job" value={`#${job.jobNumber}`} />
            </View>

            {careNotes.length > 0 && (
                <View style={styles.careBanner}>
                    {careNotes.map((note) => (
                        <Text key={note} style={styles.careText}>
                            {note}
                        </Text>
                    ))}
                    <Text style={styles.careFootnote}>
                        Shared automatically with whoever you assign.
                    </Text>
                </View>
            )}

            {job.specialInstructions != null && job.specialInstructions.trim().length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.rowLabel}>Special instructions</Text>
                    <Text style={styles.instructions}>{job.specialInstructions}</Text>
                </View>
            )}
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue} numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
}

/**
 * Prototype screen 2c — "Assign a sitter", pushed over the tab bar.
 *
 * Two queries: the job itself (what's being assigned, plus the pet care notes an
 * owner needs while choosing) and `getAvailableEmployees`, which is the server's
 * own availability + conflict check for this exact job.
 *
 * **Every active member is listed and every one is selectable**, in a single
 * flat list ordered free-first, each row carrying the server's own conflict
 * reason inline. The availability check is advisory — `assignSitter` accepts
 * anyone — so refusing an unavailable sitter would be a rule the API doesn't
 * have, and it would make the screen unusable for any business that hasn't
 * configured weekly availability (every member comes back "No availability set
 * for this day"). Picking one flips the confirm button to "Assign anyway" and
 * shows the reason above it.
 *
 * The mockup's "★ 4.9 · 0.4 mi from client · Walked Biscuit 6×" line has no
 * backing in the schema — there's no per-sitter rating (reviews are per-
 * business), no member location to measure distance from, and no
 * jobs-with-this-pet count. Role is shown instead rather than inventing them.
 */
export function AssignSitterScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<OwnerManagerNavigation>();
    const { params } = useRoute<RouteProp<OwnerManagerStackParamList, 'AssignSitter'>>();
    const { jobId } = params;

    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const jobQuery = useQuery(GET_JOB, { variables: { jobId } });
    const employeesQuery = useQuery(GET_AVAILABLE_EMPLOYEES, { variables: { jobId } });

    const [assignSitter, { loading: assigning }] = useMutation(ASSIGN_SITTER, {
        // By operation name, so every active GetBusinessJobs refetches whatever
        // its variables are — the Today dashboard, both home sections, and the
        // Requests tab badge all watch that query with different filters.
        refetchQueries: ['GetBusinessJobs'],
        awaitRefetchQueries: true,
    });

    const job = jobQuery.data?.getJob;
    const entries = employeesQuery.data?.getAvailableEmployees ?? [];

    // One flat list, not Available/Unavailable sections. The split was purely
    // cosmetic — `getAvailableEmployees` is advisory and `assignSitter` accepts
    // anyone — so two headings implied a hard rule the API doesn't have, and
    // with availability usually unconfigured nearly everyone landed under
    // "Unavailable" anyway. Each row states its own conflict inline instead.
    //
    // Still ordered free-first: that's the one genuinely useful thing the split
    // did, and it survives without the headings.
    const sitters = [...entries].sort(
        (a, b) => Number(b.isAvailable) - Number(a.isAvailable),
    );

    const selected = entries.find((entry) => entry.member.id === selectedMemberId) ?? null;
    const overriding = selected != null && !selected.isAvailable;

    // Both lists render identically — only the grouping differs — so the row
    // stays one function rather than two copies that could drift apart.
    const renderSitter = (entry: AvailableEmployee) => (
        <SitterRow
            key={entry.member.id}
            entry={entry}
            selected={entry.member.id === selectedMemberId}
            onSelect={() => setSelectedMemberId(entry.member.id)}
        />
    );

    const handleAssign = async () => {
        if (selectedMemberId == null) return;
        setActionError(null);
        try {
            await assignSitter({ variables: { input: { jobId, assigneeId: selectedMemberId } } });
            navigation.goBack();
        } catch (err) {
            // CONFLICT is expected, not a bug: someone else may have assigned or
            // cancelled this job first. Same error-reading pattern as
            // NeedsAttentionSection and apolloClient's error link.
            setActionError(
                CombinedGraphQLErrors.is(err)
                    ? (err.errors[0]?.message ??
                      'Could not assign this job. It may have already been handled.')
                    : 'Could not assign this job. It may have already been handled.',
            );
        }
    };

    const loading = jobQuery.loading && job == null;
    const loadError = jobQuery.error ?? employeesQuery.error;

    return (
        <View style={styles.screen}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                </Pressable>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Assign a sitter</Text>
                    {job != null && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {job.service.title} · {job.pets.map((pet) => pet.name).join(', ')} ·{' '}
                            {formatShortDate(job.scheduledStartTime)}
                        </Text>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : loadError != null ? (
                <View style={[styles.centered, styles.padded]}>
                    <Text style={styles.errorTitle}>Couldn't load this job</Text>
                    <Text style={styles.errorBody}>{loadError.message}</Text>
                </View>
            ) : job == null ? null : (
                <>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <JobSummary job={job} />

                        {job.status !== 'ACCEPTED' && (
                            <Text style={styles.statusWarning}>
                                This job is {job.status.toLowerCase().replace('_', ' ')}, not accepted —
                                only accepted jobs can be assigned.
                            </Text>
                        )}

                        <Text style={styles.sectionHeading}>Choose a sitter</Text>
                        {sitters.length === 0 ? (
                            <Text style={styles.empty}>
                                This business has no active members to assign.
                            </Text>
                        ) : (
                            sitters.map(renderSitter)
                        )}
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                        {actionError != null && (
                            <Text style={styles.footerError}>{actionError}</Text>
                        )}
                        {overriding && selected != null && (
                            <Text style={styles.footerWarning}>
                                {selected.conflictReason ?? 'This sitter is marked unavailable.'}
                            </Text>
                        )}
                        <PillButton
                            label={
                                selected == null
                                    ? 'Select a sitter'
                                    : `${overriding ? 'Assign anyway' : 'Assign'} · ${shortName(selected.member.user.firstName, selected.member.user.lastName)}`
                            }
                            variant="primary"
                            onPress={() => void handleAssign()}
                            disabled={selectedMemberId == null || job.status !== 'ACCEPTED'}
                            loading={assigning}
                        />
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(15, 29, 27, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontFamily: fonts.headingBold,
        fontSize: 19,
        color: colors.text,
    },
    subtitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 12,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    padded: {
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(15, 29, 27, 0.08)',
        borderRadius: 18,
        padding: 16,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    rowLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 10.5,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: colors.textMuted,
        width: 74,
        paddingTop: 2,
    },
    rowValue: {
        flex: 1,
        fontFamily: fonts.bodySemiBold,
        fontSize: 13.5,
        lineHeight: 19,
        color: colors.text,
    },
    instructions: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        lineHeight: 19,
        color: colors.text,
    },
    careBanner: {
        backgroundColor: colors.accentChipBg,
        borderWidth: 1,
        borderColor: 'rgba(192, 139, 46, 0.3)',
        borderRadius: 14,
        paddingVertical: 11,
        paddingHorizontal: 14,
        gap: 4,
    },
    careText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        lineHeight: 17,
        color: colors.accentBannerText,
    },
    careFootnote: {
        fontFamily: fonts.bodyMedium,
        fontSize: 11,
        color: colors.accentBannerText,
        marginTop: 2,
    },
    statusWarning: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12.5,
        lineHeight: 18,
        color: colors.danger,
    },
    sectionHeading: {
        fontFamily: fonts.headingBold,
        fontSize: 14,
        color: colors.text,
        marginTop: 6,
    },
    sitterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(15, 29, 27, 0.12)',
        borderRadius: 18,
        paddingVertical: 15,
        paddingHorizontal: 16,
    },
    sitterCardSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sitterText: {
        flex: 1,
    },
    sitterName: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 14.5,
        color: colors.text,
    },
    sitterMeta: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        lineHeight: 17,
        color: colors.textMuted,
        marginTop: 2,
    },
    sitterMetaConflict: {
        color: colors.accentChipText,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(15, 29, 27, 0.3)',
    },
    radioSelected: {
        borderWidth: 7,
        borderColor: colors.primary,
    },
    empty: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.textMuted,
    },
    footer: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(15, 29, 27, 0.08)',
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 8,
    },
    footerError: {
        fontFamily: fonts.bodyMedium,
        fontSize: 12.5,
        color: colors.danger,
    },
    footerWarning: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        lineHeight: 17,
        color: colors.accentChipText,
    },
    errorTitle: {
        fontFamily: fonts.headingBold,
        fontSize: 18,
        color: colors.text,
        textAlign: 'center',
    },
    errorBody: {
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 8,
    },
});
