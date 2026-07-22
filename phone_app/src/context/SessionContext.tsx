import React, { createContext, useContext } from 'react';
import type { BusinessMember, Session } from '../types/session';

const SessionContext = createContext<Session | null>(null);

/**
 * Holds the loaded `getSession` result for everything below AppContainer.
 *
 * AppContainer is the only place that fetches the session and the only place
 * that renders this provider, so anything inside a role app can assume a session
 * exists — `useSession` throws rather than returning null, the same contract as
 * `useAuth`.
 */
export function SessionProvider({
    session,
    children,
}: {
    session: Session;
    children: React.ReactNode;
}) {
    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
    const session = useContext(SessionContext);
    if (session === null) {
        throw new Error('useSession must be used inside a <SessionProvider>.');
    }
    return session;
}

/**
 * The caller's business membership — the staff apps' entry point to "which
 * business am I looking at".
 *
 * **This app assumes one business per user.** The API does not enforce that:
 * `BusinessMember` is a junction table keyed `(userId, businessId)` and
 * `getSession` returns an array, so a user genuinely can belong to several. Any
 * membership past the first is ignored here. If multi-business support is ever
 * wanted, this hook and `resolveAppKind` are the two places that assume it away.
 *
 * Throws when there is no membership: only the staff apps call this, and
 * AppContainer only routes there once it has seen one.
 */
export function useActiveMembership(): BusinessMember {
    const session = useSession();
    const membership = session.memberships[0];
    if (membership == null) {
        throw new Error(
            'useActiveMembership requires a business membership — AppContainer should not have routed here.',
        );
    }
    return membership;
}
