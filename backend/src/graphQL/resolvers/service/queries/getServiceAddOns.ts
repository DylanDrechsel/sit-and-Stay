import { GraphQLError } from 'graphql';
import { isActiveMember } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getServiceAddOns
 *
 * Returns a service offering's add-ons. Members of the owning business see
 * all of them (active and inactive); everyone else sees active add-ons of a
 * publicly-visible offering only.
 */
export const getServiceAddOns = async (
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

    return context.prisma.serviceOfferingAddOn.findMany({
        where: { serviceOfferingId, ...(memberView ? {} : { isActive: true }) },
        orderBy: { title: 'asc' },
    });
};
