import { GraphQLError } from 'graphql';
import { runGuardedTransition } from '../jobTransition.js';
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

    // Guarded on the status just checked — see jobTransition.ts. Losing this
    // race stranded the job: a clock-in landing after a cancel left it
    // IN_PROGRESS, where clockOut rejects a CANCELLED job and completeJob won't
    // take it either, so nothing could close it out.
    return runGuardedTransition(
        () => context.prisma.job.update({
            where: { id: jobId, status: 'ASSIGNED' },
            data: { status: 'IN_PROGRESS', actualStartTime: new Date() },
        }),
        'This job is no longer assigned to you — it may have been cancelled or reassigned. Refresh to see its current status.',
    );
};
