import { GraphQLError } from 'graphql';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * deleteServicePackage
 *
 * Soft-deletes a service package by setting isActive to false (OWNER/MANAGER
 * of its offering's business only).
 */
export const deleteServicePackage = async (
    _: unknown,
    { servicePackageId }: { servicePackageId: string },
    context: GraphQLContext,
) => {
    if (!servicePackageId?.trim()) {
        throw new GraphQLError('Service package ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const servicePackage = await context.prisma.servicePackage.findUnique({
        where: { id: servicePackageId },
        include: { serviceOffering: { select: { businessId: true } } },
    });
    if (servicePackage == null) {
        throw new GraphQLError('Service package not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(servicePackage.serviceOffering.businessId, context);

    if (!servicePackage.isActive) {
        throw new GraphQLError('This service package is already deactivated.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.servicePackage.update({
        where: { id: servicePackageId },
        data: { isActive: false },
    });
};
