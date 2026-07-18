import { GraphQLError } from 'graphql';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * deleteServiceOffering
 *
 * Soft-deletes a service offering by setting isActive to false (OWNER/MANAGER
 * of its business only). Does not touch its packages/add-ons or any historical
 * Job/Booking rows that reference it.
 */
export const deleteServiceOffering = async (
    _: unknown,
    { serviceOfferingId }: { serviceOfferingId: string },
    context: GraphQLContext,
) => {
    if (!serviceOfferingId?.trim()) {
        throw new GraphQLError('Service offering ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const offering = await context.prisma.serviceOffering.findUnique({ where: { id: serviceOfferingId } });
    if (offering == null) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(offering.businessId, context);

    if (!offering.isActive) {
        throw new GraphQLError('This service offering is already deactivated.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.serviceOffering.update({
        where: { id: serviceOfferingId },
        data: { isActive: false },
    });
};
