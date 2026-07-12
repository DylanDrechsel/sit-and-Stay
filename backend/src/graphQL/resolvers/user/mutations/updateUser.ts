import { GraphQLError } from 'graphql';
import { updateUserSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdateUserInput } from '../../../../types/user.js';

/**
 * updateUser
 *
 * Allows the authenticated user to update their own profile.
 * This is a partial update — only fields present in the input are written.
 * Fields omitted from the input are left unchanged in the database.
 *
 * Updatable fields: firstName, lastName, phone, avatarUrl
 *
 * Note: email and password changes are intentionally excluded here.
 * Those are sensitive operations that require their own dedicated
 * mutations with current-password confirmation (changeEmail, changePassword).
 *
 * Returns the full updated User record.
 */
export const updateUser = async (
    _: unknown,
    { input }: { input: UpdateUserInput },
    context: GraphQLContext,
) => {
    // 1. Auth check — user must be logged in
    if (context.user == null) {
        throw new GraphQLError('You must be logged in to update your profile.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 2. Validate input — rejects empty payloads and enforces field constraints
    const parsed = updateUserSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { firstName, lastName, phone, avatarUrl } = parsed.data;

    // 3. Build the update payload — only include fields that were explicitly provided.
    //    This prevents overwriting existing values with undefined.
    const updateData: {
        firstName?: string;
        lastName?: string;
        phone?: string | null;
        avatarUrl?: string | null;
    } = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    // phone and avatarUrl can be explicitly cleared by passing an empty string
    if (phone !== undefined) updateData.phone = phone === '' ? null : phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl === '' ? null : avatarUrl;

    // 4. Write only the changed fields to the database
    const updatedUser = await context.prisma.user.update({
        where: { id: context.user.userId },
        data: updateData,
    });

    return updatedUser;
};
