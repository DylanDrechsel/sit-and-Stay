import { GraphQLError } from 'graphql';
import { hashPassword, comparePassword, signToken } from '../../utils/auth.js';
import {
    registerCustomerSchema,
    registerOwnerSchema,
    loginSchema,
    formatZodError,
} from '../../utils/validate.js';
import type { GraphQLContext } from '../../types/context.js';

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

export const authResolvers = {
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
            if (!parsed.success) {
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
