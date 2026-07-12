import { GraphQLError } from 'graphql';
import { comparePassword } from '../../../../utils/auth.js';
import { changeEmailSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { ChangeEmailInput } from '../../../../types/user.js';

/**
 * changeEmail
 *
 * Allows the authenticated user to change their own email address.
 *
 * Security steps:
 *   1. User must be logged in (valid JWT)
 *   2. Current password must be confirmed to prove identity
 *   3. New email must be different from the current email
 *   4. New email must not already be registered to another account
 *   5. Email is stored lowercase (normalized by Zod's emailField)
 *
 * Returns the updated User with the new email.
 *
 * Note: In production, consider adding a verification email to the new address
 * before committing the change. This can be added as a two-step flow when
 * email verification is implemented.
 */
export const changeEmail = async (
    _: unknown,
    { input }: { input: ChangeEmailInput },
    context: GraphQLContext,
) => {
    // 1. Auth check
    if (context.user == null) {
        throw new GraphQLError('You must be logged in to change your email.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 2. Validate input — newEmail is normalized (trimmed + lowercased) by emailField
    const parsed = changeEmailSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { newEmail, password } = parsed.data;

    // 3. Fetch the current user record — need passwordHash and current email
    const user = await context.prisma.user.findUnique({
        where: { id: context.user.userId },
    });

    if (user == null) {
        throw new GraphQLError('User not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // 4. Confirm identity with current password
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
        throw new GraphQLError('Password is incorrect.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 5. Reject if the new email is the same as the current one
    if (newEmail === user.email) {
        throw new GraphQLError('New email must be different from your current email address.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // 6. Check the new email isn't already registered to another account
    const emailTaken = await context.prisma.user.findUnique({
        where: { email: newEmail },
    });

    if (emailTaken != null) {
        throw new GraphQLError('An account with this email address already exists.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // 7. Update the email
    const updatedUser = await context.prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail },
    });

    return updatedUser;
};
