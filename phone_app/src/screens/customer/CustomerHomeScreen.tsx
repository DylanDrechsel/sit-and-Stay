import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SignOutButton } from '../../components/SignOutButton';
import { useSession } from '../../context/SessionContext';
import { formatToday } from '../../lib/datetime';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

/**
 * The customer (pet owner) home.
 *
 * **Placeholder.** Upcoming bookings (`getMyUpcomingJobs`), pets (`getMyPets`),
 * and sitter discovery (`getNearbyBusinesses`) all exist server-side but none
 * are wired up here yet.
 */
export function CustomerHomeScreen() {
    const insets = useSafeAreaInsets();
    const session = useSession();
    const profile = session.customerProfile;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={[
                styles.content,
                { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
            ]}
        >
            <Text style={styles.dateLabel}>{formatToday()}</Text>
            <Text style={styles.heading}>Hi, {session.user.firstName}</Text>

            {profile != null && (profile.city != null || profile.address != null) && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Your address</Text>
                    <Text style={styles.sectionBody}>
                        {profile.city ?? 'No city set'}
                        {profile.address != null ? ` · ${profile.address}` : ''}
                    </Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Upcoming</Text>
                <Text style={styles.sectionBody}>
                    Not built yet — this is where upcoming bookings will go, from getMyUpcomingJobs.
                </Text>
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
    },
    dateLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        color: colors.textMuted,
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.text,
        marginTop: 4,
    },
    section: {
        marginTop: 22,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    sectionLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.textMuted,
    },
    sectionBody: {
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: colors.text,
        marginTop: 8,
    },
});
