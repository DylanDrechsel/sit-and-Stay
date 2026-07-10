import { GraphQLError } from 'graphql';
import crypto from 'crypto';
import { hashPassword, signToken } from '../../utils/auth.js';
import { inviteSchema, acceptInvitationSchema, formatZodError } from '../../utils/validate.js';
import type { GraphQLContext } from '../../types/context.js';

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

export const invitationResolvers = {
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
            if (!context.user) {
                throw new GraphQLError('You must be logged in to send invitations', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }

            // 2. Validate input
            const parsed = inviteSchema.safeParse(input);
            if (!parsed.success) {
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

            if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
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

        /**
         * acceptInvitation
         * Validates a token and creates the user account + BusinessMember record.
         * Handles two cases:
         *   1. Invitee does not have an account — creates a new User
         *   2. Invitee already has an account — links it to the business (no new User created)
         *
         * Returns a signed JWT so the user is immediately logged in after accepting.
         */
        acceptInvitation: async (
            _: unknown,
            { input }: { input: AcceptInvitationInput },
            context: GraphQLContext,
        ) => {
            // 1. Validate input
            const parsed = acceptInvitationSchema.safeParse(input);
            if (!parsed.success) {
                throw new GraphQLError(formatZodError(parsed.error), {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            const { token, password, firstName, lastName, phone } = parsed.data;

            // 2. Find and validate the invitation
            const invitation = await context.prisma.invitation.findUnique({ where: { token } });

            if (!invitation) {
                throw new GraphQLError('Invalid invitation token', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            if (invitation.isAccepted) {
                throw new GraphQLError('This invitation has already been used', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            if (new Date() > invitation.expiresAt) {
                throw new GraphQLError('This invitation has expired. Please ask for a new one', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            // 3. Create/find User + create BusinessMember + mark invitation accepted — all atomic
            const passwordHash = await hashPassword(password);

            const user = await context.prisma.$transaction(async (tx) => {
                // Check if the invited email already has an account
                let existingUser = await tx.user.findUnique({
                    where: { email: invitation.email },
                });

                if (!existingUser) {
                    existingUser = await tx.user.create({
                        data: {
                            email: invitation.email,
                            passwordHash,
                            firstName,
                            lastName,
                            phone: phone ?? null,
                            globalRole: 'USER',
                        },
                    });
                }

                // Link the user to the business with their assigned role
                await tx.businessMember.create({
                    data: {
                        userId: existingUser.id,
                        businessId: invitation.businessId,
                        role: invitation.role,
                    },
                });

                // Mark invitation as accepted so it can't be reused
                await tx.invitation.update({
                    where: { id: invitation.id },
                    data: { isAccepted: true },
                });

                return existingUser;
            });

            const jwtToken = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
            return { token: jwtToken, user };
        },
    },
};
