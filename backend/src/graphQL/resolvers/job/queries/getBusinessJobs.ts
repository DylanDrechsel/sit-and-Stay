import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getBusinessJobsSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetBusinessJobsInput } from '../../../../types/booking.js';

/**
 * getBusinessJobs
 *
 * Returns a business's jobs for the owner/manager views — the dashboard,
 * requests inbox (statuses: [PENDING]), and day/week schedule (from/to window
 * on scheduledStartTime). OWNER or MANAGER only; employees see their own jobs
 * via getMyJobs instead.
 *
 * Ordered by scheduledStartTime ascending (schedule order).
 */
export const getBusinessJobs = async (
    _: unknown,
    args: GetBusinessJobsInput,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = getBusinessJobsSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, statuses, from, to } = parsed.data;

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to view jobs for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const where: Prisma.JobWhereInput = { businessId };
    if (statuses !== undefined) where.status = { in: statuses };
    if (from !== undefined || to !== undefined) {
        where.scheduledStartTime = {
            ...(from !== undefined ? { gte: from } : {}),
            ...(to !== undefined ? { lte: to } : {}),
        };
    }

    return context.prisma.job.findMany({
        where,
        orderBy: { scheduledStartTime: 'asc' },
    });
};
