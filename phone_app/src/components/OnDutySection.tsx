import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client/react';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GET_BUSINESS_JOBS } from '../graphql/job';
import { formatElapsedMinutes } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessJob } from '../types/job';

/** One sitter currently mid-job. */
function OnDutyRow({ job }: { job: BusinessJob }) {
    const petNames = job.pets.map((pet) => pet.name).join(', ');
    // actualStartTime can't actually be null on a job this query already
    // filtered to IN_PROGRESS (clockIn sets it the moment that transition
    // happens) — this checks anyway because the schema doesn't encode that
    // guarantee, not because it's expected to happen. See the type comment.
    const elapsed = job.actualStartTime != null ? formatElapsedMinutes(job.actualStartTime) : null;

    return (
        <View style={styles.row}>
            <View style={styles.avatar}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            </View>
            <View style={styles.textBlock}>
                <Text style={styles.name} numberOfLines={1}>
                    {job.assignee?.user.firstName} {job.assignee?.user.lastName.charAt(0)}.
                </Text>
                <Text style={styles.status} numberOfLines={1}>
                    {job.service.title} · {petNames}
                    {elapsed != null ? ` · ${elapsed} in` : ''}
                </Text>
            </View>
            <View style={styles.liveDot} />
        </View>
    );
}

/**
 * "On duty now" from 2A: every job currently IN_PROGRESS, each showing the
 * assigned sitter, what they're doing, and how long they've been at it.
 *
 * Its own query (`statuses: ['IN_PROGRESS']`, unbounded by date) rather than
 * reading off the Today dashboard's job list — same reasoning as
 * NeedsAttentionSection: "on duty right now" isn't inherently a *today* concept
 * (a job spanning midnight would still be IN_PROGRESS), so this shouldn't
 * silently depend on the Today screen's date window matching reality.
 *
 * No "All ___" link, matching the prototype — unlike Needs your attention,
 * there's nowhere to send "see everyone on duty" today (Schedule and Team are
 * both still placeholders).
 */
export function OnDutySection({ businessId }: { businessId: string }) {
    const { data, loading, error } = useQuery(GET_BUSINESS_JOBS, {
        variables: { businessId, statuses: ['IN_PROGRESS'] },
    });

    const jobs = data?.getBusinessJobs ?? [];

    return (
        <View style={styles.section}>
            <Text style={styles.heading}>On duty now</Text>

            {loading && data == null ? null : error != null ? (
                <Text style={styles.errorText}>{error.message}</Text>
            ) : jobs.length === 0 ? (
                <Text style={styles.empty}>Nobody's on duty right now.</Text>
            ) : (
                <View style={styles.list}>
                    {jobs.map((job) => (
                        <OnDutyRow key={job.id} job={job} />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 26,
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 16,
        color: colors.text,
    },
    list: {
        marginTop: 12,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(15, 29, 27, 0.08)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        flex: 1,
    },
    name: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 13.5,
        color: colors.text,
    },
    status: {
        fontFamily: fonts.bodyBold,
        fontSize: 11.5,
        color: colors.onDutyStatus,
        marginTop: 2,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.onDutyDot,
    },
    empty: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 10,
    },
    errorText: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.danger,
        marginTop: 10,
    },
});
