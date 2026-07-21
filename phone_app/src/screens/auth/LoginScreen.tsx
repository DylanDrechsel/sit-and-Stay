import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { LOGIN } from '../../graphql/auth';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { loginSchema, type LoginFormValues } from '../../validation/auth';

type Props = {
    onBack?: () => void;
};

export function LoginScreen({ onBack }: Props) {
    const insets = useSafeAreaInsets();
    const { signIn } = useAuth();
    const [formError, setFormError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const [login, { loading }] = useMutation(LOGIN);

    const onSubmit = async (values: LoginFormValues) => {
        setFormError(null);
        try {
            const { data } = await login({ variables: { input: values } });
            if (data?.login.token) {
                await signIn(data.login.token);
                // No navigation call needed — RootNavigator swaps stacks off the
                // token in AuthContext, so setting it *is* the navigation.
            }
        } catch (error) {
            // The backend returns wrong-password and unknown-email identically,
            // so surface its message rather than inventing a more specific one.
            setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {onBack != null && (
                    <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
                        <Text style={styles.backLabel}>← Back</Text>
                    </Pressable>
                )}

                <Text style={styles.heading}>Welcome back</Text>
                <Text style={styles.subhead}>Sign in to manage your bookings and pets.</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                placeholder="you@example.com"
                                placeholderTextColor={colors.onPrimary45}
                                autoCapitalize="none"
                                autoComplete="email"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        )}
                    />
                    {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                style={[styles.input, errors.password && styles.inputError]}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                placeholder="Your password"
                                placeholderTextColor={colors.onPrimary45}
                                secureTextEntry
                                autoCapitalize="none"
                                autoComplete="current-password"
                                editable={!loading}
                                onSubmitEditing={handleSubmit(onSubmit)}
                                returnKeyType="go"
                            />
                        )}
                    />
                    {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}
                </View>

                {formError != null && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorBannerText}>{formError}</Text>
                    </View>
                )}

                <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                    style={({ pressed }) => [
                        styles.submitButton,
                        (pressed || loading) && styles.submitButtonPressed,
                    ]}
                >
                    {loading
                        ? <ActivityIndicator color={colors.primary} />
                        : <Text style={styles.submitLabel}>Sign in</Text>}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    backLabel: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        color: colors.onPrimary65,
    },
    heading: {
        fontFamily: fonts.headingBold,
        fontSize: 30,
        lineHeight: 35,
        letterSpacing: -0.45,
        color: colors.textOnPrimary,
    },
    subhead: {
        fontFamily: fonts.bodyMedium,
        fontSize: 15,
        lineHeight: 22,
        color: colors.onPrimary65,
        marginTop: 8,
        marginBottom: 32,
    },
    field: {
        marginBottom: 18,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        color: colors.onPrimary80,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.overlay10,
        borderWidth: 1,
        borderColor: colors.overlay20,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: fonts.bodyMedium,
        fontSize: 15,
        color: colors.textOnPrimary,
    },
    inputError: {
        borderColor: '#E5806B',
    },
    fieldError: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 12,
        color: '#E5806B',
        marginTop: 6,
    },
    errorBanner: {
        backgroundColor: 'rgba(229, 128, 107, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(229, 128, 107, 0.4)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
    },
    errorBannerText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 13,
        lineHeight: 18,
        color: '#F0B5A5',
    },
    submitButton: {
        backgroundColor: colors.textOnPrimary,
        borderRadius: 999,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        minHeight: 54,
    },
    submitButtonPressed: {
        opacity: 0.85,
    },
    submitLabel: {
        fontFamily: fonts.bodyExtraBold,
        fontSize: 15,
        color: colors.primary,
    },
});
