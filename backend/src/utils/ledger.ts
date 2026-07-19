import { Prisma, PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { EarningType, EntryType, LedgerReferenceType } from '@prisma/client';

/**
 * The financial write layer.
 *
 * Every write to LedgerEntry and EmployeeEarning goes through this file. Nothing
 * else should touch those two tables directly — the invariants below are only
 * enforceable if there is exactly one path in.
 *
 * Two rules shape everything here:
 *
 *  1. LedgerEntry is append-only and carries a running `balanceAfter`. Computing
 *     it requires reading the previous entry, so every ledger write is a
 *     read-modify-write and must run at Serializable isolation (see
 *     runSerializable) or two concurrent writes will both read the same previous
 *     balance and one will silently overwrite the other's arithmetic.
 *
 *  2. EmployeeEarning has NO running balance — a sitter's outstanding pay is
 *     derived (`sum(amount) where payoutId is null`). That is deliberate: the
 *     accrual path is a plain insert with nothing to serialize against.
 */

/** Prisma client as it exists inside an interactive `$transaction` callback. */
export type TxClient = Prisma.TransactionClient;

const ZERO = new Prisma.Decimal(0);
const HUNDRED = new Prisma.Decimal(100);
const SERIALIZATION_RETRY_LIMIT = 3;

/**
 * A serialization failure is the expected, retryable outcome of two ledger
 * writes racing — not a bug. Prisma maps Postgres SQLSTATE 40001 to P2034, but
 * the raw driver code can surface first depending on where the conflict is
 * detected, so both are treated as retryable.
 */
const isSerializationFailure = (err: unknown): boolean => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return err.code === 'P2034';
    }
    return (
        typeof err === 'object' &&
        err !== null &&
        (err as { code?: string }).code === '40001'
    );
};

/**
 * runSerializable
 *
 * Runs `fn` in a Serializable transaction, retrying only on serialization
 * failures. Any other error — including a GraphQLError thrown by a business-rule
 * check inside the callback — propagates immediately and rolls the transaction
 * back, which is what makes it safe to re-verify state inside `fn` and bail out.
 *
 * Callers must treat `fn` as potentially running more than once: it may not
 * perform side effects outside the transaction (no emails, no external calls).
 */
export const runSerializable = async <T>(
    prisma: PrismaClient,
    fn: (tx: TxClient) => Promise<T>,
): Promise<T> => {
    for (let attempt = 1; attempt <= SERIALIZATION_RETRY_LIMIT; attempt++) {
        try {
            return await prisma.$transaction(fn, { isolationLevel: 'Serializable' });
        } catch (err) {
            if (!isSerializationFailure(err) || attempt === SERIALIZATION_RETRY_LIMIT) {
                if (isSerializationFailure(err)) {
                    throw new GraphQLError(
                        'This account was being updated by another request. Please try again.',
                        { extensions: { code: 'CONFLICT' } },
                    );
                }
                throw err;
            }
            // Brief escalating backoff so a retry doesn't collide with the same writer again.
            await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
        }
    }
    // Unreachable — the loop either returns or throws.
    throw new GraphQLError('Ledger write failed.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
};

/**
 * appendLedgerEntry
 *
 * The only way to write a LedgerEntry. Reads the business's current balance from
 * the most recent entry and appends a new row carrying the resulting balance.
 *
 * `amount` is always POSITIVE; `entryType` carries the direction. Storing a
 * signed amount as well would let the two disagree.
 *
 * MUST be called inside runSerializable — it read-modify-writes the balance.
 * Ordering is by `seq`, never `createdAt`: Postgres CURRENT_TIMESTAMP is
 * transaction-start time, so entries appended in the same transaction share a
 * timestamp and "latest by createdAt" would be arbitrary between them.
 */
export const appendLedgerEntry = async (
    tx: TxClient,
    params: {
        businessId: string;
        entryType: EntryType;
        amount: Prisma.Decimal;
        referenceType: LedgerReferenceType;
        jobId?: string | null;
        payoutId?: string | null;
        description?: string | null;
    },
) => {
    const { businessId, entryType, amount, referenceType, jobId, payoutId, description } = params;

    if (amount.isNegative()) {
        throw new GraphQLError('Ledger amounts must be positive; use entryType to set direction.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
    }

    const latest = await tx.ledgerEntry.findFirst({
        where: { businessId },
        orderBy: { seq: 'desc' },
        select: { balanceAfter: true },
    });

    const previousBalance = latest?.balanceAfter ?? ZERO;
    const balanceAfter =
        entryType === 'CREDIT' ? previousBalance.plus(amount) : previousBalance.minus(amount);

    return tx.ledgerEntry.create({
        data: {
            businessId,
            entryType,
            amount,
            balanceAfter,
            referenceType,
            jobId: jobId ?? null,
            payoutId: payoutId ?? null,
            description: description ?? null,
        },
    });
};

/**
 * resolveSitterPayRate
 *
 * The sitter's own rate wins; the business default is the fallback. A null
 * result means neither is configured — see recordJobCompletionFinancials for
 * why that is not treated as an error.
 */
const resolveSitterPayRate = async (
    tx: TxClient,
    memberId: string,
    businessId: string,
): Promise<Prisma.Decimal | null> => {
    const member = await tx.businessMember.findUnique({
        where: { id: memberId },
        select: { payRatePercent: true },
    });
    if (member?.payRatePercent != null) return member.payRatePercent;

    const business = await tx.business.findUnique({
        where: { id: businessId },
        select: { defaultSitterPayPercent: true },
    });
    return business?.defaultSitterPayPercent ?? null;
};

/**
 * writeEarning
 *
 * Inserts one EmployeeEarning, snapshotting the rate that produced the amount.
 * For job-linked earnings the (jobId, type) unique constraint is the real
 * backstop against double-crediting, but this pre-checks so a duplicate returns
 * cleanly instead of aborting the surrounding transaction on a P2002 — Postgres
 * marks a transaction unusable after a constraint violation, so we must not
 * provoke one we intend to swallow.
 */
const writeEarning = async (
    tx: TxClient,
    params: {
        businessId: string;
        memberId: string;
        type: EarningType;
        amount: Prisma.Decimal;
        jobId?: string | null;
        ratePercent?: Prisma.Decimal | null;
        basisAmount?: Prisma.Decimal | null;
        description?: string | null;
    },
) => {
    const { businessId, memberId, type, amount, jobId, ratePercent, basisAmount, description } = params;

    if (jobId != null) {
        const existing = await tx.employeeEarning.findUnique({
            where: { jobId_type: { jobId, type } },
        });
        if (existing != null) return existing;
    }

    return tx.employeeEarning.create({
        data: {
            businessId,
            memberId,
            type,
            amount,
            jobId: jobId ?? null,
            ratePercent: ratePercent ?? null,
            basisAmount: basisAmount ?? null,
            description: description ?? null,
        },
    });
};

/** The Job fields the financial writes need. Keeps callers from passing a whole row. */
interface CompletedJobShape {
    id: string;
    businessId: string;
    assigneeId: string | null;
    price: Prisma.Decimal;
}

/**
 * recordJobCompletionFinancials
 *
 * Called when a job reaches COMPLETED. Writes two things:
 *
 *   1. A JOB_PAYMENT credit to the business ledger for the job's price. This is
 *      revenue recognition, NOT proof a card was charged — there is no payment
 *      processor wired up yet (see AI_MANIFEST "Planned, Not Yet Designed").
 *   2. A JOB_PAY earning for the assigned sitter, if a pay rate resolves.
 *
 * Sitter pay is a percentage of `Job.price`, which is the per-session service
 * price only — it deliberately excludes the flat Business.serviceFeeAmount and
 * any booking add-ons, neither of which is attributed to an individual job.
 *
 * Both writes are skipped-if-present rather than assumed-absent, because
 * COMPLETED is reachable from two mutations (clockOut and completeJob).
 *
 * A job with no assignee, or whose sitter has no pay rate and whose business has
 * no default, accrues NO earning and this is not an error: refusing to let a
 * sitter finish a job because payroll isn't configured is worse than a missing
 * accrual, which an owner can still settle later with a BONUS or ADJUSTMENT
 * earning. The trade-off is that the gap is silent — an owner dashboard should
 * surface completed jobs that produced no JOB_PAY.
 *
 * MUST be called inside runSerializable (it calls appendLedgerEntry).
 */
export const recordJobCompletionFinancials = async (
    tx: TxClient,
    job: CompletedJobShape,
): Promise<void> => {
    const alreadyCredited = await tx.ledgerEntry.findFirst({
        where: { jobId: job.id, referenceType: 'JOB_PAYMENT' },
        select: { id: true },
    });

    if (alreadyCredited == null) {
        await appendLedgerEntry(tx, {
            businessId: job.businessId,
            entryType: 'CREDIT',
            amount: job.price,
            referenceType: 'JOB_PAYMENT',
            jobId: job.id,
            description: 'Job completed',
        });
    }

    if (job.assigneeId == null) return;

    const ratePercent = await resolveSitterPayRate(tx, job.assigneeId, job.businessId);
    if (ratePercent == null) return;

    const amount = job.price.times(ratePercent).dividedBy(HUNDRED).toDecimalPlaces(2);

    await writeEarning(tx, {
        businessId: job.businessId,
        memberId: job.assigneeId,
        type: 'JOB_PAY',
        amount,
        jobId: job.id,
        ratePercent,
        basisAmount: job.price,
        description: 'Sitter pay for completed job',
    });
};

/**
 * Tips pass through to the sitter in full. Recorded on the earning row as an
 * explicit rate rather than left implicit, so a statement can show why the
 * amount is what it is, and so introducing a business cut later changes this
 * one constant instead of reinterpreting existing rows.
 */
const TIP_PASSTHROUGH_PERCENT = new Prisma.Decimal(100);

/**
 * recordTipFinancials
 *
 * Called when a customer tips a completed job. Credits the business ledger and
 * accrues the tip to the assigned sitter.
 *
 * Unlike sitter pay this does NOT consult a pay rate: a tip is the customer's
 * money for the sitter, not revenue the business shares out, so the sitter's
 * percentage is irrelevant to it.
 *
 * MUST be called inside runSerializable, and the caller must have verified
 * inside that same transaction that the job has not already been tipped — the
 * ledger has no unique constraint standing behind that check the way
 * EmployeeEarning's (jobId, type) does.
 */
export const recordTipFinancials = async (
    tx: TxClient,
    job: { id: string; businessId: string; assigneeId: string | null },
    tipAmount: Prisma.Decimal,
): Promise<void> => {
    await appendLedgerEntry(tx, {
        businessId: job.businessId,
        entryType: 'CREDIT',
        amount: tipAmount,
        referenceType: 'TIP',
        jobId: job.id,
        description: 'Customer tip',
    });

    // A completed job always has an assignee in practice — ASSIGNED and
    // IN_PROGRESS are the only routes to COMPLETED — but assigneeId is nullable,
    // so the tip still lands on the business books rather than failing outright.
    if (job.assigneeId == null) return;

    await writeEarning(tx, {
        businessId: job.businessId,
        memberId: job.assigneeId,
        type: 'TIP',
        amount: tipAmount,
        jobId: job.id,
        ratePercent: TIP_PASSTHROUGH_PERCENT,
        basisAmount: tipAmount,
        description: 'Customer tip',
    });
};

/**
 * settleEarningsIntoPayout
 *
 * Settles a sitter's outstanding earnings: creates the Payout, claims the
 * earnings for it, and debits the business ledger — the one place cash leaves
 * the books for wages.
 *
 * The payout's `amount` is SUMMED FROM the earnings it claims and is never
 * accepted from a caller. A payout whose amount disagrees with its own line
 * items is the same class of silent drift as a denormalized aggregate going
 * stale, except here it is money.
 *
 * `throughDate` bounds the settlement to earnings accrued on or before it, for
 * a weekly payroll cutoff. Omit it to settle everything outstanding.
 *
 * The claim is a conditional updateMany filtered on `payoutId: null` whose
 * affected-row count must match what was read. Serializable isolation should
 * already make two concurrent payouts for one member conflict, but this check
 * does not depend on that: if anything ever runs it at a weaker level, a
 * double-claim aborts instead of paying the same earning twice.
 *
 * MUST be called inside runSerializable.
 */
export const settleEarningsIntoPayout = async (
    tx: TxClient,
    params: {
        businessId: string;
        memberId: string;
        throughDate?: Date | undefined;
        method?: string | undefined;
        note?: string | undefined;
    },
) => {
    const { businessId, memberId, throughDate, method, note } = params;

    const outstanding = await tx.employeeEarning.findMany({
        where: {
            businessId,
            memberId,
            payoutId: null,
            ...(throughDate !== undefined ? { createdAt: { lte: throughDate } } : {}),
        },
        select: { id: true, amount: true },
    });

    if (outstanding.length === 0) {
        throw new GraphQLError('This sitter has no outstanding earnings to pay out.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const amount = outstanding.reduce(
        (total, earning) => total.plus(earning.amount),
        ZERO,
    );

    // A run of ADJUSTMENT earnings could in principle net to zero or below.
    // Paying that out would write a meaningless ledger entry, and a negative
    // amount would corrupt the balance, since appendLedgerEntry takes direction
    // from entryType rather than the sign.
    if (amount.lessThanOrEqualTo(ZERO)) {
        throw new GraphQLError('Outstanding earnings do not add up to a payable amount.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const payout = await tx.payout.create({
        data: {
            businessId,
            memberId,
            amount,
            // Recorded as already paid: this mutation logs a transfer the owner
            // made outside the app, so there is no pending window. PENDING and
            // FAILED are reserved for a future payment processor and nothing
            // produces them yet.
            status: 'PAID',
            paidAt: new Date(),
            method: method ?? null,
            note: note ?? null,
        },
    });

    const claimed = await tx.employeeEarning.updateMany({
        where: {
            id: { in: outstanding.map((earning) => earning.id) },
            payoutId: null,
        },
        data: { payoutId: payout.id },
    });

    if (claimed.count !== outstanding.length) {
        throw new GraphQLError(
            'These earnings were paid out by another request. Please try again.',
            { extensions: { code: 'CONFLICT' } },
        );
    }

    await appendLedgerEntry(tx, {
        businessId,
        entryType: 'DEBIT',
        amount,
        referenceType: 'PAYOUT',
        payoutId: payout.id,
        description: 'Sitter payout',
    });

    return payout;
};
