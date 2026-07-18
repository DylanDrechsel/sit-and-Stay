import { GraphQLError } from 'graphql';
import { getJobUpdatesSchema, formatZodError } from '../../../../utils/validate.js';
import { assertJobViewAccess } from '../jobAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetJobUpdatesInput } from '../../../../types/booking.js';

/**
 * getJobUpdates
 *
 * Returns a job's live "Updates" feed, newest first, using cursor pagination
 * over the (jobId, createdAt desc) index: pass the oldest createdAt you
 * already have as `before` to fetch the next (older) page. Same view access
 * as getJob (see assertJobViewAccess).
 */
export const getJobUpdates = async (
    _: unknown,
    args: GetJobUpdatesInput,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = getJobUpdatesSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, limit, before } = parsed.data;

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await assertJobViewAccess(job, context);

    return context.prisma.jobUpdate.findMany({
        where: {
            jobId,
            ...(before !== undefined ? { createdAt: { lt: before } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
