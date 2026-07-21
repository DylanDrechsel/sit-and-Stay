import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'psp.auth.token';

/**
 * JWT storage.
 *
 * `expo-secure-store` wraps the iOS Keychain / Android Keystore and has **no web
 * implementation** — calling `getItemAsync` in a browser throws
 * `ExpoSecureStore.default.getValueWithKeyAsync is not a function`, which reads
 * like a bundling bug rather than a platform gap. So every call branches on
 * `Platform.OS` and falls back to `localStorage` on web.
 *
 * That fallback is **not** secure storage — it's readable by any script on the
 * page. It's acceptable only because web is a dev-preview target for this app,
 * never a shipping one (AI_MANIFEST_FRONTEND.md §6). If web ever becomes a real
 * target, this needs to move to an HttpOnly cookie set by the server instead.
 */
const isWeb = Platform.OS === 'web';

export const tokenStorage = {
    async get(): Promise<string | null> {
        if (isWeb) return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
        return SecureStore.getItemAsync(TOKEN_KEY);
    },

    async set(token: string): Promise<void> {
        if (isWeb) {
            globalThis.localStorage?.setItem(TOKEN_KEY, token);
            return;
        }
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },

    async clear(): Promise<void> {
        if (isWeb) {
            globalThis.localStorage?.removeItem(TOKEN_KEY);
            return;
        }
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
};
