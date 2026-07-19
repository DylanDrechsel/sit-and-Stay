import { GraphQLError } from 'graphql';
import { runSerializable, recordJobCompletionFinancials } from '../../../../utils/ledger.js';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * clockOut
 *
 * Clocks the assigned sitter out, finishing the job. Only the BusinessMember
 * assigned to this job (matching the caller's own membership) may call this.
 * Valid transition: IN_PROGRESS -> COMPLETED.
 *
 * Reaching COMPLETED also books the job's financials (ledger credit + sitter
 * earning) in the SAME transaction as the status change — a completed job that
 * accrued no pay would be invisible and have to be reconciled by hand. The other
 * route to COMPLETED is completeJob, which must stay in step with this one.
 */
export const clockOut = async (
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
        throw new GraphQLError('Only the assigned sitter can clock out of this job.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'IN_PROGRESS') {
        throw new GraphQLError(`Cannot clock out from this job's current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return runSerializable(context.prisma, async (tx) => {
        // Re-read the status inside the transaction. The check above ran against
        // a read taken outside it, so two concurrent clockOut calls could both
        // have passed it; only this one is serialized against a competing write.
        const fresh = await tx.job.findUnique({
            where: { id: jobId },
            select: { status: true },
        });
        if (fresh == null || fresh.status !== 'IN_PROGRESS') {
            throw new GraphQLError('This job is no longer in progress.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }

        const updated = await tx.job.update({
            where: { id: jobId },
            data: { status: 'COMPLETED', actualEndTime: new Date() },
        });

        await recordJobCompletionFinancials(tx, updated);

        return updated;
    });
};
