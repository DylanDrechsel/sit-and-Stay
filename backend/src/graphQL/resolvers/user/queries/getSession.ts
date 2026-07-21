import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getSession
 *
 * One call at sign-in that answers "who is this and what may they see".
 * Returns identity, every active membership (each carrying its role and
 * business), and the customer profile if one exists.
 *
 * Staff-ness and customer-ness are reported as two separate fields rather than
 * one role string, because they are independent and all four combinations are
 * reachable: customer.test1 is both, registerOwner creates an owner with no
 * CustomerProfile, and an owner whose membership was later soft-removed by
 * removeMember is neither. That last case is why an empty `memberships` must
 * never be read as "therefore a customer" — the client checks customerProfile.
 *
 * Which context to land the user in is deliberately left to the client. That's
 * a UI routing decision; deciding it here would mean a schema change to alter it.
 *
 * Job lists are intentionally absent. They're unbounded, mean something
 * different per role, and change constantly; screens fetch their own filtered
 * slice through getMyJobs / getBusinessJobs / getMyBookings.
 */
export const getSession = async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const userId = context.user.userId;

    const [user, memberships, customerProfile] = await Promise.all([
        context.prisma.user.findUnique({ where: { id: userId } }),
        // Active only — a soft-removed member keeps their row but has no
        // business access. The business is include:d here rather than left to
        // the BusinessMember.business field resolver, which short-circuits on it
        // instead of firing one query per membership.
        context.prisma.businessMember.findMany({
            where: { userId, isActive: true },
            include: { business: true },
            orderBy: { joinedAt: 'asc' },
        }),
        context.prisma.customerProfile.findUnique({ where: { userId } }),
    ]);

    if (user == null) {
        throw new GraphQLError('User not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    return {
        user,
        memberships,
        customerProfile,
    };
};
