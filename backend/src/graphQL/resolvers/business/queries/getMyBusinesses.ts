import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getMyBusinesses
 *
 * Returns all businesses the authenticated user is a member of,
 * regardless of role (OWNER, MANAGER, or EMPLOYEE).
 *
 * Ordered by when they joined each business (oldest first).
 */
export const getMyBusinesses = async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const memberships = await context.prisma.businessMember.findMany({
        where: { userId: context.user.userId },
        include: { business: true },
        orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => m.business);
};
