import { getMe } from './queries/getMe.js';
import { getUserById } from './queries/getUserById.js';
import { updateUser } from './mutations/updateUser.js';
import { changePassword } from './mutations/changePassword.js';
import { changeEmail } from './mutations/changeEmail.js';

export const userResolvers = {
    Query: {
        getMe,
        getUserById,
    },
    Mutation: {
        updateUser,
        changePassword,
        changeEmail,
    },
};
