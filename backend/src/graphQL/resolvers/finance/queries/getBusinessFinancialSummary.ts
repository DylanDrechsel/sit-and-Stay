import { GraphQLError } from 'graphql';
import { businessFinanceScopeSchema, formatZodError } from '../../../../utils/validate.js';
import { requireFinanceManager } from '../financeAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetBusinessFinancialSummaryArgs } from '../../../../types/finance.js';

/**
 * getBusinessFinancialSummary
 *
 * The owner dashboard's headline finance numbers. OWNER/MANAGER only.
 *
 * The three money figures answer different questions and should not be
 * collapsed into one: `currentBalance` is cash recorded as taken in,
 * `unpaidEarningsTotal` is a liability owed to sitters that has not left the
 * account yet, and `availableBalance` is what remains after settling it.
 *
 * `jobsMissingPayCount` exists because a missing pay rate fails silently by
 * design — a job completes even when no rate resolves, so nobody is blocked
 * from finishing work by unconfigured payroll (see recordJobCompletionFinancials).
 * The cost of that choice is an invisible gap, and this count is what makes it
 * visible. A non-zero value means someone worked and accrued nothing.
 *
 * Note `currentBalance` counts money the ledger says was taken in, which is not
 * the same as money actually collected — there is no payment processor wired up,
 * so a JOB_PAYMENT credit records revenue, not a settled card charge.
 */
export const getBusinessFinancialSummary = async (
    _: unknown,
    args: GetBusinessFinancialSummaryArgs,
    context: GraphQLContext,
) => {
    const parsed = businessFinanceScopeSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId } = parsed.data;

    await requireFinanceManager(businessId, context);

    const [latestEntry, unpaidAggregate, jobsMissingPayCount] = await Promise.all([
        // Balance is carried on the most recent entry, not summed over the table.
        context.prisma.ledgerEntry.findFirst({
            where: { businessId },
            orderBy: { seq: 'desc' },
            select: { balanceAfter: true },
        }),
        context.prisma.employeeEarning.aggregate({
            where: { businessId, payoutId: null },
            _sum: { amount: true },
        }),
        // A completed job that had someone assigned but produced no JOB_PAY row.
        context.prisma.job.count({
            where: {
                businessId,
                status: 'COMPLETED',
                assigneeId: { not: null },
                earnings: { none: { type: 'JOB_PAY' } },
            },
        }),
    ]);

    const currentBalance = Number(latestEntry?.balanceAfter ?? 0);
    const unpaidEarningsTotal = Number(unpaidAggregate._sum.amount ?? 0);

    return {
        currentBalance,
        unpaidEarningsTotal,
        // Can legitimately go negative: more owed to sitters than recorded as
        // taken in. Surfacing that is the point — don't clamp it to zero.
        availableBalance: currentBalance - unpaidEarningsTotal,
        jobsMissingPayCount,
    };
};
