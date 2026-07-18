import { GraphQLError } from 'graphql';
import { updateServiceAddOnSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdateServiceAddOnInput } from '../../../../types/service.js';

/**
 * updateServiceAddOn
 *
 * Partial update of a service add-on (OWNER/MANAGER of its offering's business only).
 */
export const updateServiceAddOn = async (
    _: unknown,
    { input }: { input: UpdateServiceAddOnInput },
    context: GraphQLContext,
) => {
    const parsed = updateServiceAddOnSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { serviceAddOnId, title, pricePerSession, perSession, isActive } = parsed.data;

    const addOn = await context.prisma.serviceOfferingAddOn.findUnique({
        where: { id: serviceAddOnId },
        include: { serviceOffering: { select: { businessId: true } } },
    });
    if (addOn == null) {
        throw new GraphQLError('Service add-on not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(addOn.serviceOffering.businessId, context);

    const updateData: { title?: string; pricePerSession?: string; perSession?: boolean; isActive?: boolean } = {};
    if (title !== undefined) updateData.title = title;
    if (pricePerSession !== undefined) updateData.pricePerSession = pricePerSession.toFixed(2);
    if (perSession !== undefined) updateData.perSession = perSession;
    if (isActive !== undefined) updateData.isActive = isActive;

    return context.prisma.serviceOfferingAddOn.update({
        where: { id: serviceAddOnId },
        data: updateData,
    });
};
