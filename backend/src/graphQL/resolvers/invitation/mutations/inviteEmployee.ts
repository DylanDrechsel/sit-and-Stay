import { GraphQLError } from 'graphql';
import crypto from 'crypto';
import { inviteSchema, formatZodError } from '../../../../utils/validate.js';
import { sendInvitationEmail } from '../../../../utils/email.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { InviteInput } from '../../../../types/invitation.js';

const INVITATION_EXPIRY_HOURS = 48;

/**
 * inviteEmployee
 * Sends a time-limited invitation to a Manager or Employee.
 * Rules:
 *   - Caller must be authenticated (valid JWT)
 *   - Caller must be OWNER or MANAGER in the target business
 *   - MANAGERs can only invite EMPLOYEEs (not other MANAGERs)
 *   - No duplicate pending invitations for the same email + business
 *
 * The invitation token is currently logged to the console.
 * Replace the console.log with Nodemailer when email is set up.
 */

export const inviteEmployee = async (
    _: unknown,
    { input }: { input: InviteInput },
    context: GraphQLContext,
) => {
    // 1. Auth check
    if (context.user == null) {
        throw new GraphQLError('You must be logged in to send invitations', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // 2. Validate input
    const parsed = inviteSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { email, role, businessId } = parsed.data;

    // 3. Check caller's role in the business + fetch business name in one query
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

    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to invite members to this business', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (business == null) {
        throw new GraphQLError('Business not found', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    // 4. Managers cannot invite other Managers
    if (membership.role === 'MANAGER' && role === 'MANAGER') {
        throw new GraphQLError('Managers can only invite Employees', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    // 5. Prevent duplicate pending invitations
    const existingInvite = await context.prisma.invitation.findFirst({
        where: { email, businessId, isAccepted: false },
    });
    if (existingInvite) {
        throw new GraphQLError('A pending invitation already exists for this email address', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // 6. Generate a cryptographically secure token and set expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation = await context.prisma.invitation.create({
        data: {
            businessId,
            email,
            role: role as 'MANAGER' | 'EMPLOYEE',
            token,
            expiresAt,
        },
    });

    // 7. Send invitation email (falls back to console.log in dev if SMTP is not configured)
    await sendInvitationEmail({
        toEmail: email,
        businessName: business.name,
        role,
        token,
        expiresAt,
    });

    return invitation;
};
