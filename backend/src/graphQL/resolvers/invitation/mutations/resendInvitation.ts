import { GraphQLError } from 'graphql';
import crypto from 'crypto';
import { inviteSchema, formatZodError } from '../../../../utils/validate.js';
import { sendInvitationEmail } from '../../../../utils/email.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { InviteInput } from '../../../../types/invitation.js';

const INVITATION_EXPIRY_HOURS = 48;

/**
 * resendInvitation
 *
 * Allows an OWNER or MANAGER to resend a pending invitation that may have
 * been lost (spam folder, wrong address, etc.).
 *
 * Rules:
 *   - Caller must be authenticated (valid JWT)
 *   - Caller must be OWNER or MANAGER of the target business
 *   - A pending (not yet accepted) invitation must already exist for that email + business
 *   - Generates a fresh token and resets the expiry window to 48 hours from now
 *   - Re-sends the invitation email
 *
 * Returns the updated Invitation record.
 */
export const resendInvitation = async (
    _: unknown,
    { input }: { input: InviteInput },
    context: GraphQLContext,
) => {
    // 1. Auth check
    if (context.user == null) {
        throw new GraphQLError('You must be logged in to resend invitations.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 2. Validate input (reuses the same InviteInput shape: email + role + businessId)
    const parsed = inviteSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { email, businessId } = parsed.data;

    // 3. Verify the caller's membership + fetch business name in parallel
    const [membership, business] = await Promise.all([
        context.prisma.businessMember.findUnique({
            where: {
                userId_businessId: { userId: context.user.userId, businessId },
            },
        }),
        context.prisma.business.findUnique({
            where: { id: businessId },
            select: { name: true },
        }),
    ]);

    if (membership == null || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to manage invitations for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (business == null) {
        throw new GraphQLError('Business not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // 4. Find the existing pending invitation for this email + business
    const existingInvite = await context.prisma.invitation.findFirst({
        where: { email, businessId, isAccepted: false },
    });

    if (existingInvite == null) {
        throw new GraphQLError(
            'No pending invitation found for this email address. Use inviteEmployee to send a new one.',
            { extensions: { code: 'NOT_FOUND' } },
        );
    }

    // 5. Generate a fresh token and reset the expiry window
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const updatedInvitation = await context.prisma.invitation.update({
        where: { id: existingInvite.id },
        data: {
            token: newToken,
            expiresAt: newExpiresAt,
        },
    });

    // 6. Re-send the invitation email with the new token
    await sendInvitationEmail({
        toEmail: email,
        businessName: business.name,
        role: updatedInvitation.role,
        token: newToken,
        expiresAt: newExpiresAt,
    });

    return updatedInvitation;
};
