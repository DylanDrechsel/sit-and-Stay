import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getBusinessMembers
 *
 * Returns all members of the given business, each with their full User profile
 * embedded. The caller must themselves be a member of the business to see the list
 * (any role qualifies — OWNER, MANAGER, or EMPLOYEE).
 *
 * Members are ordered by joinedAt ascending so the OWNER always appears first.
 */
export const getBusinessMembers = async (
    _: unknown,
    { businessId }: { businessId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // Verify the caller is actually a member of this business
    const callerMembership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (callerMembership == null) {
        throw new GraphQLError('You are not a member of this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // Fetch all members with their user profiles included
    const members = await context.prisma.businessMember.findMany({
        where: { businessId },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
    });

    return members;
};
