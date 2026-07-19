import { GraphQLError } from 'graphql';
import { setMemberPayRateSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { SetMemberPayRateInput } from '../../../../types/business.js';

/**
 * setMemberPayRate
 *
 * Sets one member's share of a job's price, as a percent. Passing null clears
 * the override so Business.defaultSitterPayPercent applies to them again.
 *
 * OWNER only — deliberately stricter than removeMember, which lets a MANAGER
 * act on EMPLOYEEs. Pay is the one thing a MANAGER must not be able to change,
 * because nothing else in the model would stop them raising their own.
 *
 * This is read-forward only: the rate is looked up at the moment a job completes
 * and snapshotted onto the EmployeeEarning row it produces, so changing it here
 * never restates pay a sitter has already accrued.
 */
export const setMemberPayRate = async (
    _: unknown,
    { input }: { input: SetMemberPayRateInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = setMemberPayRateSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, memberId, payRatePercent } = parsed.data;

    const callerMembership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (callerMembership == null || !callerMembership.isActive || callerMembership.role !== 'OWNER') {
        throw new GraphQLError('Only the business owner can set pay rates.', {
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

    if (!targetMembership.isActive) {
        throw new GraphQLError('This member has been removed from the business.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.businessMember.update({
        where: { id: memberId },
        data: {
            // Fixed-2dp string rather than a float, matching updateBusiness and
            // createBooking — the Decimal(5,2) column defines the precision.
            payRatePercent: payRatePercent === null ? null : payRatePercent.toFixed(2),
        },
        include: { user: true },
    });
};
