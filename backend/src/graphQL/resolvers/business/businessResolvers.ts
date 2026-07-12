import { getMyBusinesses } from './queries/getMyBusinesses.js';
import { getBusinessMembers } from './queries/getBusinessMembers.js';
import { getInactiveBusinessMembers } from './queries/getInactiveBusinessMembers.js';
import { updateBusiness } from './mutations/updateBusiness.js';
import { deactivateBusiness } from './mutations/deactivateBusiness.js';
import { removeMember } from './mutations/removeMember.js';

export const businessResolvers = {
    Query: {
        getMyBusinesses,
        getBusinessMembers,
        getInactiveBusinessMembers,
    },
    Mutation: {
        updateBusiness,
        deactivateBusiness,
        removeMember,
    },
};
