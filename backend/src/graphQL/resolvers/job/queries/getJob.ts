import { GraphQLError } from 'graphql';
import { assertJobViewAccess } from '../jobAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getJob
 *
 * Returns a single job — the detail screens (customer tracking, manager
 * controls, sitter live job). Viewable by the job's customer, the assigned
 * sitter, or an active OWNER/MANAGER of the job's business
 * (see assertJobViewAccess).
 */
export const getJob = async (
    _: unknown,
    { jobId }: { jobId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    if (!jobId?.trim()) {
        throw new GraphQLError('Job ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    await assertJobViewAccess(job, context);

    return job;
};
