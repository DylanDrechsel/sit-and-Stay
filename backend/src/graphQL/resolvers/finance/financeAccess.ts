import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../types/context.js';

/**
 * Access rules for the finance domain.
 *
 * Financial data splits cleanly in two, and so do these helpers:
 *
 *   - Business-wide books (the ledger, the dashboard summary, every sitter's
 *     earnings) are OWNER/MANAGER only.
 *   - A member's own earnings are readable by that member, whatever their role,
 *     because a sitter has to be able to see what they are owed.
 *
 * Both return the caller's membership rather than void — the own-earnings reads
 * need its id to scope the query, and returning it avoids a second lookup.
 */

interface Membership {
    id: string;
    role: string;
    isActive: boolean;
}

/**
 * requireFinanceManager
 *
 * Throws unless the caller is an active OWNER or MANAGER of the business.
 * MANAGERs can read the books even though only an OWNER can set pay rates —
 * seeing labour cost is part of scheduling; changing it isn't.
 */
export const requireFinanceManager = async (
    businessId: string,
    context: GraphQLContext,
): Promise<Membership> => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });

    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to view this business\'s finances.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    return membership;
};

/**
 * requireActiveMembership
 *
 * Throws unless the caller is an active member of the business, any role.
 * Used by the own-earnings read, which is the one finance query an EMPLOYEE
 * may call — scoped to the returned membership's id so it can only ever return
 * their own rows.
 */
export const requireActiveMembership = async (
    businessId: string,
    context: GraphQLContext,
): Promise<Membership> => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });

    if (membership == null || !membership.isActive) {
        throw new GraphQLError('You are not a member of this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    return membership;
};
