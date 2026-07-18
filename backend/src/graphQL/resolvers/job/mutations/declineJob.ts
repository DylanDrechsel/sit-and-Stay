import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * declineJob
 *
 * Declines a pending job request. OWNER or MANAGER of the job's business only.
 * Valid transition: PENDING -> DECLINED.
 */
export const declineJob = async (
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
        throw new GraphQLError('You do not have permission to manage requests for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'PENDING') {
        throw new GraphQLError(`This job cannot be declined from its current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.job.update({
        where: { id: jobId },
        data: { status: 'DECLINED', declinedAt: new Date() },
    });
};
