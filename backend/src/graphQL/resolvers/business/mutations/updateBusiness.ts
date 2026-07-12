import { GraphQLError } from 'graphql';
import { updateBusinessSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdateBusinessInput } from '../../../../types/business.js';

/**
 * updateBusiness
 *
 * Allows an OWNER or MANAGER to update a business's name and/or description.
 * This is a partial update — only provided fields are written to the database.
 *
 * Passing an empty string for description clears the field (sets it to null).
 *
 * Returns the updated Business record.
 */
export const updateBusiness = async (
    _: unknown,
    { input }: { input: UpdateBusinessInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // Validate — enforces UUID format on businessId + at-least-one-field refine
    const parsed = updateBusinessSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, name, description } = parsed.data;

    // Verify the caller is an OWNER or MANAGER of this business
    const membership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (membership == null || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to update this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // Build the partial update payload — only include fields that were provided
    const updateData: { name?: string; description?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) {
        // Empty string explicitly clears the description
        updateData.description = description === '' ? null : description;
    }

    const updatedBusiness = await context.prisma.business.update({
        where: { id: businessId },
        data: updateData,
    });

    return updatedBusiness;
};
