import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getMyPets
 *
 * Returns the authenticated customer's active pets, ordered by name.
 * Requires the caller to have a CustomerProfile (i.e. be registered as a customer).
 */
export const getMyPets = async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });

    if (customer == null) {
        throw new GraphQLError('Only customers can have pets.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    return context.prisma.pet.findMany({
        where: { customerId: customer.id, isActive: true },
        orderBy: { name: 'asc' },
    });
};
