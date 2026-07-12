import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * deactivateBusiness
 *
 * Soft-deletes a business by setting isActive to false. Only the OWNER can do this.
 *
 * This does NOT delete any data — members, jobs, and records are all preserved.
 * A deactivated business will no longer appear in public listings or accept new bookings.
 *
 * Returns the updated Business record with isActive: false.
 */
export const deactivateBusiness = async (
    _: unknown,
    { businessId }: { businessId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    if (!businessId?.trim()) {
        throw new GraphQLError('Business ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Only the OWNER can deactivate a business
    const membership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (membership == null || !membership.isActive || membership.role !== 'OWNER') {
        throw new GraphQLError('Only the business owner can deactivate a business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // Verify the business isn't already deactivated
    const business = await context.prisma.business.findUnique({
        where: { id: businessId },
    });

    if (business == null) {
        throw new GraphQLError('Business not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    if (!business.isActive) {
        throw new GraphQLError('This business is already deactivated.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.business.update({
        where: { id: businessId },
        data: { isActive: false },
    });
};
