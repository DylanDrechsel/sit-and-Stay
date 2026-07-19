import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { addTipSchema, formatZodError } from '../../../../utils/validate.js';
import { runSerializable, recordTipFinancials } from '../../../../utils/ledger.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { AddTipInput } from '../../../../types/booking.js';

/**
 * addTip
 *
 * Lets the job's customer tip the sitter after the job is COMPLETED. Writes
 * Job.tipAmount, credits the business ledger, and accrues the tip in full to
 * the assigned sitter — all in one transaction, so a tip can never be recorded
 * on the job without the sitter being owed it.
 *
 * Tipping happens AFTER completion, which is why this is a separate mutation
 * rather than part of the completion path: the money arrives on its own
 * timeline, and until it does there is nothing to book.
 *
 * A job can be tipped ONCE and the amount is final. There is no edit or
 * reversal flow, deliberately: a tip can be paid out to the sitter moments
 * after it lands, and clawing back money already settled needs a policy
 * decision (and reversal entries) that don't exist yet. If tip editing is
 * wanted, it needs a window during which the earning is provably unpaid.
 */
export const addTip = async (
    _: unknown,
    { input }: { input: AddTipInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = addTipSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, amount } = parsed.data;

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer == null) {
        throw new GraphQLError('Only customers can leave tips.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    if (job.customerId !== customer.id) {
        throw new GraphQLError('You can only tip your own jobs.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'COMPLETED') {
        throw new GraphQLError(`Only completed jobs can be tipped (current status: ${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    if (job.tipAmount != null) {
        throw new GraphQLError('This job has already been tipped.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Fixed-2dp string rather than the raw float, matching how every other money
    // value in this codebase reaches a Decimal column.
    const tipAmount = new Prisma.Decimal(amount.toFixed(2));

    return runSerializable(context.prisma, async (tx) => {
        // Re-read inside the transaction. The tipAmount check above ran against a
        // read taken outside it, so two tip requests racing could both have passed
        // it — and unlike the sitter's TIP earning, which the (jobId, type) unique
        // constraint would reject, a duplicate ledger credit has nothing stopping
        // it at the DB level. This check is the only thing preventing double-credit.
        const fresh = await tx.job.findUnique({
            where: { id: jobId },
            select: { status: true, tipAmount: true },
        });

        if (fresh == null || fresh.status !== 'COMPLETED') {
            throw new GraphQLError('This job can no longer be tipped.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }

        if (fresh.tipAmount != null) {
            throw new GraphQLError('This job has already been tipped.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }

        const updated = await tx.job.update({
            where: { id: jobId },
            data: { tipAmount },
        });

        await recordTipFinancials(tx, updated, tipAmount);

        return updated;
    });
};
