import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * deletePet
 *
 * Soft-deletes one of the authenticated customer's own pets by setting
 * isActive to false. Does not delete any data — job history referencing
 * this pet is preserved.
 */
export const deletePet = async (
    _: unknown,
    { petId }: { petId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    if (!petId?.trim()) {
        throw new GraphQLError('Pet ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });

    if (customer == null) {
        throw new GraphQLError('Only customers can delete pets.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const pet = await context.prisma.pet.findUnique({ where: { id: petId } });

    if (pet == null || pet.customerId !== customer.id) {
        throw new GraphQLError('Pet not found.', {
            extensions: { code: 'NOT_FOUND' },
        });
    }

    if (!pet.isActive) {
        throw new GraphQLError('This pet has already been deleted.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.pet.update({
        where: { id: petId },
        data: { isActive: false },
    });
};
