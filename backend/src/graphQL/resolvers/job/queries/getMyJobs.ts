import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getMyJobsSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { JobListFilters } from '../../../../types/booking.js';

/**
 * getMyJobs
 *
 * Returns every job assigned to the authenticated user in their sitter role —
 * the sitter app's Today/Schedule lists. Spans all businesses the caller is an
 * active member of (a walker for two businesses sees both calendars merged);
 * jobs tied to a membership that has since been deactivated are excluded.
 *
 * Ordered by scheduledStartTime ascending (day-plan order).
 */
export const getMyJobs = async (
    _: unknown,
    args: JobListFilters,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = getMyJobsSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { statuses, from, to } = parsed.data;

    const where: Prisma.JobWhereInput = {
        assignee: { userId: context.user.userId, isActive: true },
    };
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
