import { getMe } from './queries/getMe.js';
import { getUserById } from './queries/getUserById.js';

export const userResolvers = {
    Query: {
        getMe,
        getUserById,
    },
    Mutation: {},
};
