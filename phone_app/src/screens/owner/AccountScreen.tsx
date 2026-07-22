import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SignOutButton } from '../../components/SignOutButton';
import { useActiveMembership, useSession } from '../../context/SessionContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import type { BusinessRole } from '../../types/session';

/** Sentence-case a role for display: OWNER -> Owner. */
const formatRole = (role: BusinessRole): string =>
    role.charAt(0) + role.slice(1).toLowerCase();

/**
 * Account tab. Identity and sign-out — everything here comes from the session
 * already in context, so it makes no query of its own.
 *
 * Editing a profile (`updateUser`, `changeEmail`, `changePassword`) is not built
 * yet; this is read-only.
 */
export function AccountScreen() {
    const insets = useSafeAreaInsets();
    const session = useSession();
    const membership = useActiveMembership();
    const { user } = session;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        >
            <Text style={styles.heading}>Account</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Signed in as</Text>
                <Text style={styles.value}>
                    {user.firstName} {user.lastName}
                </Text>
                <Text style={styles.meta}>{user.email}</Text>
                {user.phone != null && <Text style={styles.meta}>{user.phone}</Text>}
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Business</Text>
                <Text style={styles.value}>{membership.business.name}</Text>
                <Text style={styles.meta}>{formatRole(membership.role)}</Text>
            </View>

            <SignOutButton />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.text,
    },
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 16,
        marginTop: 16,
    },
    label: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.textMuted,
    },
    value: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        color: colors.text,
        marginTop: 8,
    },
    meta: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        lineHeight: 19,
        color: colors.textMuted,
        marginTop: 4,
    },
});
