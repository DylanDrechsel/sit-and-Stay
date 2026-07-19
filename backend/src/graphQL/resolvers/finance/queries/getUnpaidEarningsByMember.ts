import { GraphQLError } from 'graphql';
import { businessFinanceScopeSchema, formatZodError } from '../../../../utils/validate.js';
import { requireFinanceManager } from '../financeAccess.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { GetUnpaidEarningsByMemberArgs } from '../../../../types/finance.js';

/**
 * getUnpaidEarningsByMember
 *
 * What each sitter is currently owed — the payroll screen, and the query you'd
 * read before recording a payout. OWNER/MANAGER only.
 *
 * Members with nothing outstanding are omitted rather than returned as zero
 * rows: this is a list of debts, and a settled sitter has none. Sorted by
 * amount owed, descending.
 *
 * Includes members whose membership has since been deactivated. Removing
 * someone from a business does not discharge what they earned before leaving,
 * and hiding them here would make that money quietly unpayable.
 */
export const getUnpaidEarningsByMember = async (
    _: unknown,
    args: GetUnpaidEarningsByMemberArgs,
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

    const groups = await context.prisma.employeeEarning.groupBy({
        by: ['memberId'],
        where: { businessId, payoutId: null },
        _sum: { amount: true },
        _count: { _all: true },
    });

    if (groups.length === 0) return [];

    // One query for every member in the result rather than a lookup per group.
    const members = await context.prisma.businessMember.findMany({
        where: { id: { in: groups.map((group) => group.memberId) } },
        include: { user: true },
    });
    const membersById = new Map(members.map((member) => [member.id, member]));

    return groups
        .flatMap((group) => {
            const member = membersById.get(group.memberId);
            // A group whose member row is missing would mean an earning pointing
            // at a deleted membership, which the FK makes impossible. Skip rather
            // than assert, so one bad row can't fail the whole payroll screen.
            if (member == null) return [];
            return [{
                member,
                unpaidTotal: Number(group._sum.amount ?? 0),
                unpaidCount: group._count._all,
            }];
        })
        .sort((a, b) => b.unpaidTotal - a.unpaidTotal);
};
