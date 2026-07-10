import { registerOwner } from './mutations/registerOwner.js';
import { getOwner } from './queries/getOwner.js';

export const ownerResolvers = {
    Query: {
        getOwner,
    },
    Mutation: {
        registerOwner,
    },
};
