import { GraphQLError } from 'graphql';
import { runGuardedTransition } from '../jobTransition.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * acceptJob
 *
 * Accepts a pending job request. OWNER or MANAGER of the job's business only.
 * Valid transition: PENDING -> ACCEPTED.
 */
export const acceptJob = async (
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
        throw new GraphQLError(`This job cannot be accepted from its current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Guarded on the status just checked — see jobTransition.ts. Two staff
    // answering the same request at once would otherwise both report success,
    // with whichever wrote last silently deciding the outcome.
    return runGuardedTransition(
        () => context.prisma.job.update({
            where: { id: jobId, status: 'PENDING' },
            data: { status: 'ACCEPTED', acceptedAt: new Date() },
        }),
        'This request was already answered by someone else. Refresh to see its current status.',
    );
};
