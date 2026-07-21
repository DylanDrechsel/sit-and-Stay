import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { env } from './env';
import { tokenStorage } from './tokenStorage';

/**
 * Apollo Client 4 setup.
 *
 * Note the v4 import paths — they moved from v3 and most examples online are
 * still v3: hooks and `ApolloProvider` come from `@apollo/client/react`, links
 * from `@apollo/client/link/*`, and `SetContextLink` takes `(prevContext,
 * operation)` where v3's `setContext` took them the other way round.
 */

/**
 * Invoked when the server rejects an operation as UNAUTHENTICATED.
 *
 * The link chain is built once at module load, but signing out is React state,
 * so the two are bridged through this registry. AuthProvider installs the real
 * handler on mount; until then it's a no-op. The alternative — rebuilding the
 * client whenever auth changes — would throw away the cache on every sign-in.
 */
let onUnauthenticated: () => void = () => {};

export const setUnauthenticatedHandler = (handler: () => void): void => {
    onUnauthenticated = handler;
};

/**
 * Reads the token fresh on every operation instead of closing over it once, so
 * signing in or out takes effect on the very next request without recreating
 * the client.
 */
const authLink = new SetContextLink(async (prevContext) => {
    const token = await tokenStorage.get();

    return {
        headers: {
            ...prevContext.headers,
            // Omit the header entirely when signed out. The backend's
            // verifyToken() treats absent and malformed identically (both yield
            // context.user === null), but sending `Bearer null` would be a lie.
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
    };
});

/**
 * The backend throws UNAUTHENTICATED for an absent, malformed, *or expired*
 * token — `verifyToken()` never throws, it just yields `context.user === null`,
 * and every guarded resolver turns that into this one code. Treating it as
 * "session over" is what stops an expired JWT from leaving every screen silently
 * broken with no way back to the login screen.
 */
const errorLink = new ErrorLink(({ error }) => {
    if (CombinedGraphQLErrors.is(error) &&
        error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')) {
        onUnauthenticated();
    }
});

export const apolloClient = new ApolloClient({
    // Order matters: errorLink first so it observes results coming back up the
    // chain, authLink before the terminating HttpLink so the header is attached.
    link: ApolloLink.from([errorLink, authLink, new HttpLink({ uri: env.apiUrl })]),
    cache: new InMemoryCache(),
});
