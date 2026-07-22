import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * A tab that exists in the nav bar but has no screen behind it yet.
 *
 * It states what is missing and which query would fill it, rather than rendering
 * an empty list — an empty list is indistinguishable from a real query that
 * returned nothing, which is exactly the wrong thing to be ambiguous about while
 * the API is being wired up.
 */
export function PlaceholderScreen({
    title,
    note,
}: {
    title: string;
    note: string;
}) {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        >
            <Text style={styles.heading}>{title}</Text>
            <View style={styles.card}>
                <Text style={styles.note}>{note}</Text>
            </View>
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
        marginTop: 20,
    },
    note: {
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: colors.textMuted,
    },
});
