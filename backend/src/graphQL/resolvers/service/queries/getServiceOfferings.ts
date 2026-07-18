import { GraphQLError } from 'graphql';
import { isActiveMember } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getServiceOfferings
 *
 * Returns a business's service offerings. Two views:
 *   - active member of the business (any role): every offering, active and
 *     inactive — the owner's service-management screen.
 *   - everyone else (including unauthenticated): active offerings of an
 *     active business only — the public storefront (business detail screen).
 */
export const getServiceOfferings = async (
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

    const memberView = await isActiveMember(businessId, context);

    if (!memberView && !business.isActive) {
        throw new GraphQLError('Business not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return context.prisma.serviceOffering.findMany({
        where: { businessId, ...(memberView ? {} : { isActive: true }) },
        orderBy: { title: 'asc' },
    });
};
