import { GraphQLError } from 'graphql';
import { createServiceAddOnSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { CreateServiceAddOnInput } from '../../../../types/service.js';

/**
 * createServiceAddOn
 *
 * Creates an add-on under a service offering (OWNER/MANAGER of the offering's
 * business only). perSession defaults to true (Prisma's model default) when omitted.
 */
export const createServiceAddOn = async (
    _: unknown,
    { input }: { input: CreateServiceAddOnInput },
    context: GraphQLContext,
) => {
    const parsed = createServiceAddOnSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { serviceOfferingId, title, pricePerSession, perSession } = parsed.data;

    const offering = await context.prisma.serviceOffering.findUnique({ where: { id: serviceOfferingId } });
    if (offering == null) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(offering.businessId, context);

    const addOnData: { serviceOfferingId: string; title: string; pricePerSession: string; perSession?: boolean } = {
        serviceOfferingId,
        title,
        pricePerSession: pricePerSession.toFixed(2),
    };
    if (perSession !== undefined) addOnData.perSession = perSession;

    return context.prisma.serviceOfferingAddOn.create({ data: addOnData });
};
