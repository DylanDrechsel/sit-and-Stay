import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getMyUpcomingJobsSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { JobListFilters } from '../../../../types/booking.js';

/**
 * getMyUpcomingJobs
 *
 * Returns the authenticated customer's own jobs, flattened across every
 * booking rather than nested under one — the customer Home screen's "what's
 * coming up" list. Same statuses/from/to filters as getMyJobs/getBusinessJobs;
 * pass from: <today's ISO start-of-day> for exactly "current date and
 * forward". Omitting both returns the customer's full job history instead —
 * the name describes the intended use, not a server-side restriction.
 *
 * Ordered by scheduledStartTime ascending, same as the other two.
 */
export const getMyUpcomingJobs = async (
    _: unknown,
    args: JobListFilters,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = getMyUpcomingJobsSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer == null) {
        throw new GraphQLError('Only customers have jobs.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const { statuses, from, to } = parsed.data;

    const where: Prisma.JobWhereInput = { customerId: customer.id };
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
