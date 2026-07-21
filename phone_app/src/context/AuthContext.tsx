import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apolloClient, setUnauthenticatedHandler } from '../lib/apolloClient';
import { tokenStorage } from '../lib/tokenStorage';

interface AuthContextValue {
    /** null once we've checked storage and found nothing. */
    token: string | null;
    /** True until the initial token read finishes — hold the UI, don't flash the login screen. */
    isRestoring: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isRestoring, setIsRestoring] = useState(true);

    const signIn = useCallback(async (nextToken: string) => {
        await tokenStorage.set(nextToken);
        setToken(nextToken);
    }, []);

    const signOut = useCallback(async () => {
        await tokenStorage.clear();
        setToken(null);
        // Drop every cached result. Without this, the next user to sign in on
        // this device would briefly see the previous user's cached session
        // before the network response replaced it.
        await apolloClient.clearStore();
    }, []);

    // Restore a previous session on cold start.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const stored = await tokenStorage.get();
                if (!cancelled && stored) setToken(stored);
            } finally {
                // Always clear the flag — a keychain read that throws must not
                // leave the app stuck on the splash screen forever.
                if (!cancelled) setIsRestoring(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Let the Apollo error link end the session when the server says the token
    // is no longer good. Registered here rather than at module scope because
    // signOut is React state; see setUnauthenticatedHandler's comment.
    useEffect(() => {
        setUnauthenticatedHandler(() => { void signOut(); });
        return () => setUnauthenticatedHandler(() => {});
    }, [signOut]);

    const value = useMemo(
        () => ({ token, isRestoring, signIn, signOut }),
        [token, isRestoring, signIn, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used inside an <AuthProvider>.');
    }
    return context;
}
