import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * `primary` — solid fill, the affirmative/default action (e.g. "Accept & assign").
 * `secondary` — outlined, a lesser but still real action (e.g. "Decline").
 *
 * Deliberately not `danger`/`destructive` yet — nothing has called for one. Add
 * a variant here rather than a one-off styled Pressable elsewhere, so every pill
 * button in the app stays visually identical.
 */
export type PillButtonVariant = 'primary' | 'secondary';

export function PillButton({
    label,
    onPress,
    variant,
    disabled,
    loading,
    style,
}: {
    label: string;
    onPress: () => void;
    variant: PillButtonVariant;
    disabled?: boolean;
    /** Replaces the label with a spinner and implies `disabled`. */
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
}) {
    const isDisabled = disabled === true || loading === true;
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={[
                styles.base,
                variant === 'primary' ? styles.primary : styles.secondary,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading === true ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? colors.textOnPrimary : colors.textSecondary}
                />
            ) : (
                <Text style={variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel}>
                    {label}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        paddingVertical: 11,
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        // colors.primary (#0F1D1B = rgb(15,29,27)) at 15% opacity — React Native
        // has no color-mix, so this stays a literal tuple rather than derived.
        borderColor: 'rgba(15, 29, 27, 0.15)',
    },
    disabled: {
        opacity: 0.5,
    },
    primaryLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 13,
        color: colors.textOnPrimary,
    },
    secondaryLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 13,
        color: colors.textSecondary,
    },
});
