import { GraphQLError } from 'graphql';
import crypto from 'crypto';
import { inviteSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';

const INVITATION_EXPIRY_HOURS = 48;

// ── Input Types ────────────────────────────────────────────────────────────

export interface InviteInput {
    email: string;
    role: string;
    businessId: string;
}

export interface AcceptInvitationInput {
    token: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

// ── Resolvers ──────────────────────────────────────────────────────────────

export const inviteEmployee = {
    Mutation: {
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
        inviteEmployee: async (
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

            // 3. Check caller's role in the business
            const membership = await context.prisma.businessMember.findUnique({
                where: {
                    userId_businessId: { userId: context.user.userId, businessId },
                },
            });

            if (membership == null || !['OWNER', 'MANAGER'].includes(membership.role)) {
                throw new GraphQLError('You do not have permission to invite members to this business', {
                    extensions: { code: 'FORBIDDEN' },
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

            // TODO: Replace with Nodemailer — send email containing the token link
            console.log(`\n📧  Invitation for ${email} (${role})`);
            console.log(`    Token: ${token}`);
            console.log(`    Expires: ${expiresAt.toISOString()}\n`);

            return invitation;
        },
    },
};
