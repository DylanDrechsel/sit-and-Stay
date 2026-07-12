import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getInactiveBusinessMembers
 *
 * Returns all inactive members of the given business, each with their full User profile
 * embedded. The caller must themselves be an active member of the business to see the list.
 */
export const getInactiveBusinessMembers = async (
    _: unknown,
    { businessId }: { businessId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const callerMembership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (callerMembership == null || !callerMembership.isActive) {
        throw new GraphQLError('You are not a member of this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const members = await context.prisma.businessMember.findMany({
        where: { businessId, isActive: false },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
    });

    return members;
};
