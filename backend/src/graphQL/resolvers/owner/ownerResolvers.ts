import { registerOwner } from './mutations/registerOwner.js';

export const ownerResolvers = {
    Query: {},
    Mutation: {
        registerOwner,
    },
};
