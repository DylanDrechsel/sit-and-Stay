import { ApolloProvider } from '@apollo/client/react';
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { apolloClient } from './src/lib/apolloClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  // Every family referenced in src/theme/typography.ts has to be registered
  // here, or Text silently falls back to the system font.
  const [fontsLoaded] = useFonts({
    Sora_700Bold,
    Sora_800ExtraBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    // ApolloProvider is outside AuthProvider because AuthProvider's sign-out
    // path calls apolloClient.clearStore().
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <SafeAreaProvider>
          {/* Hold on the brand colour rather than flashing white while fonts load. */}
          {fontsLoaded ? (
            <RootNavigator />
          ) : (
            <View style={{ flex: 1, backgroundColor: colors.primary }} />
          )}
          <StatusBar style="light" />
        </SafeAreaProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
