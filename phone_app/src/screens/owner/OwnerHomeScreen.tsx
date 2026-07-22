import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessTodayDashboard } from '../../components/BusinessTodayDashboard';
import { NeedsAttentionSection } from '../../components/NeedsAttentionSection';
import { OnDutySection } from '../../components/OnDutySection';
import { useActiveMembership } from '../../context/SessionContext';
import { GET_BUSINESS_JOBS } from '../../graphql/job';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

/**
 * The owner/manager "Today" home — screen 2A.
 *
 * Owns the data: it fetches today's jobs and hands them to the presentational
 * dashboard, which keeps pull-to-refresh and the loading/error states on the
 * screen where the query lives.
 *
 * "Today" is the DEVICE's local day. The server has no per-business timezone, so
 * a server-side "current date" would be UTC and wrong at the day's edges — the
 * client, which knows its offset, draws the boundary.
 */
export function OwnerHomeScreen() {
    const insets = useSafeAreaInsets();
    const membership = useActiveMembership();
    const business = membership.business;

    // Pinned to local midnight, computed once on mount. Deliberately not live:
    // an app left open past midnight keeps yesterday's window until the next
    // refresh, which is fine here and avoids a re-render timer.
    const { from, to } = useMemo(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { from: start.toISOString(), to: end.toISOString() };
    }, []);

    const { data, loading, error, refetch, networkStatus } = useQuery(GET_BUSINESS_JOBS, {
        variables: { businessId: business.id, from, to },
        notifyOnNetworkStatusChange: true,
    });

    if (loading && data == null) {
        return (
            <View style={[styles.screen, styles.centered]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (error != null) {
        return (
            <View style={[styles.screen, styles.centered, styles.padded]}>
                <Text style={styles.errorTitle}>Couldn't load today's jobs</Text>
                <Text style={styles.errorBody}>{error.message}</Text>
                <Pressable onPress={() => void refetch()} style={styles.retryButton}>
                    <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.screen}
            // Only the top inset is ours — the tab bar sits below this screen and
            // owns the bottom safe area, so adding insets.bottom here would pad twice.
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
            refreshControl={
                <RefreshControl
                    refreshing={networkStatus === NetworkStatus.refetch}
                    onRefresh={() => void refetch()}
                    tintColor={colors.primary}
                />
            }
        >
            <BusinessTodayDashboard
                businessName={business.name}
                jobs={data?.getBusinessJobs ?? []}
            />
            <NeedsAttentionSection businessId={business.id} />
            <OnDutySection businessId={business.id} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    padded: {
        paddingHorizontal: 24,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 32,
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
    retryButton: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        paddingHorizontal: 28,
        paddingVertical: 13,
        marginTop: 20,
    },
    retryLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 14,
        color: colors.textOnPrimary,
    },
});
