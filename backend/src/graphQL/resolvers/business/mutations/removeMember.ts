import { GraphQLError } from 'graphql';
import { removeMemberSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { RemoveMemberInput } from '../../../../types/business.js';

/**
 * removeMember
 *
 * Soft-removes a member from a business by setting their membership's isActive flag to false.
 * Role-based permission rules:
 *
 *   - OWNER  → can remove MANAGER or EMPLOYEE
 *   - MANAGER → can only remove EMPLOYEE
 *   - EMPLOYEE → no permission to remove anyone
 *
 * Additional guards:
 *   - The OWNER membership record can never be removed (business would be ownerless)
 *   - A caller cannot remove themselves
 *   - The target must belong to the same business as specified in businessId
 *
 * Returns the deactivated BusinessMember record (including user profile) so the
 * frontend can confirm the resulting inactive state without a follow-up query.
 */
export const removeMember = async (
    _: unknown,
    { input }: { input: RemoveMemberInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // Validate — enforces UUID format on both IDs
    const parsed = removeMemberSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { businessId, memberId } = parsed.data;

    // Fetch the caller's membership in this business
    const callerMembership = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: { userId: context.user.userId, businessId },
        },
    });

    if (
        callerMembership == null ||
        !callerMembership.isActive ||
        !['OWNER', 'MANAGER'].includes(callerMembership.role)
    ) {
        throw new GraphQLError('You do not have permission to remove members from this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // Fetch the target membership — include user so we can return it after deletion
    const targetMembership = await context.prisma.businessMember.findUnique({
        where: { id: memberId },
        include: { user: true },
    });

    if (
        targetMembership == null ||
        !targetMembership.isActive ||
        targetMembership.businessId !== businessId
    ) {
        throw new GraphQLError('Member not found in this business.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // Cannot remove yourself — use a separate "leave business" flow for that
    if (targetMembership.userId === context.user.userId) {
        throw new GraphQLError('You cannot remove yourself from the business.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // The OWNER role is permanent — ownership transfer requires a dedicated flow
    if (targetMembership.role === 'OWNER') {
        throw new GraphQLError('The business owner cannot be removed. Transfer ownership first.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // A MANAGER can only remove EMPLOYEEs — not other MANAGERs
    if (callerMembership.role === 'MANAGER' && targetMembership.role === 'MANAGER') {
        throw new GraphQLError('Managers can only remove Employees.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // Preserve the membership and related history while revoking business access.
    return context.prisma.businessMember.update({
        where: { id: memberId },
        data: { isActive: false },
        include: { user: true },
    });
};
