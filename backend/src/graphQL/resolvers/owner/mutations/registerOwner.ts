import { GraphQLError } from 'graphql';
import { hashPassword, signToken } from '../../../../utils/auth.js';
import { registerOwnerSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';

// ── Input Types ────────────────────────────────────────────────────────────

export interface RegisterCustomerInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface RegisterOwnerInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    businessName: string;
    businessDescription?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

// ── Resolvers ──────────────────────────────────────────────────────────────

export const registerOwner = {
    Mutation: {
        /**
         * registerOwner
         * Creates a User + Business + BusinessMember(OWNER) in one transaction.
         * Returns a signed JWT + the new user + the new business.
         */
        registerOwner: async (
            _: unknown,
            { input }: { input: RegisterOwnerInput },
            context: GraphQLContext,
        ) => {
            // 1. Validate
            const parsed = registerOwnerSchema.safeParse(input);
            if (!parsed.success) {
                throw new GraphQLError(formatZodError(parsed.error), {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            const { email, password, firstName, lastName, phone, businessName, businessDescription } = parsed.data;

            // 2. Check email uniqueness
            const existing = await context.prisma.user.findUnique({ where: { email } });
            if (existing) {
                throw new GraphQLError('An account with this email already exists', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            // 3. Hash password and create User + Business + BusinessMember atomically
            const passwordHash = await hashPassword(password);

            const { user, business } = await context.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: { email, passwordHash, firstName, lastName, phone: phone ?? null, globalRole: 'USER' },
                });
                const newBusiness = await tx.business.create({
                    data: { name: businessName, description: businessDescription ?? null },
                });
                await tx.businessMember.create({
                    data: { userId: newUser.id, businessId: newBusiness.id, role: 'OWNER' },
                });
                return { user: newUser, business: newBusiness };
            });

            const token = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
            return { token, user, business };
        },
    },
};
