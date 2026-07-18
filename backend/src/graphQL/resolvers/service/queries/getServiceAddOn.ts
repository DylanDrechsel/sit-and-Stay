import { GraphQLError } from 'graphql';
import { isActiveMember } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getServiceAddOn
 *
 * Returns a single add-on. Members of the owning business always; everyone
 * else only when the add-on, its offering, and the business are all active.
 */
export const getServiceAddOn = async (
    _: unknown,
    { serviceAddOnId }: { serviceAddOnId: string },
    context: GraphQLContext,
) => {
    if (!serviceAddOnId?.trim()) {
        throw new GraphQLError('Service add-on ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const addOn = await context.prisma.serviceOfferingAddOn.findUnique({
        where: { id: serviceAddOnId },
        include: {
            serviceOffering: {
                select: { businessId: true, isActive: true, business: { select: { isActive: true } } },
            },
        },
    });
    if (addOn == null) {
        throw new GraphQLError('Service add-on not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const memberView = await isActiveMember(addOn.serviceOffering.businessId, context);
    if (!memberView
        && (!addOn.isActive || !addOn.serviceOffering.isActive || !addOn.serviceOffering.business.isActive)) {
        throw new GraphQLError('Service add-on not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return addOn;
};
