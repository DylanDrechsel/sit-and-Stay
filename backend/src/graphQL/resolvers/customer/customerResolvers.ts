import { registerCustomer } from './mutations/registerCustomer.js';
import { addPet } from './mutations/addPet.js';
import { updatePet } from './mutations/updatePet.js';
import { deletePet } from './mutations/deletePet.js';
import { getMyPets } from './queries/getMyPets.js';

export const customerResolvers = {
    Query: {
        getMyPets,
    },
    Mutation: {
        registerCustomer,
        addPet,
        updatePet,
        deletePet,
    },
};
