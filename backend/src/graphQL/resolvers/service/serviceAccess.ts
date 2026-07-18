import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../types/context.js';

/**
 * requireBusinessManager
 *
 * Throws unless the authenticated caller is an active OWNER or MANAGER of the
 * given business. Shared by every service-domain mutation (offerings, add-ons,
 * and packages are all business-owned catalog data with the same write rule).
 */
export const requireBusinessManager = async (
    businessId: string,
    context: GraphQLContext,
): Promise<void> => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to manage services for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
};

/**
 * isActiveMember
 *
 * True if the caller is an active member (any role) of the business. Used by
 * the read queries to decide between member view (all rows, active and
 * inactive) and public view (active rows only).
 */
export const isActiveMember = async (
    businessId: string,
    context: GraphQLContext,
): Promise<boolean> => {
    if (context.user == null) return false;

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });
    return membership != null && membership.isActive;
};
