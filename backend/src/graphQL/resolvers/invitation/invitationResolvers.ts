import { acceptInvitation } from './mutations/acceptInvitation.js';
import { inviteEmployee } from './mutations/inviteEmployee.js';

export const invitationResolvers = {
    Query: {},
    Mutation: {
        acceptInvitation,
        inviteEmployee,
    },
};
