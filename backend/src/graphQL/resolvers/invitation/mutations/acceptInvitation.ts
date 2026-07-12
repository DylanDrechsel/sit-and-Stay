import { GraphQLError } from 'graphql';
import { hashPassword, signToken } from '../../../../utils/auth.js';
import { acceptInvitationSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { AcceptInvitationInput } from '../../../../types/invitation.js';

/**
 * acceptInvitation
 *
 * Validates a secure invitation token and links the user to the business.
 * Handles two distinct paths:
 *
 *   PATH A — New user:
 *     The invited email has no existing account.
 *     Requires: password, firstName, lastName (phone is optional).
 *     Creates a new User + BusinessMember record in one atomic transaction.
 *
 *   PATH B — Existing user:
 *     The invited email already has an account (e.g. they're a customer on the platform).
 *     Only the token is needed — profile fields are ignored.
 *     Creates only the BusinessMember record linking them to the new business.
 *
 * In both paths the invitation is marked as accepted and a signed JWT is returned
 * so the user is immediately logged in.
 */
export const acceptInvitation = async (
    _: unknown,
    { input }: { input: AcceptInvitationInput },
    context: GraphQLContext,
) => {
    // 1. Validate the raw input shape (token required; profile fields optional here)
    const parsed = acceptInvitationSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { token, password, firstName, lastName, phone } = parsed.data;

    // 2. Look up and validate the invitation token
    const invitation = await context.prisma.invitation.findUnique({ where: { token } });

    if (invitation == null) {
        throw new GraphQLError('Invalid invitation token.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    if (invitation.isAccepted) {
        throw new GraphQLError('This invitation has already been used.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    if (new Date() > invitation.expiresAt) {
        throw new GraphQLError('This invitation has expired. Please ask for a new one.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // 3. Check whether the invitee's email already has an account
    const existingUser = await context.prisma.user.findUnique({
        where: { email: invitation.email },
    });

    // 4. PATH A — New user: enforce required registration fields
    if (existingUser == null) {
        if (!password || !firstName || !lastName) {
            throw new GraphQLError(
                'Password, first name, and last name are required to create your account.',
                { extensions: { code: 'BAD_USER_INPUT' } },
            );
        }

        const passwordHash = await hashPassword(password);

        const newUser = await context.prisma.$transaction(async (tx) => {
            // Create the user account
            const user = await tx.user.create({
                data: {
                    email: invitation.email,
                    passwordHash,
                    firstName,
                    lastName,
                    phone: phone ?? null,
                    globalRole: 'USER',
                },
            });

            // Link user to the business with the invited role
            await tx.businessMember.create({
                data: {
                    userId: user.id,
                    businessId: invitation.businessId,
                    role: invitation.role,
                    isActive: true,
                },
            });

            // Mark the invitation as consumed
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { isAccepted: true },
            });

            return user;
        });

        const jwtToken = signToken({
            userId: newUser.id,
            email: newUser.email,
            globalRole: newUser.globalRole,
        });

        return { token: jwtToken, user: newUser };
    }

    // 5. PATH B — Existing user: check they're not already a member of this business
    const alreadyMember = await context.prisma.businessMember.findUnique({
        where: {
            userId_businessId: {
                userId: existingUser.id,
                businessId: invitation.businessId,
            },
        },
    });

    if (alreadyMember?.isActive) {
        throw new GraphQLError(
            'You are already a member of this business.',
            { extensions: { code: 'BAD_USER_INPUT' } },
        );
    }

    // Link a new user to the business or reactivate a previously removed member.
    // Mark the invitation accepted in the same transaction.
    await context.prisma.$transaction(async (tx) => {
        if (alreadyMember == null) {
            await tx.businessMember.create({
                data: {
                    userId: existingUser.id,
                    businessId: invitation.businessId,
                    role: invitation.role,
                    isActive: true,
                },
            });
        } else {
            await tx.businessMember.update({
                where: { id: alreadyMember.id },
                data: { role: invitation.role, isActive: true },
            });
        }

        await tx.invitation.update({
            where: { id: invitation.id },
            data: { isAccepted: true },
        });
    });

    const jwtToken = signToken({
        userId: existingUser.id,
        email: existingUser.email,
        globalRole: existingUser.globalRole,
    });

    return { token: jwtToken, user: existingUser };
};
