import { ownerLogin } from './mutations/ownerLogin.js';
import { ownerRegister } from './mutations/ownerRegister.js';
import { ownerUpdate } from './mutations/ownerUpdate.js';
import { getOwner } from './queries/getOwner.js';

export const ownerResolvers = {
    Query: {
        getOwner,
    },
    Mutation: {
        ownerLogin,
        ownerRegister,
        ownerUpdate,
    },
};
