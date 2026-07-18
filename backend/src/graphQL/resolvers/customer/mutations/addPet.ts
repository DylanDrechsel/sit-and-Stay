import { GraphQLError } from 'graphql';
import { addPetSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { AddPetInput } from '../../../../types/pet.js';

/**
 * addPet
 *
 * Adds a pet to the authenticated customer's profile.
 * Requires the caller to have a CustomerProfile (i.e. be registered as a customer).
 */
export const addPet = async (
    _: unknown,
    { input }: { input: AddPetInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = addPetSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });

    if (customer == null) {
        throw new GraphQLError('Only customers can add pets.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const { type, sex, ...rest } = parsed.data;

    return context.prisma.pet.create({
        data: {
            customerId: customer.id,
            type: type as 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'REPTILE' | 'OTHER',
            sex: sex as 'MALE' | 'FEMALE' | undefined,
            ...rest,
        },
    });
};
