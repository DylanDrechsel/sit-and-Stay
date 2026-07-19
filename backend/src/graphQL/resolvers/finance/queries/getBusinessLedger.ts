import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getBusinessLedgerSchema, formatZodError } from '../../../../utils/validate.js';
import { requireFinanceManager } from '../financeAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetBusinessLedgerArgs } from '../../../../types/finance.js';

/**
 * getBusinessLedger
 *
 * A business's cash ledger, newest first — the statement view. OWNER/MANAGER only.
 *
 * Ordered and paged by `seq`, never `createdAt`. Postgres CURRENT_TIMESTAMP is
 * transaction-start time, so entries appended together share a timestamp; a
 * createdAt cursor would skip or repeat rows at page boundaries. seq is unique
 * and monotonic, so `seq < before` is an exact cursor.
 */
export const getBusinessLedger = async (
    _: unknown,
    args: GetBusinessLedgerArgs,
    context: GraphQLContext,
) => {
    const parsed = getBusinessLedgerSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, limit, before } = parsed.data;

    await requireFinanceManager(businessId, context);

    const where: Prisma.LedgerEntryWhereInput = { businessId };
    if (before !== undefined) where.seq = { lt: before };

    return context.prisma.ledgerEntry.findMany({
        where,
        orderBy: { seq: 'desc' },
        take: limit,
    });
};
