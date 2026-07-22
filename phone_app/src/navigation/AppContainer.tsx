import { useQuery } from '@apollo/client/react';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SessionProvider } from '../context/SessionContext';
import { GET_SESSION } from '../graphql/session';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import type { Session } from '../types/session';
import { SignOutButton } from '../components/SignOutButton';
import { CustomerApp } from './CustomerApp';
import { EmployeeApp } from './EmployeeApp';
import { OwnerManagerApp } from './OwnerManagerApp';

/** Which role-specific app a signed-in user lands in. */
export type AppKind = 'ownerManager' | 'employee' | 'customer' | 'none';

/**
 * Decides which app a signed-in user gets.
 *
 * **Staff wins over customer.** Someone who both runs a business and books as a
 * customer lands in the staff app. That is a precedence *choice*, not a fact
 * about the data — staff-ness and customer-ness are independent and a user can
 * hold both at once (the `customer.test1` test account is an active MANAGER and
 * a customer simultaneously). The real answer is an in-app context switcher
 * (AI_MANIFEST_FRONTEND.md §8); until that exists, this is the default landing.
 *
 * Only the first membership is considered — see `useActiveMembership` for why
 * this app assumes one business per user and where that assumption lives.
 *
 * `none` is reachable and is not an error: an owner soft-removed by
 * `removeMember` keeps neither a membership nor a CustomerProfile.
 */
export const resolveAppKind = (session: Session): AppKind => {
    const membership = session.memberships[0];
    if (membership != null) {
        return membership.role === 'EMPLOYEE' ? 'employee' : 'ownerManager';
    }
    return session.customerProfile != null ? 'customer' : 'none';
};

/**
 * The signed-in half of the app.
 *
 * One job: load the session once, then hand off to the right role app. Every
 * screen below this point can read the session synchronously through
 * `useSession()` instead of re-querying or prop-drilling it.
 *
 * Rendered only when a token exists (see RootNavigator), so an absent session
 * here means a real failure rather than a signed-out user.
 */
export function AppContainer() {
    const { data, loading, error, refetch } = useQuery(GET_SESSION);

    if (loading && data == null) {
        return (
            <View style={[styles.screen, styles.centered]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    // An UNAUTHENTICATED error never lands here — the Apollo error link catches
    // it and signs out, which swaps this whole tree for the login stack. So
    // anything reaching this branch is a real failure (network down, server
    // error) and is worth a retry rather than a sign-out.
    if (error != null) {
        return (
            <View style={[styles.screen, styles.centered, styles.padded]}>
                <Text style={styles.title}>Couldn't load your session</Text>
                <Text style={styles.body}>{error.message}</Text>
                <Pressable onPress={() => void refetch()} style={styles.retryButton}>
                    <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    const session = data?.getSession;
    if (session == null) return null;

    const appKind = resolveAppKind(session);

    if (appKind === 'none') {
        return (
            <View style={[styles.screen, styles.centered, styles.padded]}>
                <Text style={styles.title}>No active roles</Text>
                <Text style={styles.body}>
                    This account isn't a member of a business and hasn't booked as a customer, so
                    there's nothing to show yet.
                </Text>
                <SignOutButton />
            </View>
        );
    }

    return (
        <SessionProvider session={session}>
            {appKind === 'ownerManager' && <OwnerManagerApp />}
            {appKind === 'employee' && <EmployeeApp />}
            {appKind === 'customer' && <CustomerApp />}
        </SessionProvider>
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
    title: {
        fontFamily: fonts.headingBold,
        fontSize: 18,
        color: colors.text,
        textAlign: 'center',
    },
    body: {
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
