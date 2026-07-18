import { GraphQLError } from 'graphql';
import { createServiceOfferingSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { CreateServiceOfferingInput } from '../../../../types/service.js';

/**
 * createServiceOffering
 *
 * Creates a service offering under a business (OWNER/MANAGER only). Created
 * active by default — unlike registerOwner's seed offerings, an explicitly
 * created offering is presumed ready to sell.
 */
export const createServiceOffering = async (
    _: unknown,
    { input }: { input: CreateServiceOfferingInput },
    context: GraphQLContext,
) => {
    const parsed = createServiceOfferingSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, title, description, durationMinutes, category, basePrice, features } = parsed.data;

    await requireBusinessManager(businessId, context);

    // Explicit per-field payload — see addPet.ts for why (exactOptionalPropertyTypes
    // rejects spreading Zod's `T | undefined` optionals into Prisma input types).
    const offeringData: {
        businessId: string;
        title: string;
        description: string;
        durationMinutes: number;
        category?: 'WALKING' | 'BOARDING' | 'DROP_IN' | 'DAY_CARE' | 'TRAINING' | 'GROOMING' | 'HOUSE_SITTING';
        basePrice?: string;
        features?: string[];
    } = { businessId, title, description, durationMinutes };

    if (category !== undefined) offeringData.category = category;
    if (basePrice !== undefined) offeringData.basePrice = basePrice.toFixed(2);
    if (features !== undefined) offeringData.features = features;

    return context.prisma.serviceOffering.create({ data: offeringData });
};
