import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { colors } from '../theme/colors';

/**
 * Param lists. Every screen takes no params today; keeping the types here means
 * adding one later is a compile error at the call site rather than a runtime
 * undefined.
 */
export type AuthStackParamList = {
    Welcome: undefined;
    Login: undefined;
};

export type AppStackParamList = {
    Home: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

/**
 * The two stacks are swapped by conditional rendering on auth state rather than
 * navigated between. This is React Navigation's documented auth-flow pattern and
 * it matters for correctness, not just style: there's no reset() to forget, and
 * no window where a signed-out user can hardware-back into a signed-in screen,
 * because the signed-in screens aren't mounted at all.
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
                <AppStack.Navigator screenOptions={{ headerShown: false }}>
                    <AppStack.Screen name="Home" component={HomeScreen} />
                </AppStack.Navigator>
            )}
        </NavigationContainer>
    );
}
