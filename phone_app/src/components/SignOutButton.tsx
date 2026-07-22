import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * Ends the session. Shared by every role's home screen (and the no-roles state),
 * which is the only reason it's a component rather than three copies.
 *
 * Signing out clears the Apollo store as well as the token — see AuthContext.
 */
export function SignOutButton() {
    const { signOut } = useAuth();
    return (
        <Pressable onPress={() => void signOut()} style={styles.button}>
            <Text style={styles.label}>Sign out</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 24,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 14,
        color: colors.textMuted,
    },
});
