import { GraphQLError } from 'graphql';
import { cancelJobSchema, formatZodError } from '../../../../utils/validate.js';
import { runGuardedTransition } from '../jobTransition.js';
import type { JobStatus } from '@prisma/client';
import type { GraphQLContext } from '../../../../types/context.js';
import type { CancelJobInput } from '../../../../types/booking.js';

/**
 * Who may cancel, and from which statuses.
 *
 * The two sets deliberately differ at both ends:
 *
 *   PENDING is customer-only. A business turning down a request it never agreed
 *   to is DECLINED, not CANCELLED — declineJob owns that transition, and the
 *   Requests inbox surfaces the two in different tabs. Collapsing them would
 *   lose the distinction between "we said no" and "it was on, then came off".
 *
 *   IN_PROGRESS is business-only. The sitter is physically at the customer's
 *   home by that point; calling it off is a staff decision, not a customer
 *   self-serve button.
 *
 * The assigned sitter is intentionally absent from both. A sitter who can't
 * work a job asks a manager to reassign it — letting them cancel the
 * customer's booking outright is the wrong remedy.
 */
// Typed as JobStatus rather than string so the set can be handed straight to
// Prisma as the guard on the UPDATE below.
const CANCELLABLE_BY_CUSTOMER: JobStatus[] = ['PENDING', 'ACCEPTED', 'ASSIGNED'];
const CANCELLABLE_BY_BUSINESS: JobStatus[] = ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'];

/** Already-final. There is nothing left to call off. */
const TERMINAL_STATUSES: JobStatus[] = ['COMPLETED', 'CANCELLED', 'DECLINED'];

/**
 * cancelJob
 *
 * Moves a job to CANCELLED, recording when and (optionally) why.
 *
 * Cancels one job, not a whole booking — a customer who wants to call off every
 * session of a package cancels each one. That's deliberate for now: partial
 * cancellation of a multi-session package is a real case (skip Thursday, keep
 * the rest), and a booking-wide cancel would need refund rules that don't
 * exist yet.
 */
export const cancelJob = async (
    _: unknown,
    { input }: { input: CancelJobInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = cancelJobSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, reason } = parsed.data;

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    // Both roles are resolved independently rather than short-circuiting on the
    // first match: one person can be both the customer on a job and an
    // OWNER/MANAGER of the business fulfilling it (an owner booking their own
    // team), and they should get the union of what either role allows.
    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    const isJobCustomer = customer != null && customer.id === job.customerId;

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId: job.businessId } },
    });
    const isBusinessManager = membership != null
        && membership.isActive
        && ['OWNER', 'MANAGER'].includes(membership.role);

    if (!isJobCustomer && !isBusinessManager) {
        throw new GraphQLError('You do not have permission to cancel this job.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const cancellable = new Set<JobStatus>();
    if (isJobCustomer) for (const status of CANCELLABLE_BY_CUSTOMER) cancellable.add(status);
    if (isBusinessManager) for (const status of CANCELLABLE_BY_BUSINESS) cancellable.add(status);

    if (!cancellable.has(job.status)) {
        // Specific guidance beats a generic refusal — each of these is a case
        // where the caller wants a real action that exists somewhere else.
        if (TERMINAL_STATUSES.includes(job.status)) {
            throw new GraphQLError(`This job is already ${job.status.toLowerCase()} and cannot be cancelled.`, {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }
        if (job.status === 'PENDING' && isBusinessManager) {
            throw new GraphQLError('A pending request is declined rather than cancelled — use declineJob.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }
        if (job.status === 'IN_PROGRESS' && isJobCustomer) {
            throw new GraphQLError('This job is already in progress. Contact the business to stop it.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }
        throw new GraphQLError(`This job cannot be cancelled from its current status (${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // assigneeId is deliberately left in place. Who was on the job still
    // matters after it's called off — for the sitter's history, and for any
    // future payout or cancellation-fee rule.
    const updateData: { status: 'CANCELLED'; cancelledAt: Date; cancellationReason?: string } = {
        status: 'CANCELLED',
        cancelledAt: new Date(),
    };
    if (reason !== undefined) updateData.cancellationReason = reason;

    // Guarded on the same set the check above used — see jobTransition.ts. The
    // guard is a set rather than one status because what this caller may cancel
    // from depends on their role, but the principle is identical: the job must
    // still be in a state this caller was allowed to cancel from when the write
    // actually lands. A job that reached IN_PROGRESS in the meantime is no
    // longer the customer's to call off.
    return runGuardedTransition(
        () => context.prisma.job.update({
            where: { id: jobId, status: { in: [...cancellable] } },
            data: updateData,
        }),
        'This job changed status before it could be cancelled. Refresh to see where it stands.',
    );
};
