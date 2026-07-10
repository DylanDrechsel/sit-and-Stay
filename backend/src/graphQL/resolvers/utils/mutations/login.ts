import { GraphQLError } from 'graphql';
import { comparePassword, signToken } from '../../../../utils/auth.js';
import { loginSchema, formatZodError } from '../../../../utils/validate.js';
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

export const login = {
    Mutation: {
        /**
         * login
         * Works for all user types (Customer, Owner, Manager, Employee).
         * Verifies credentials and returns a signed JWT.
         * Always returns a generic error message to prevent email enumeration.
         */
        login: async (
            _: unknown,
            { input }: { input: LoginInput },
            context: GraphQLContext,
        ) => {
            // 1. Validate
            const parsed = loginSchema.safeParse(input);
            if (!parsed.success) {
                throw new GraphQLError(formatZodError(parsed.error), {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }

            const { email, password } = parsed.data;

            // 2. Find user — use a generic error to prevent email enumeration attacks
            const user = await context.prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new GraphQLError('Invalid email or password', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }

            // 3. Compare password
            const valid = await comparePassword(password, user.passwordHash);
            if (!valid) {
                throw new GraphQLError('Invalid email or password', {
                    extensions: { code: 'UNAUTHENTICATED' },
                });
            }

            const token = signToken({ userId: user.id, email: user.email, globalRole: user.globalRole });
            return { token, user };
        },
    },
};
