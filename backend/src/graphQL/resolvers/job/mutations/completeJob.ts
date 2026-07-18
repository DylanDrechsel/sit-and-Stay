import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * completeJob
 *
 * Manually marks a job completed. OWNER or MANAGER of the job's business
 * only — use this as an override when clock-in/clock-out wasn't used (or
 * needs correcting), not as the sitter's normal completion path (clockOut).
 * Valid transitions: ASSIGNED -> COMPLETED, IN_PROGRESS -> COMPLETED.
 * Backfills actualStartTime if the sitter never clocked in.
 */
export const completeJob = async (
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

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId: job.businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to complete jobs for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'ASSIGNED' && job.status !== 'IN_PROGRESS') {
        throw new GraphQLError(`Cannot complete a job from its current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'COMPLETED',
            actualStartTime: job.actualStartTime ?? new Date(),
            actualEndTime: new Date(),
        },
    });
};
