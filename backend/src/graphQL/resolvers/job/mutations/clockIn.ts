import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * clockIn
 *
 * Clocks the assigned sitter in to a job. Only the BusinessMember assigned
 * to this job (matching the caller's own membership) may call this.
 * Valid transition: ASSIGNED -> IN_PROGRESS.
 */
export const clockIn = async (
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

    if (job.assigneeId == null) {
        throw new GraphQLError('This job has no assigned sitter.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const assignee = await context.prisma.businessMember.findUnique({ where: { id: job.assigneeId } });
    if (assignee == null || !assignee.isActive || assignee.userId !== context.user.userId) {
        throw new GraphQLError('Only the assigned sitter can clock in to this job.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'ASSIGNED') {
        throw new GraphQLError(`Cannot clock in from this job's current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.job.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS', actualStartTime: new Date() },
    });
};
