import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACCEPT_JOB, DECLINE_JOB, GET_BUSINESS_JOBS } from '../graphql/job';
import { formatShortDate } from '../lib/datetime';
import type { OwnerManagerNavigation } from '../navigation/ownerManagerTypes';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { RequestCard } from './RequestCard';

/**
 * The "Needs your attention" block from 2A: two different things a job can
 * need from an owner/manager, each requiring a different action —
 *
 *   - PENDING: not yet answered. Rendered as `<RequestCard>`s with
 *     accept/decline.
 *   - ACCEPTED with no assignee: already agreed to, but nobody's covering it.
 *     One compact row each, with its own "Assign" into the AssignSitter screen.
 *     Deliberately a row rather than a full RequestCard: assigning is its own
 *     flow (availability, conflicts, care notes), so this only has to identify
 *     the job and get you there. The prototype shows a single summary banner
 *     with one "Assign" link, which reads well but can't say *which* job it
 *     assigns once there's more than one — hence one row per job here.
 *
 * These are easy to conflate with the Today dashboard's "Unassigned" stat box,
 * which is NOT the same set: that box counts anything scheduled *today* with no
 * assignee (PENDING or ACCEPTED), so its number can legitimately be higher than
 * what appears here if an unassigned job isn't in either state — there is none
 * today, but the reverse could happen if some ACCEPTED-but-unassigned job is for
 * a future date, appearing here but not in that count.
 *
 * One query for both (`statuses: ['PENDING', 'ACCEPTED']`), split client-side —
 * deliberately unbounded by `from`/`to`, unlike the Today dashboard's job list:
 * a request made today can be for a session next week ("starts Tue Jul 15"), so
 * a date-bounded query would silently miss it.
 *
 * Also self-contained on refresh: it isn't wired into OwnerHomeScreen's
 * pull-to-refresh (that pulls the Today dashboard's own query). It refetches
 * itself after every accept/decline, which is the case that actually needs to
 * be fresh — the tradeoff is a manual pull-to-refresh on the parent screen
 * won't also refresh this section.
 */
export function NeedsAttentionSection({ businessId }: { businessId: string }) {
    const navigation = useNavigation<OwnerManagerNavigation>();

    const { data, loading, error, refetch } = useQuery(GET_BUSINESS_JOBS, {
        variables: { businessId, statuses: ['PENDING', 'ACCEPTED'] },
    });

    const [acceptJob] = useMutation(ACCEPT_JOB);
    const [declineJob] = useMutation(DECLINE_JOB);

    // Tracks which single card has an action in flight, and what kind — one
    // useMutation hook is shared by every card, so its own `loading` flag can't
    // tell two cards apart on its own.
    const [pendingAction, setPendingAction] = useState<
        { jobId: string; kind: 'accept' | 'decline' } | null
    >(null);
    // Ephemeral: cleared by the next attempt. There's no toast system in this
    // app yet — see AI_MANIFEST_FRONTEND.md §11 — so this is a plain inline line
    // rather than something that queues or auto-dismisses.
    const [actionError, setActionError] = useState<string | null>(null);

    // CombinedGraphQLErrors.message is a formatted summary of every error in the
    // response; .errors[i].message is the exact string the resolver threw (e.g.
    // jobTransition.ts's CONFLICT text). Same pattern apolloClient.ts's error
    // link already uses for UNAUTHENTICATED — matched here rather than a
    // generic `instanceof Error` check, so the real reason reaches the user.
    const describeError = (err: unknown, fallback: string): string => {
        if (CombinedGraphQLErrors.is(err)) return err.errors[0]?.message ?? fallback;
        return fallback;
    };

    const handleAccept = async (jobId: string) => {
        setActionError(null);
        setPendingAction({ jobId, kind: 'accept' });
        try {
            await acceptJob({ variables: { jobId } });
            await refetch();
        } catch (err) {
            // A CONFLICT here is a real, expected outcome, not a bug — see
            // backend/src/graphQL/resolvers/job/jobTransition.ts. Someone else
            // (or this same owner, double-tapping) already resolved it first.
            setActionError(
                describeError(err, 'Could not accept this request. It may have already been handled.'),
            );
            await refetch();
        } finally {
            setPendingAction(null);
        }
    };

    const handleDecline = async (jobId: string) => {
        setActionError(null);
        setPendingAction({ jobId, kind: 'decline' });
        try {
            await declineJob({ variables: { jobId } });
            await refetch();
        } catch (err) {
            setActionError(
                describeError(err, 'Could not decline this request. It may have already been handled.'),
            );
            await refetch();
        } finally {
            setPendingAction(null);
        }
    };

    const jobs = data?.getBusinessJobs ?? [];

    // Oldest-created first — the request that's been waiting longest is the one
    // that most needs attention. getBusinessJobs itself orders by
    // scheduledStartTime, not createdAt, so this re-sorts client-side. Every
    // PENDING job renders — no cap.
    const pending = jobs
        .filter((job) => job.status === 'PENDING')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const needsSitter = jobs
        .filter((job) => job.status === 'ACCEPTED' && job.assignee == null)
        .sort(
            (a, b) =>
                new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime(),
        );

    const hasNothingToShow = pending.length === 0 && needsSitter.length === 0;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.heading}>Needs your attention</Text>
                <Pressable onPress={() => navigation.navigate('Requests')}>
                    <Text style={styles.link}>All requests</Text>
                </Pressable>
            </View>

            {actionError != null && <Text style={styles.errorText}>{actionError}</Text>}

            {loading && data == null ? null : error != null ? (
                <Text style={styles.errorText}>{error.message}</Text>
            ) : hasNothingToShow ? (
                <Text style={styles.empty}>You're all caught up.</Text>
            ) : (
                <>
                    {pending.length > 0 && (
                        <View style={styles.cardList}>
                            {pending.map((job) => (
                                <RequestCard
                                    key={job.id}
                                    job={job}
                                    onAccept={() => void handleAccept(job.id)}
                                    onDecline={() => void handleDecline(job.id)}
                                    isAccepting={pendingAction?.jobId === job.id && pendingAction.kind === 'accept'}
                                    isDeclining={pendingAction?.jobId === job.id && pendingAction.kind === 'decline'}
                                />
                            ))}
                        </View>
                    )}

                    {needsSitter.map((job) => (
                        <View key={job.id} style={styles.sitterBanner}>
                            <View style={styles.sitterDot} />
                            <Text style={styles.sitterText} numberOfLines={2}>
                                {job.service.title} · {job.pets.map((pet) => pet.name).join(', ')} ·{' '}
                                {formatShortDate(job.scheduledStartTime)} needs a sitter
                            </Text>
                            <Pressable
                                onPress={() => navigation.navigate('AssignSitter', { jobId: job.id })}
                            >
                                <Text style={styles.sitterLink}>Assign</Text>
                            </Pressable>
                        </View>
                    ))}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 26,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 16,
        color: colors.text,
    },
    link: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 12.5,
        color: colors.link,
    },
    cardList: {
        marginTop: 12,
        gap: 12,
    },
    sitterBanner: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.accentChipBg,
        borderWidth: 1,
        borderColor: 'rgba(192, 139, 46, 0.3)',
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 15,
    },
    sitterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent,
    },
    sitterText: {
        flex: 1,
        fontFamily: fonts.bodyBold,
        fontSize: 12.5,
        lineHeight: 17,
        color: colors.accentBannerText,
    },
    sitterLink: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 12,
        color: colors.accentChipText,
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
