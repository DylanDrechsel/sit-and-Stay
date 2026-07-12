import { acceptInvitation } from './mutations/acceptInvitation.js';
import { inviteEmployee } from './mutations/inviteEmployee.js';
import { resendInvitation } from './mutations/resendInvitation.js';

export const invitationResolvers = {
    Query: {},
    Mutation: {
        acceptInvitation,
        inviteEmployee,
        resendInvitation,
    },
};
