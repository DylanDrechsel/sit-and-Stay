/**
 * Finance query argument and parent types.
 *
 * These queries take positional arguments rather than a single input object,
 * matching getBusinessJobs/getMyJobs — the read side of this codebase uses
 * loose args and reserves input objects for mutations.
 */

/** Args for the business ledger statement. `before` is a seq value, not a date. */
export interface GetBusinessLedgerArgs {
    businessId: string;
    limit?: number;
    before?: number;
}

/** Args for the owner dashboard's finance summary. */
export interface GetBusinessFinancialSummaryArgs {
    businessId: string;
}

/** Args for the payroll screen's per-sitter outstanding totals. */
export interface GetUnpaidEarningsByMemberArgs {
    businessId: string;
}

/** Args for an OWNER/MANAGER reading their business's earnings. */
export interface GetBusinessEarningsArgs {
    businessId: string;
    memberId?: string;
    unpaidOnly?: boolean;
    limit?: number;
}

/** Args for a member reading their own earnings. */
export interface GetMyEarningsArgs {
    businessId: string;
    unpaidOnly?: boolean;
    limit?: number;
}

/**
 * Input for recording a sitter payout.
 *
 * There is no `amount` here on purpose — the total is derived from the earnings
 * being settled, so a client cannot record a payout that disagrees with the
 * line items backing it. `throughDate` settles only earnings accrued on or
 * before it; omit it to settle everything outstanding.
 */
export interface RecordPayoutInput {
    businessId: string;
    memberId: string;
    throughDate?: string;
    method?: string;
    note?: string;
}

/**
 * Minimal parent shape for the LedgerEntry type-level field resolvers —
 * the Decimal-backed money fields plus the foreign keys the lazy relations
 * are looked up by.
 */
export interface LedgerEntryParent {
    amount: unknown;
    balanceAfter: unknown;
    jobId: string | null;
    payoutId: string | null;
}

/**
 * Minimal parent shape for the EmployeeEarning type-level field resolvers.
 * `payoutId` does double duty: it keys the lazy `payout` relation and is what
 * the derived `isPaid` flag reads.
 */
export interface EmployeeEarningParent {
    amount: unknown;
    ratePercent: unknown;
    basisAmount: unknown;
    jobId: string | null;
    memberId: string;
    payoutId: string | null;
}

/** Minimal parent shape for the Payout type-level field resolvers. */
export interface PayoutParent {
    id: string;
    amount: unknown;
    memberId: string;
}
