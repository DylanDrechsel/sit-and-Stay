import { useQuery } from '@apollo/client/react';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GET_BUSINESS_JOBS } from '../graphql/job';
import { formatToday } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { JobListItem } from './JobListItem';
import { StatBox } from './StatBox';

/**
 * The owner/manager "Today" dashboard for one business — the 2A screen: today's
 * date, the business name, and three headline counts, over today's job list.
 *
 * Owns its own useQuery (rather than the caller fetching in a memberships .map)
 * so each business fetches independently — a hook can't be called in a loop, and
 * one query per business is the natural shape when someone runs several.
 *
 * "Today" is the DEVICE's local day, computed here as from/to. The server has no
 * per-business timezone, so a server-side "current date" would be UTC and wrong
 * at the day's edges — the client, which knows its offset, draws the boundary.
 * Only render this for OWNER/MANAGER: getBusinessJobs returns FORBIDDEN to
 * anyone else.
 */
export function BusinessTodayDashboard({
    businessId,
    businessName,
}: {
    businessId: string;
    businessName: string;
}) {
    // Pinned to local midnight, computed once on mount. Deliberately not live:
    // an app left open past midnight keeps yesterday's window until refetch,
    // which is fine for a home dashboard and avoids a re-render timer.
    const { from, to } = useMemo(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { from: start.toISOString(), to: end.toISOString() };
    }, []);

    const { data, loading, error } = useQuery(GET_BUSINESS_JOBS, {
        variables: { businessId, from, to },
    });

    const jobs = data?.getBusinessJobs ?? [];

    // The three headline counts, all off the one fetch. "Active" = not called
    // off, so a cancelled job isn't counted as a job still happening today nor
    // as one needing a sitter — it only lands in the Cancelled box.
    const activeJobs = jobs.filter((job) => job.status !== 'CANCELLED' && job.status !== 'DECLINED');
    const jobsToday = activeJobs.length;
    const unassigned = activeJobs.filter((job) => job.assignee == null).length;
    const cancelledToday = jobs.filter((job) => job.status === 'CANCELLED').length;

    return (
        <View style={styles.dashboard}>
            <Text style={styles.dateLabel}>{formatToday()}</Text>
            <Text style={styles.businessName}>{businessName}</Text>

            {loading && data == null ? (
                <ActivityIndicator color={colors.mint} style={styles.spinner} />
            ) : error != null ? (
                <Text style={styles.error}>{error.message}</Text>
            ) : (
                <>
                    <View style={styles.statRow}>
                        <StatBox label="Jobs today" value={jobsToday} tone="mint" />
                        <StatBox label="Unassigned" value={unassigned} tone="plain" />
                        <StatBox label="Cancelled today" value={cancelledToday} tone="accent" />
                    </View>

                    <View style={styles.jobsSection}>
                        <Text style={styles.jobsSectionLabel}>Today's jobs</Text>
                        {jobs.length === 0 ? (
                            <Text style={styles.empty}>Nothing scheduled today.</Text>
                        ) : (
                            jobs.map((job) => <JobListItem key={job.id} job={job} />)
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    dashboard: {
        marginBottom: 8,
    },
    dateLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        color: colors.onPrimary65,
    },
    businessName: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.textOnPrimary,
        marginTop: 4,
    },
    spinner: {
        alignSelf: 'flex-start',
        marginTop: 24,
    },
    statRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 22,
    },
    jobsSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.overlay20,
    },
    jobsSectionLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.onPrimary45,
    },
    empty: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.onPrimary65,
        marginTop: 8,
    },
    error: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.accent,
        marginTop: 8,
    },
});
