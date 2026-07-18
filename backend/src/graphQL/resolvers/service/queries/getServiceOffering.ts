import { GraphQLError } from 'graphql';
import { isActiveMember } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getServiceOffering
 *
 * Returns a single service offering (the service detail screen). Active
 * members of the owning business can see it regardless of state; everyone
 * else only if both the offering and its business are active — inactive
 * offerings 404 publicly rather than revealing they exist.
 */
export const getServiceOffering = async (
    _: unknown,
    { serviceOfferingId }: { serviceOfferingId: string },
    context: GraphQLContext,
) => {
    if (!serviceOfferingId?.trim()) {
        throw new GraphQLError('Service offering ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const offering = await context.prisma.serviceOffering.findUnique({
        where: { id: serviceOfferingId },
        include: { business: { select: { isActive: true } } },
    });
    if (offering == null) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const memberView = await isActiveMember(offering.businessId, context);
    if (!memberView && (!offering.isActive || !offering.business.isActive)) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return offering;
};
