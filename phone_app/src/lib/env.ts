/**
 * Environment configuration.
 *
 * IMPORTANT — `EXPO_PUBLIC_*` variables are NOT secret. Metro inlines them into
 * the JS bundle at build time, so anyone with the app binary can read them. They
 * exist so config can differ per environment (dev / staging / prod), not to hide
 * anything. Never put an API key, SMTP password, or signing secret in one.
 *
 * That's fine for everything here: the API URL is public by definition (the app
 * has to reach it), and the only credential this app ever holds is the user's
 * own JWT — issued at runtime by `login` and kept in the device keychain, never
 * in a build-time variable. See src/lib/tokenStorage.ts.
 *
 * Metro only inlines *statically analysable* references, so the full
 * `process.env.EXPO_PUBLIC_API_URL` has to appear literally in the source. A
 * dynamic lookup like `process.env[name]` compiles fine and then resolves to
 * undefined at runtime, which is a genuinely confusing way to fail.
 */

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
    throw new Error(
        'EXPO_PUBLIC_API_URL is not set.\n\n' +
        'Copy .env.example to .env and fill it in, then restart Metro with ' +
        '`npx expo start -c`. Env vars are read when the bundle is built, so a ' +
        'Metro server that is already running will not pick up a new .env.',
    );
}

export const env = {
    /** Full GraphQL endpoint, e.g. http://192.168.1.23:4000/graphql */
    apiUrl,
} as const;
