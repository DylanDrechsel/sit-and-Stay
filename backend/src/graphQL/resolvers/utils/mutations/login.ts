import { GraphQLError } from 'graphql';
import { comparePassword, signToken } from '../../../../utils/auth.js';
import { loginSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { LoginInput } from '../../../../types/auth.js';

/**
 * login
 * Works for all user types (Customer, Owner, Manager, Employee).
 * Verifies credentials and returns a signed JWT.
 * Always returns a generic error message to prevent email enumeration.
 */
export const login = async (
    _: unknown,
    { input }: { input: LoginInput },
    context: GraphQLContext,
) => {
    // 1. Validate
    const parsed = loginSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { email, password } = parsed.data;

    // 2. Find user — use a generic error to prevent email enumeration attacks
    const user = await context.prisma.user.findUnique({ where: { email } });
    if (user == null) {
        throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 3. Compare password — passwordHash is null for OAuth-only accounts (Google/Apple),
    //    which can't log in via this mutation. Same generic error either way, to avoid
    //    revealing which sign-in method an email is registered with.
    if (user.passwordHash == null) {
        throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (valid === false) {
        throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const token = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
    return { token, user };
};