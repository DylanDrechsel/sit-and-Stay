import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

export const getUserById = async (
    _: unknown,
    args: { userId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const user = await context.prisma.user.findUnique({
        where: { id: args.userId },
    });

    if (user == null) {
        throw new GraphQLError(`No user found with ID: ${args.userId}`, {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    return user;
};
