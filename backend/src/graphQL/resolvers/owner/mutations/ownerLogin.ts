import { GraphQLError } from 'graphql';
import { comparePassword, signToken } from '../../../../utils/auth.js';
import { loginSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';

export interface LoginInput {
    email: string;
    password: string;
}

export const ownerLogin = async (
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
};
