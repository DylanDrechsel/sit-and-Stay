import { GraphQLError } from 'graphql';
import { hashPassword, signToken } from '../../../../utils/auth.js';
import { registerCustomerSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { RegisterCustomerInput } from '../../../../types/registration.js';

// ── Resolvers ──────────────────────────────────────────────────────────────

export const registerCustomer = {
    Mutation: {
        /**
         * registerCustomer
         * Creates a User (globalRole: USER) and a linked CustomerProfile in one transaction.
         * Returns a signed JWT + the new user.
         */
        registerCustomer: async (
            _: unknown,
            { input }: { input: RegisterCustomerInput },
            context: GraphQLContext,
        ) => {
            // 1. Validate
            const parsed = registerCustomerSchema.safeParse(input);
            if (parsed.success === false) {
                throw new GraphQLError(formatZodError(parsed.error), {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            const { email, password, firstName, lastName, phone } = parsed.data;

            // 2. Check email uniqueness
            const existing = await context.prisma.user.findUnique({ where: { email } });
            if (existing) {
                throw new GraphQLError('An account with this email already exists', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            // 3. Hash password and create User + CustomerProfile atomically
            const passwordHash = await hashPassword(password);

            const user = await context.prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: { email, passwordHash, firstName, lastName, phone: phone ?? null, globalRole: 'USER' },
                });
                await tx.customerProfile.create({
                    data: { userId: newUser.id },
                });
                return newUser;
            });

            const token = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
            return { token, user };
        },
    },
};
