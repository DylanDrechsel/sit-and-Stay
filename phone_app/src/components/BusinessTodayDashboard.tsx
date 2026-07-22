import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatToday } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessJob } from '../types/job';
import { StatBox } from './StatBox';

/**
 * The owner/manager "Today" dashboard — screen 2A: today's date, the business
 * name, and four headline counts derived from today's jobs.
 *
 * Takes the raw job list (not just three numbers) because the counts are its
 * own derived state, not something the caller should have to compute — but it
 * no longer renders the jobs themselves; a full job list wasn't wanted here.
 *
 * Presentational: the caller fetches and owns the jobs (see OwnerHomeScreen), so
 * loading, errors, and pull-to-refresh live with the query rather than in here.
 */
export function BusinessTodayDashboard({
    businessName,
    jobs,
}: {
    businessName: string;
    jobs: BusinessJob[];
}) {
    // The four headline counts, all derived from the one job list. "Active" =
    // not called off, so a cancelled job doesn't also count toward the other
    // three — it only lands in the Cancelled box.
    //
    // Unassigned and Needs a sitter are deliberately split, not one lumped
    // "no assignee" count: PENDING hasn't even been accepted yet (nothing to
    // assign until someone decides), while ACCEPTED has been agreed to and is
    // specifically waiting on a sitter. Same reasoning as NeedsAttentionSection,
    // which is why the two dashboards' definitions match — see that component's
    // doc for how this differs from ITS "needs a sitter" count (this one is
    // scoped to today; that one is unbounded by date).
    const activeJobs = jobs.filter((job) => job.status !== 'CANCELLED' && job.status !== 'DECLINED');
    const jobsToday = activeJobs.length;
    const unassigned = activeJobs.filter(
        (job) => job.status === 'PENDING' && job.assignee == null,
    ).length;
    const needsSitter = activeJobs.filter(
        (job) => job.status === 'ACCEPTED' && job.assignee == null,
    ).length;
    const cancelledToday = jobs.filter((job) => job.status === 'CANCELLED').length;

    return (
        <View>
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <Text style={styles.dateLabel}>{formatToday()}</Text>
                    <Text style={styles.businessName} numberOfLines={1}>
                        {businessName}
                    </Text>
                </View>
                {/* Deliberately a plain View, not a Pressable — there is no
                    notification system behind this yet (no Message/Conversation
                    resolvers exist server-side; see AI_MANIFEST_FRONTEND.md §11),
                    so there's nothing for a tap to do. Same "looks right, does
                    nothing yet" treatment as WelcomeScreen's OAuth buttons. No
                    unread-count dot either — showing one with no real unread
                    data behind it would just be a lie. */}
                <View style={styles.bellButton}>
                    <Ionicons name="notifications-outline" size={18} color={colors.text} />
                </View>
            </View>

            <View style={styles.statRow}>
                <StatBox label="jobs today" value={jobsToday} variant="filled" />
                <StatBox label="unassigned" value={unassigned} variant="outline" />
                <StatBox label="needs sitter" value={needsSitter} variant="outline" />
                <StatBox label="cancelled today" value={cancelledToday} variant="danger" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    headerText: {
        flex: 1,
    },
    bellButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(15, 29, 27, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        color: colors.textMuted,
    },
    businessName: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.text,
        marginTop: 4,
    },
    statRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 22,
    },
});
