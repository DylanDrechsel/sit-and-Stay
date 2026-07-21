import { NetworkStatus } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import React from 'react';
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
import { BusinessTodayDashboard } from '../components/BusinessTodayDashboard';
import { useAuth } from '../context/AuthContext';
import { GET_SESSION } from '../graphql/session';
import { formatToday } from '../lib/datetime';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { BusinessRole } from '../types/session';

/** Sentence-case a role for display: OWNER -> Owner. */
const formatRole = (role: BusinessRole): string =>
    role.charAt(0) + role.slice(1).toLowerCase();

export function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();
    const { data, loading, error, refetch, networkStatus } = useQuery(GET_SESSION, {
        notifyOnNetworkStatusChange: true,
    });

    // Only a first load should blank the screen; a pull-to-refresh keeps the
    // existing content visible underneath the spinner.
    if (loading && data == null) {
        return (
            <View style={[styles.screen, styles.centered]}>
                <ActivityIndicator color={colors.mint} />
            </View>
        );
    }

    // An UNAUTHENTICATED error never lands here — the Apollo error link catches
    // it and signs out, which swaps this screen for the login stack. So anything
    // reaching this branch is a real failure (network down, server error) and is
    // worth a retry button rather than a sign-out.
    if (error != null) {
        return (
            <View style={[styles.screen, styles.centered, { paddingHorizontal: 24 }]}>
                <Text style={styles.errorTitle}>Couldn't load your session</Text>
                <Text style={styles.errorBody}>{error.message}</Text>
                <Pressable onPress={() => void refetch()} style={styles.retryButton}>
                    <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    const session = data?.getSession;
    if (session == null) return null;

    const { user, memberships, customerProfile } = session;

    // Owner/manager memberships drive the 2A dashboard; getBusinessJobs is gated
    // to those two roles. EMPLOYEE-only staff and customers still need a foothold
    // on this screen, so they're handled separately below. Staff-ness and
    // customer-ness stay independent facts — see src/types/session.ts.
    const managerMemberships = memberships.filter(
        (m) => m.role === 'OWNER' || m.role === 'MANAGER',
    );
    const employeeMemberships = memberships.filter((m) => m.role === 'EMPLOYEE');
    const isCustomer = customerProfile != null;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={[
                styles.content,
                { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
            ]}
            refreshControl={
                <RefreshControl
                    refreshing={networkStatus === NetworkStatus.refetch}
                    onRefresh={() => void refetch()}
                    tintColor={colors.mint}
                />
            }
        >
            {managerMemberships.length > 0 ? (
                // The 2A "Today" dashboard, one per business the caller runs.
                managerMemberships.map((membership) => (
                    <BusinessTodayDashboard
                        key={membership.id}
                        businessId={membership.business.id}
                        businessName={membership.business.name}
                    />
                ))
            ) : (
                // Not an owner/manager — keep the date header for continuity, but
                // greet by name instead of a business they don't run.
                <>
                    <Text style={styles.dateLabel}>{formatToday()}</Text>
                    <Text style={styles.heading}>Hi, {user.firstName}</Text>
                </>
            )}

            {employeeMemberships.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Also on staff at</Text>
                    {employeeMemberships.map((membership) => (
                        <View key={membership.id} style={styles.staffRow}>
                            <Text style={styles.staffName}>{membership.business.name}</Text>
                            <View style={styles.rolePill}>
                                <Text style={styles.rolePillText}>{formatRole(membership.role)}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {isCustomer && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Customer profile</Text>
                    <Text style={styles.profileText}>
                        {customerProfile.city ?? 'No city set'}
                        {customerProfile.address != null ? ` · ${customerProfile.address}` : ''}
                    </Text>
                </View>
            )}

            <Pressable onPress={() => void signOut()} style={styles.signOutButton}>
                <Text style={styles.signOutLabel}>Sign out</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 24,
    },
    // The non-owner/manager fallback header (customers, employee-only staff).
    dateLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        color: colors.onPrimary65,
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.textOnPrimary,
        marginTop: 4,
    },
    // Secondary sections below the dashboard: "Also on staff at", customer profile.
    section: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colors.overlay20,
    },
    sectionLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.onPrimary45,
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 10,
    },
    staffName: {
        flex: 1,
        fontFamily: fonts.bodyBold,
        fontSize: 14,
        color: colors.textOnPrimary,
    },
    rolePill: {
        backgroundColor: colors.overlay10,
        borderWidth: 1,
        borderColor: colors.overlay20,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    rolePillText: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 9,
        letterSpacing: 0.4,
        color: colors.onPrimary65,
    },
    profileText: {
        fontFamily: fonts.bodyMedium,
        fontSize: 12,
        lineHeight: 17,
        color: colors.onPrimary65,
        marginTop: 4,
    },
    errorTitle: {
        fontFamily: fonts.headingBold,
        fontSize: 18,
        color: colors.textOnPrimary,
        textAlign: 'center',
    },
    errorBody: {
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: colors.onPrimary65,
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        backgroundColor: colors.textOnPrimary,
        borderRadius: 999,
        paddingHorizontal: 28,
        paddingVertical: 13,
        marginTop: 20,
    },
    retryLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 14,
        color: colors.primary,
    },
    signOutButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 24,
    },
    signOutLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 14,
        color: colors.onPrimary65,
    },
});
