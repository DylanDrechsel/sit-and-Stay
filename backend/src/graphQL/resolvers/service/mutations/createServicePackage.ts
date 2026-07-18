import { GraphQLError } from 'graphql';
import { createServicePackageSchema, formatZodError } from '../../../../utils/validate.js';
import { requireBusinessManager } from '../serviceAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { CreateServicePackageInput } from '../../../../types/service.js';

/**
 * createServicePackage
 *
 * Creates a pricing tier under a service offering (OWNER/MANAGER of its
 * business only). sessionsCount defaults to 1 (Prisma's model default) when
 * omitted — a single-session "package" is valid, though createBooking only
 * needs servicePackageId at all for multi-session bookings.
 */
export const createServicePackage = async (
    _: unknown,
    { input }: { input: CreateServicePackageInput },
    context: GraphQLContext,
) => {
    const parsed = createServicePackageSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { serviceOfferingId, title, sessionsCount, pricePerSession } = parsed.data;

    const offering = await context.prisma.serviceOffering.findUnique({ where: { id: serviceOfferingId } });
    if (offering == null) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await requireBusinessManager(offering.businessId, context);

    return context.prisma.servicePackage.create({
        data: {
            serviceOfferingId,
            title,
            sessionsCount,
            pricePerSession: pricePerSession.toFixed(2),
        },
    });
};
