import { GraphQLError } from 'graphql';
import { recordPayoutSchema, formatZodError } from '../../../../utils/validate.js';
import { runSerializable, settleEarningsIntoPayout } from '../../../../utils/ledger.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { RecordPayoutInput } from '../../../../types/finance.js';

/**
 * recordPayout
 *
 * Settles what a sitter is owed: creates a Payout covering their outstanding
 * earnings, marks those earnings paid, and debits the business ledger — all in
 * one transaction, so earnings can never be marked settled without the cash
 * leaving the books.
 *
 * OWNER only, matching setMemberPayRate. A MANAGER can read the books and run
 * the schedule, but moving money is the owner's decision — and nothing else in
 * the model would stop a MANAGER paying themselves.
 *
 * This records a transfer that already happened outside the app (Venmo, cash,
 * bank transfer), so the payout is created as PAID. There is no payment
 * processor, and nothing here moves real money.
 *
 * The amount is never taken from input — see settleEarningsIntoPayout.
 *
 * There is no reversal. A payout recorded by mistake cannot currently be voided,
 * because releasing the earnings would also need a compensating ledger entry and
 * a rule for what happens if the sitter was genuinely paid. Until that exists,
 * a mistake has to be corrected with an ADJUSTMENT earning.
 */
export const recordPayout = async (
    _: unknown,
    { input }: { input: RecordPayoutInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = recordPayoutSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, memberId, throughDate, method, note } = parsed.data;

    const callerMembership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId } },
    });

    if (callerMembership == null || !callerMembership.isActive || callerMembership.role !== 'OWNER') {
        throw new GraphQLError('Only the business owner can record payouts.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const targetMembership = await context.prisma.businessMember.findUnique({
        where: { id: memberId },
    });

    if (targetMembership == null || targetMembership.businessId !== businessId) {
        throw new GraphQLError('Member not found in this business.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // Deliberately no isActive check on the target. Removing someone from a
    // business does not discharge what they earned before leaving, and refusing
    // to pay a departed sitter would strand that money permanently.

    return runSerializable(context.prisma, async (tx) =>
        settleEarningsIntoPayout(tx, {
            businessId,
            memberId,
            throughDate,
            method,
            note,
        }),
    );
};
