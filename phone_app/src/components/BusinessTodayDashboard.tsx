import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatToday } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessJob } from '../types/job';
import { JobListItem } from './JobListItem';
import { StatBox } from './StatBox';

/**
 * The owner/manager "Today" dashboard — screen 2A: today's date, the business
 * name, three headline counts, and today's job list.
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
    // The three headline counts, all derived from the one job list. "Active" =
    // not called off, so a cancelled job counts as neither still-happening nor
    // needing a sitter — it only lands in the Cancelled box.
    const activeJobs = jobs.filter((job) => job.status !== 'CANCELLED' && job.status !== 'DECLINED');
    const jobsToday = activeJobs.length;
    const unassigned = activeJobs.filter((job) => job.assignee == null).length;
    const cancelledToday = jobs.filter((job) => job.status === 'CANCELLED').length;

    return (
        <View>
            <Text style={styles.dateLabel}>{formatToday()}</Text>
            <Text style={styles.businessName}>{businessName}</Text>

            <View style={styles.statRow}>
                <StatBox label="jobs today" value={jobsToday} variant="filled" />
                <StatBox label="unassigned" value={unassigned} variant="outline" />
                <StatBox label="cancelled today" value={cancelledToday} variant="danger" />
            </View>

            <View style={styles.jobsSection}>
                <Text style={styles.jobsSectionLabel}>Today's jobs</Text>
                {jobs.length === 0 ? (
                    <Text style={styles.empty}>Nothing scheduled today.</Text>
                ) : (
                    jobs.map((job) => <JobListItem key={job.id} job={job} />)
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    jobsSection: {
        marginTop: 26,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    jobsSectionLabel: {
        fontFamily: fonts.headingBold,
        fontSize: 17,
        letterSpacing: -0.2,
        color: colors.text,
    },
    empty: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 10,
    },
});
