import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getBusinessEarningsSchema, formatZodError } from '../../../../utils/validate.js';
import { requireFinanceManager } from '../financeAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetBusinessEarningsArgs } from '../../../../types/finance.js';

/**
 * getBusinessEarnings
 *
 * Every earning accrued at one business, newest first. OWNER/MANAGER only —
 * this crosses sitters, so it is deliberately not the query an EMPLOYEE uses
 * (that's getMyEarnings, which is scoped to the caller's own membership).
 *
 * `memberId` narrows to one sitter; `unpaidOnly` hides settled earnings.
 *
 * The memberId filter is combined with businessId rather than used alone, so a
 * member id belonging to another business returns nothing instead of leaking a
 * different tenant's rows.
 */
export const getBusinessEarnings = async (
    _: unknown,
    args: GetBusinessEarningsArgs,
    context: GraphQLContext,
) => {
    const parsed = getBusinessEarningsSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, memberId, unpaidOnly, limit } = parsed.data;

    await requireFinanceManager(businessId, context);

    const where: Prisma.EmployeeEarningWhereInput = { businessId };
    if (memberId !== undefined) where.memberId = memberId;
    if (unpaidOnly) where.payoutId = null;

    return context.prisma.employeeEarning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
