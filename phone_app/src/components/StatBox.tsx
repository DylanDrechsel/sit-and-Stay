import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/** Which palette colour the number takes; the label always stays muted. */
export type StatTone = 'mint' | 'plain' | 'accent';

/**
 * One headline count — a big number over a muted label, in a bordered box.
 * Presentational and reusable wherever a compact stat is shown (the owner/manager
 * dashboard shows three side by side). `tone` colours the number only: `mint` for
 * a normal count, `accent` for one that wants attention, `plain` for neutral.
 */
export function StatBox({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: StatTone;
}) {
    const valueColor =
        tone === 'mint' ? colors.mint : tone === 'accent' ? colors.accent : colors.textOnPrimary;
    return (
        <View style={styles.box}>
            <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flex: 1,
        backgroundColor: colors.overlay10,
        borderWidth: 1,
        borderColor: colors.overlay20,
        borderRadius: 18,
        paddingVertical: 16,
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
        color: colors.onPrimary65,
        marginTop: 6,
    },
});
