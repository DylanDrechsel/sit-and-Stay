import { GraphQLError } from 'graphql';
import { setBusinessLocationSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { SetBusinessLocationInput } from '../../../../types/business.js';

/**
 * setBusinessLocation
 *
 * Sets a business's PostGIS location. This is the only way to write
 * Business.location — Prisma can't write to Unsupported("geometry") columns
 * through its normal create/update API, so this goes through $executeRaw.
 * A business with no location set can never appear in getNearbyBusinesses.
 *
 * OWNER or MANAGER only — same permission level as updateBusiness (location
 * is a profile field, not an OWNER-only action like deactivateBusiness).
 */
export const setBusinessLocation = async (
    _: unknown,
    { input }: { input: SetBusinessLocationInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = setBusinessLocationSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, latitude, longitude } = parsed.data;

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to update this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const business = await context.prisma.business.findUnique({ where: { id: businessId } });
    if (business == null) {
        throw new GraphQLError('Business not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    // Raw SQL is the only path for an Unsupported("geometry") column. This also
    // bypasses Prisma's automatic @updatedAt handling, so it's set manually here
    // to match what a normal .update() call would have done.
    await context.prisma.$executeRaw`
        UPDATE "Business"
        SET "location" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), "updatedAt" = NOW()
        WHERE "id" = ${businessId}
    `;

    return context.prisma.business.findUniqueOrThrow({ where: { id: businessId } });
};
