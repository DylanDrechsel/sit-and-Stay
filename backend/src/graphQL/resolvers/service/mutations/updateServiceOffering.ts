import { GraphQLError } from 'graphql';
import { updateServiceOfferingSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdateServiceOfferingInput } from '../../../../types/service.js';

/**
 * updateServiceOffering
 *
 * Partial update of a service offering (OWNER/MANAGER of its business only).
 * category/basePrice accept explicit null to clear; features replaces the
 * whole array; isActive toggles visibility (true re-activates a soft-deleted
 * offering).
 */
export const updateServiceOffering = async (
    _: unknown,
    { input }: { input: UpdateServiceOfferingInput },
    context: GraphQLContext,
) => {
    const parsed = updateServiceOfferingSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { serviceOfferingId, title, description, durationMinutes, category, basePrice, features, isActive } = parsed.data;

    const offering = await context.prisma.serviceOffering.findUnique({ where: { id: serviceOfferingId } });
    if (offering == null) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(offering.businessId, context);

    const updateData: {
        title?: string;
        description?: string;
        durationMinutes?: number;
        category?: 'WALKING' | 'BOARDING' | 'DROP_IN' | 'DAY_CARE' | 'TRAINING' | 'GROOMING' | 'HOUSE_SITTING' | null;
        basePrice?: string | null;
        features?: string[];
        isActive?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (category !== undefined) updateData.category = category;
    if (basePrice !== undefined) updateData.basePrice = basePrice == null ? null : basePrice.toFixed(2);
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    return context.prisma.serviceOffering.update({
        where: { id: serviceOfferingId },
        data: updateData,
    });
};
