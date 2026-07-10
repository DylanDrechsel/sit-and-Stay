import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

export const getMe = async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const user = await context.prisma.user.findUnique({
        where: { id: context.user.userId },
    });

    if (user == null) {
        throw new GraphQLError('User not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    return user;
};
