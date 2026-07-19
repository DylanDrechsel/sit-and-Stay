import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { getMyEarningsSchema, formatZodError } from '../../../../utils/validate.js';
import { requireActiveMembership } from '../financeAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetMyEarningsArgs } from '../../../../types/finance.js';

/**
 * getMyEarnings
 *
 * The caller's own earnings at one business, newest first. Any active member
 * may call this regardless of role — a sitter has to be able to see what they
 * have earned and what is still owed.
 *
 * The memberId is taken from the caller's own membership and never from input,
 * which is what keeps this safe to expose to EMPLOYEEs: there is no argument
 * that could point it at somebody else's pay.
 */
export const getMyEarnings = async (
    _: unknown,
    args: GetMyEarningsArgs,
    context: GraphQLContext,
) => {
    const parsed = getMyEarningsSchema.safeParse(args);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, unpaidOnly, limit } = parsed.data;

    const membership = await requireActiveMembership(businessId, context);

    const where: Prisma.EmployeeEarningWhereInput = { memberId: membership.id };
    if (unpaidOnly) where.payoutId = null;

    return context.prisma.employeeEarning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
