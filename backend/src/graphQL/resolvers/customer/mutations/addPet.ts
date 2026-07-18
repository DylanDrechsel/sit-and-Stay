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

    const {
        name, type, breed, age, sex, weightLb, photoUrl,
        isNeutered, isMicrochipped, medicalNotes, careInstructions,
        homeAccessNotes, vetName, vetClinic, vetPhone,
    } = parsed.data;

    // Build the create payload explicitly — only include fields that were
    // provided. Spreading the parsed object directly would carry Zod's
    // `T | undefined` optional types straight into Prisma's input type, which
    // exactOptionalPropertyTypes rejects (Prisma expects `T | null`, not
    // `T | undefined`, on these optional fields).
    const petData: {
        customerId: string;
        name: string;
        type: 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'REPTILE' | 'OTHER';
        breed?: string;
        age?: number;
        sex?: 'MALE' | 'FEMALE';
        weightLb?: number;
        photoUrl?: string;
        isNeutered?: boolean;
        isMicrochipped?: boolean;
        medicalNotes?: string;
        careInstructions?: string;
        homeAccessNotes?: string;
        vetName?: string;
        vetClinic?: string;
        vetPhone?: string;
    } = {
        customerId: customer.id,
        name,
        type,
    };

    if (breed !== undefined) petData.breed = breed;
    if (age !== undefined) petData.age = age;
    if (sex !== undefined) petData.sex = sex;
    if (weightLb !== undefined) petData.weightLb = weightLb;
    if (photoUrl !== undefined) petData.photoUrl = photoUrl;
    if (isNeutered !== undefined) petData.isNeutered = isNeutered;
    if (isMicrochipped !== undefined) petData.isMicrochipped = isMicrochipped;
    if (medicalNotes !== undefined) petData.medicalNotes = medicalNotes;
    if (careInstructions !== undefined) petData.careInstructions = careInstructions;
    if (homeAccessNotes !== undefined) petData.homeAccessNotes = homeAccessNotes;
    if (vetName !== undefined) petData.vetName = vetName;
    if (vetClinic !== undefined) petData.vetClinic = vetClinic;
    if (vetPhone !== undefined) petData.vetPhone = vetPhone;

    return context.prisma.pet.create({ data: petData });
};
