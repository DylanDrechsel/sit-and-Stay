/**
 * Pet management input types.
 */

/**
 * Input for adding a pet to the authenticated customer's profile.
 * name and type are required; everything else is optional.
 */
export interface AddPetInput {
    name: string;
    type: string; // PetType enum value: DOG | CAT | BIRD | RABBIT | REPTILE | OTHER
    breed?: string;
    age?: number;
    sex?: string; // PetSex enum value: MALE | FEMALE
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
}

/**
 * Input for updating one of the authenticated customer's own pets.
 * petId is required; all other fields are optional — only provided fields are written.
 * An empty string on a clearable text field clears it (sets it to null).
 */
export interface UpdatePetInput {
    petId: string;
    name?: string;
    type?: string;
    breed?: string | null;
    age?: number | null;
    sex?: string | null;
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
}
