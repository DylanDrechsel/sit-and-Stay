import { getBusinessLedger } from './queries/getBusinessLedger.js';
import { getBusinessFinancialSummary } from './queries/getBusinessFinancialSummary.js';
import { getUnpaidEarningsByMember } from './queries/getUnpaidEarningsByMember.js';
import { getBusinessEarnings } from './queries/getBusinessEarnings.js';
import { getMyEarnings } from './queries/getMyEarnings.js';
import { recordPayout } from './mutations/recordPayout.js';
import type { GraphQLContext } from '../../../types/context.js';
import type {
    LedgerEntryParent,
    EmployeeEarningParent,
    PayoutParent,
} from '../../../types/finance.js';

export const financeResolvers = {
    Query: {
        getBusinessLedger,
        getBusinessFinancialSummary,
        getUnpaidEarningsByMember,
        getBusinessEarnings,
        getMyEarnings,
    },
    Mutation: {
        recordPayout,
    },

    // ── Type-level field resolvers ──────────────────────────────────────────
    // Same two jobs as the Job/Business maps: convert Prisma Decimal to Number
    // before it reaches a Float (Decimal instances aren't serializable there),
    // and resolve relations lazily so a statement query doesn't join tables the
    // caller never asked for. Spread onto the root map in resolvers/index.ts.
    //
    // Note there is no access check on these relation fields. Every path to a
    // LedgerEntry/EmployeeEarning/Payout already went through financeAccess, and
    // none of them can be reached from a public query — unlike Job.accessCode,
    // which is reachable from operations with looser rules and so re-checks.
    LedgerEntry: {
        amount: (parent: LedgerEntryParent) => Number(parent.amount),
        balanceAfter: (parent: LedgerEntryParent) => Number(parent.balanceAfter),

        job: (parent: LedgerEntryParent, _args: unknown, context: GraphQLContext) =>
            (parent.jobId == null
                ? null
                : context.prisma.job.findUnique({ where: { id: parent.jobId } })),

        payout: (parent: LedgerEntryParent, _args: unknown, context: GraphQLContext) =>
            (parent.payoutId == null
                ? null
                : context.prisma.payout.findUnique({ where: { id: parent.payoutId } })),
    },

    EmployeeEarning: {
        amount: (parent: EmployeeEarningParent) => Number(parent.amount),
        ratePercent: (parent: EmployeeEarningParent) =>
            (parent.ratePercent == null ? null : Number(parent.ratePercent)),
        basisAmount: (parent: EmployeeEarningParent) =>
            (parent.basisAmount == null ? null : Number(parent.basisAmount)),

        // Derived, not stored. An earning is settled exactly when a payout claims
        // it, so there is no separate status column to drift out of step.
        isPaid: (parent: EmployeeEarningParent) => parent.payoutId != null,

        job: (parent: EmployeeEarningParent, _args: unknown, context: GraphQLContext) =>
            (parent.jobId == null
                ? null
                : context.prisma.job.findUnique({ where: { id: parent.jobId } })),

        // Non-null in the schema — every earning has a member by FK.
        member: (parent: EmployeeEarningParent, _args: unknown, context: GraphQLContext) =>
            context.prisma.businessMember.findUnique({
                where: { id: parent.memberId },
                include: { user: true },
            }),

        payout: (parent: EmployeeEarningParent, _args: unknown, context: GraphQLContext) =>
            (parent.payoutId == null
                ? null
                : context.prisma.payout.findUnique({ where: { id: parent.payoutId } })),
    },

    Payout: {
        amount: (parent: PayoutParent) => Number(parent.amount),

        member: (parent: PayoutParent, _args: unknown, context: GraphQLContext) =>
            context.prisma.businessMember.findUnique({
                where: { id: parent.memberId },
                include: { user: true },
            }),

        earnings: (parent: PayoutParent, _args: unknown, context: GraphQLContext) =>
            context.prisma.employeeEarning.findMany({
                where: { payoutId: parent.id },
                orderBy: { createdAt: 'desc' },
            }),
    },
};
