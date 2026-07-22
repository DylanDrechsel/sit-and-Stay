import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * The box's whole treatment, not just its number:
 *
 *   filled  — solid dark green, light text. The headline count.
 *   outline — white with a honey border. A secondary count.
 *   danger  — white with a red border and a red number. Something went wrong.
 */
export type StatVariant = 'filled' | 'outline' | 'danger';

const VARIANTS = {
    filled: {
        box: { backgroundColor: colors.primary, borderColor: colors.primary },
        value: { color: colors.textOnPrimary },
        label: { color: colors.onPrimary65 },
    },
    outline: {
        box: { backgroundColor: colors.surface, borderColor: colors.accent },
        value: { color: colors.accent },
        label: { color: colors.textMuted },
    },
    danger: {
        box: { backgroundColor: colors.surface, borderColor: colors.danger },
        value: { color: colors.danger },
        label: { color: colors.textMuted },
    },
} as const;

/**
 * One headline count — a big number over a small label, in a rounded box.
 *
 * Purely presentational and reusable wherever a compact stat is shown; the
 * owner/manager dashboard shows three side by side, which is why the box is
 * `flex: 1` and expects to sit in a row.
 */
export function StatBox({
    label,
    value,
    variant,
}: {
    label: string;
    value: number;
    variant: StatVariant;
}) {
    const theme = VARIANTS[variant];
    return (
        <View style={[styles.box, theme.box]}>
            <Text style={[styles.value, theme.value]}>{value}</Text>
            <Text style={[styles.label, theme.label]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flex: 1,
        // Same width on every variant so the row stays aligned — `filled` sets
        // its border to its own fill rather than dropping the border.
        borderWidth: 1.5,
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 14,
    },
    value: {
        fontFamily: fonts.headingExtraBold,
        fontSize: 30,
        lineHeight: 34,
    },
    label: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 11.5,
        lineHeight: 15,
        letterSpacing: 0.2,
        marginTop: 6,
    },
});
