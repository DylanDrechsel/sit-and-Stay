import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SignOutButton } from '../../components/SignOutButton';
import { useActiveMembership, useSession } from '../../context/SessionContext';
import { formatToday } from '../../lib/datetime';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

/**
 * The employee/sitter "Today" home.
 *
 * **Placeholder.** It shows who and where the sitter is, and nothing more. The
 * sitter's own job list is `getMyJobs` (already built and tested server-side)
 * and is not wired up here yet — deliberately left empty rather than filled with
 * the business-wide list, which the API refuses to an EMPLOYEE anyway.
 */
export function EmployeeHomeScreen() {
    const insets = useSafeAreaInsets();
    const session = useSession();
    const membership = useActiveMembership();

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

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Sitting for</Text>
                <Text style={styles.sectionBody}>{membership.business.name}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your jobs</Text>
                <Text style={styles.sectionBody}>
                    Not built yet — this is where today's assigned jobs will go, from getMyJobs.
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
