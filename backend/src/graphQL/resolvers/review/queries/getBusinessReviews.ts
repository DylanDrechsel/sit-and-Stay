import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getBusinessReviews
 *
 * Returns all public reviews for a business, most recent first. This is
 * public-profile data (the business detail screen's "Recent reviews" list) —
 * no authentication required.
 */
export const getBusinessReviews = async (
    _: unknown,
    { businessId }: { businessId: string },
    context: GraphQLContext,
) => {
    if (!businessId?.trim()) {
        throw new GraphQLError('Business ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const business = await context.prisma.business.findUnique({ where: { id: businessId } });
    if (business == null) {
        throw new GraphQLError('Business not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return context.prisma.review.findMany({
        where: { businessId, isPublic: true },
        orderBy: { createdAt: 'desc' },
    });
};
