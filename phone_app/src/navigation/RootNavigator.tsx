import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { colors } from '../theme/colors';
import { AppContainer } from './AppContainer';

/**
 * Param list for the signed-out stack. Every screen takes no params today;
 * keeping the type here means adding one later is a compile error at the call
 * site rather than a runtime undefined.
 *
 * The signed-in side has no single param list — each role app owns its own
 * (OwnerManagerStackParamList, EmployeeStackParamList, CustomerStackParamList).
 */
export type AuthStackParamList = {
    Welcome: undefined;
    Login: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Signed-out and signed-in are swapped by conditional rendering on auth state
 * rather than navigated between. This is React Navigation's documented auth-flow
 * pattern and it matters for correctness, not just style: there's no reset() to
 * forget, and no window where a signed-out user can hardware-back into a
 * signed-in screen, because the signed-in screens aren't mounted at all.
 *
 * With a token, everything else is AppContainer's problem: it loads the session
 * and picks the role app. This component deliberately knows nothing about roles.
 */
export function RootNavigator() {
    const { token, isRestoring } = useAuth();

    // Hold on the brand colour while the keychain read finishes. Without this
    // the login screen flashes for a frame on every cold start of an already
    // signed-in app.
    if (isRestoring) {
        return <View style={{ flex: 1, backgroundColor: colors.primary }} />;
    }

    return (
        <NavigationContainer>
            {token == null ? (
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="Welcome">
                        {({ navigation }) => (
                            <WelcomeScreen onContinueWithEmail={() => navigation.navigate('Login')} />
                        )}
                    </AuthStack.Screen>
                    <AuthStack.Screen name="Login">
                        {({ navigation }) => (
                            <LoginScreen onBack={() => navigation.goBack()} />
                        )}
                    </AuthStack.Screen>
                </AuthStack.Navigator>
            ) : (
                <AppContainer />
            )}
        </NavigationContainer>
    );
}
