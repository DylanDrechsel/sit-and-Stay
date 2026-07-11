import { GraphQLError } from 'graphql';
import { hashPassword, signToken } from '../../../../utils/auth.js';
import { acceptInvitationSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { AcceptInvitationInput } from '../../../../types/invitation.js';

/**
 * acceptInvitation
 * Validates a token and creates the user account + BusinessMember record.
 * Handles two cases:
 *   1. Invitee does not have an account — creates a new User
 *   2. Invitee already has an account — links it to the business (no new User created)
 *
 * Returns a signed JWT so the user is immediately logged in after accepting.
 */
export const acceptInvitation = async (
    _: unknown,
    { input }: { input: AcceptInvitationInput },
    context: GraphQLContext,
) => {
    // 1. Validate input
    const parsed = acceptInvitationSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { token, password, firstName, lastName, phone } = parsed.data;

    // 2. Find and validate the invitation
    const invitation = await context.prisma.invitation.findUnique({ where: { token } });

    if (invitation == null) {
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

    // $transaction ensures that either all operations succeed or none do, preventing partial updates
    const user = await context.prisma.$transaction(async (tx) => {
        // Check if the invited email already has an account
        let existingUser = await tx.user.findUnique({
            where: { email: invitation.email },
        });

        if (existingUser == null) {
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
};