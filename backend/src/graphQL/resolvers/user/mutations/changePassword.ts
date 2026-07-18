import { GraphQLError } from 'graphql';
import { comparePassword, hashPassword } from '../../../../utils/auth.js';
import { changePasswordSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { ChangePasswordInput } from '../../../../types/user.js';

/**
 * changePassword
 *
 * Allows the authenticated user to change their own password.
 *
 * Security steps:
 *   1. User must be logged in (valid JWT)
 *   2. currentPassword must match the stored bcrypt hash
 *   3. newPassword must pass strength rules and be different from the current password
 *   4. New hash is written; old hash is discarded
 *
 * Returns the updated User (without the hash — never expose passwordHash in GraphQL).
 */
export const changePassword = async (
    _: unknown,
    { input }: { input: ChangePasswordInput },
    context: GraphQLContext,
) => {
    // 1. Auth check
    if (context.user == null) {
        throw new GraphQLError('You must be logged in to change your password.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 2. Validate input — enforces strength rules + same-password refine
    const parsed = changePasswordSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { currentPassword, newPassword } = parsed.data;

    // 3. Fetch the user's current hash — context.user only carries the JWT payload,
    //    not the passwordHash, so we need a fresh DB read here
    const user = await context.prisma.user.findUnique({
        where: { id: context.user.userId },
    });

    if (user == null) {
        throw new GraphQLError('User not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // 4. Verify the current password — use a generic error to prevent information leakage.
    //    passwordHash is null for OAuth-only accounts (Google/Apple), which have no
    //    password to change.
    if (user.passwordHash == null) {
        throw new GraphQLError('This account signs in via Google or Apple and has no password to change.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
        throw new GraphQLError('Current password is incorrect.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 5. Hash the new password and persist it
    const newPasswordHash = await hashPassword(newPassword);

    const updatedUser = await context.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
    });

    return updatedUser;
};
