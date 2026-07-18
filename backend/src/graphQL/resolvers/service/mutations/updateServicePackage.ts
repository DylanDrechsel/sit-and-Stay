import { GraphQLError } from 'graphql';
import { updateServicePackageSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdateServicePackageInput } from '../../../../types/service.js';

/**
 * updateServicePackage
 *
 * Partial update of a service package (OWNER/MANAGER of its offering's business only).
 */
export const updateServicePackage = async (
    _: unknown,
    { input }: { input: UpdateServicePackageInput },
    context: GraphQLContext,
) => {
    const parsed = updateServicePackageSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { servicePackageId, title, sessionsCount, pricePerSession, isActive } = parsed.data;

    const servicePackage = await context.prisma.servicePackage.findUnique({
        where: { id: servicePackageId },
        include: { serviceOffering: { select: { businessId: true } } },
    });
    if (servicePackage == null) {
        throw new GraphQLError('Service package not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(servicePackage.serviceOffering.businessId, context);

    const updateData: { title?: string; sessionsCount?: number; pricePerSession?: string; isActive?: boolean } = {};
    if (title !== undefined) updateData.title = title;
    if (sessionsCount !== undefined) updateData.sessionsCount = sessionsCount;
    if (pricePerSession !== undefined) updateData.pricePerSession = pricePerSession.toFixed(2);
    if (isActive !== undefined) updateData.isActive = isActive;

    return context.prisma.servicePackage.update({
        where: { id: servicePackageId },
        data: updateData,
    });
};
