import { GraphQLError } from 'graphql';
import { updatePetSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { UpdatePetInput } from '../../../../types/pet.js';

/**
 * updatePet
 *
 * Partial update of one of the authenticated customer's own pets.
 * Only fields present in the input are written. Passing an empty string on a
 * clearable text field clears it (sets it to null); passing null on age, sex,
 * or weightLb also clears them.
 */
export const updatePet = async (
    _: unknown,
    { input }: { input: UpdatePetInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = updatePetSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const {
        petId, name, type, breed, age, sex, weightLb, photoUrl,
        isNeutered, isMicrochipped, medicalNotes, careInstructions,
        homeAccessNotes, vetName, vetClinic, vetPhone,
    } = parsed.data;

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });

    if (customer == null) {
        throw new GraphQLError('Only customers can update pets.', {
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

    // Build the update payload — only include fields that were explicitly provided.
    // Empty-string sentinels clear the clearable text fields (set to null).
    const updateData: {
        name?: string;
        type?: 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'REPTILE' | 'OTHER';
        breed?: string | null;
        age?: number | null;
        sex?: 'MALE' | 'FEMALE' | null;
        weightLb?: number | null;
        photoUrl?: string | null;
        isNeutered?: boolean;
        isMicrochipped?: boolean;
        medicalNotes?: string | null;
        careInstructions?: string | null;
        homeAccessNotes?: string | null;
        vetName?: string | null;
        vetClinic?: string | null;
        vetPhone?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (breed !== undefined) updateData.breed = breed === '' ? null : breed;
    if (age !== undefined) updateData.age = age;
    if (sex !== undefined) updateData.sex = sex;
    if (weightLb !== undefined) updateData.weightLb = weightLb;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl === '' ? null : photoUrl;
    if (isNeutered !== undefined) updateData.isNeutered = isNeutered;
    if (isMicrochipped !== undefined) updateData.isMicrochipped = isMicrochipped;
    if (medicalNotes !== undefined) updateData.medicalNotes = medicalNotes === '' ? null : medicalNotes;
    if (careInstructions !== undefined) updateData.careInstructions = careInstructions === '' ? null : careInstructions;
    if (homeAccessNotes !== undefined) updateData.homeAccessNotes = homeAccessNotes === '' ? null : homeAccessNotes;
    if (vetName !== undefined) updateData.vetName = vetName === '' ? null : vetName;
    if (vetClinic !== undefined) updateData.vetClinic = vetClinic === '' ? null : vetClinic;
    if (vetPhone !== undefined) updateData.vetPhone = vetPhone === '' ? null : vetPhone;

    return context.prisma.pet.update({
        where: { id: petId },
        data: updateData,
    });
};
