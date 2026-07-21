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
import { useAuth } from '../context/AuthContext';
import { GET_SESSION } from '../graphql/session';
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

    // The two independent facts getSession exists to express. Note `isStaff` is
    // derived from the membership list, and `isCustomer` from the profile —
    // NOT from each other. A removed owner is neither, which is why this isn't
    // an if/else. See src/types/session.ts.
    const isStaff = memberships.length > 0;
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
            <Text style={styles.greeting}>Hi, {user.firstName}</Text>
            <Text style={styles.email}>{user.email}</Text>

            <View style={styles.badgeRow}>
                {isStaff && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Staff</Text>
                    </View>
                )}
                {isCustomer && (
                    <View style={[styles.badge, styles.badgeCustomer]}>
                        <Text style={[styles.badgeText, styles.badgeCustomerText]}>Customer</Text>
                    </View>
                )}
                {!isStaff && !isCustomer && (
                    <View style={[styles.badge, styles.badgeNeutral]}>
                        <Text style={[styles.badgeText, styles.badgeNeutralText]}>No active roles</Text>
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>
                {memberships.length === 1 ? 'Your business' : 'Your businesses'}
            </Text>

            {isStaff ? (
                memberships.map((membership) => (
                    <View key={membership.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{membership.business.name}</Text>
                            <View style={styles.rolePill}>
                                <Text style={styles.rolePillText}>{formatRole(membership.role)}</Text>
                            </View>
                        </View>
                        {membership.business.city != null && (
                            <Text style={styles.cardMeta}>{membership.business.city}</Text>
                        )}
                        <Text style={styles.cardMeta}>
                            Joined {new Date(membership.joinedAt).toLocaleDateString()}
                        </Text>
                        {!membership.business.isActive && (
                            <Text style={styles.cardWarning}>This business is deactivated</Text>
                        )}
                    </View>
                ))
            ) : (
                <View style={styles.card}>
                    <Text style={styles.cardMeta}>You're not a member of any business.</Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Customer profile</Text>
            <View style={styles.card}>
                {isCustomer ? (
                    <>
                        <Text style={styles.cardTitle}>Active</Text>
                        <Text style={styles.cardMeta}>
                            {customerProfile.city ?? 'No city set'}
                            {customerProfile.address != null ? ` · ${customerProfile.address}` : ''}
                        </Text>
                    </>
                ) : (
                    <Text style={styles.cardMeta}>
                        No customer profile — this account can't book services yet.
                    </Text>
                )}
            </View>

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
    greeting: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.textOnPrimary,
    },
    email: {
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        color: colors.onPrimary65,
        marginTop: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    badge: {
        backgroundColor: 'rgba(127, 214, 160, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(127, 214, 160, 0.45)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    badgeText: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 11,
        letterSpacing: 0.4,
        color: colors.mint,
    },
    badgeCustomer: {
        backgroundColor: 'rgba(192, 139, 46, 0.18)',
        borderColor: 'rgba(192, 139, 46, 0.45)',
    },
    badgeCustomerText: {
        color: colors.accent,
    },
    badgeNeutral: {
        backgroundColor: colors.overlay10,
        borderColor: colors.overlay20,
    },
    badgeNeutralText: {
        color: colors.onPrimary65,
    },
    sectionTitle: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 12,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: colors.onPrimary45,
        marginTop: 32,
        marginBottom: 12,
    },
    card: {
        backgroundColor: colors.overlay10,
        borderWidth: 1,
        borderColor: colors.overlay20,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    cardTitle: {
        flex: 1,
        fontFamily: fonts.headingBold,
        fontSize: 17,
        color: colors.textOnPrimary,
    },
    rolePill: {
        backgroundColor: colors.mint,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    rolePillText: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 10,
        letterSpacing: 0.5,
        color: colors.primary,
    },
    cardMeta: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        lineHeight: 19,
        color: colors.onPrimary65,
        marginTop: 6,
    },
    cardWarning: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        color: colors.accent,
        marginTop: 8,
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
