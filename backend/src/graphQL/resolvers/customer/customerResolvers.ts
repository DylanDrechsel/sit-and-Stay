import { registerCustomer } from './mutations/registerCustomer.js';

export const customerResolvers = {
    Query: {},
    Mutation: {
        registerCustomer
    },
};
