import { GraphQLError } from 'graphql';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * deleteServiceAddOn
 *
 * Soft-deletes a service add-on by setting isActive to false (OWNER/MANAGER
 * of its offering's business only).
 */
export const deleteServiceAddOn = async (
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
        include: { serviceOffering: { select: { businessId: true } } },
    });
    if (addOn == null) {
        throw new GraphQLError('Service add-on not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(addOn.serviceOffering.businessId, context);

    if (!addOn.isActive) {
        throw new GraphQLError('This add-on is already deactivated.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.serviceOfferingAddOn.update({
        where: { id: serviceAddOnId },
        data: { isActive: false },
    });
};
