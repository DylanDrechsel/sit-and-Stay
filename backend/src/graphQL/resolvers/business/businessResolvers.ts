import { getMyBusinesses } from './queries/getMyBusinesses.js';
import { getBusinessMembers } from './queries/getBusinessMembers.js';
import { getInactiveBusinessMembers } from './queries/getInactiveBusinessMembers.js';
import { getNearbyBusinesses } from './queries/getNearbyBusinesses.js';
import { updateBusiness } from './mutations/updateBusiness.js';
import { deactivateBusiness } from './mutations/deactivateBusiness.js';
import { removeMember } from './mutations/removeMember.js';
import { setBusinessLocation } from './mutations/setBusinessLocation.js';
import type { BusinessParent } from '../../../types/business.js';

export const businessResolvers = {
    Query: {
        getMyBusinesses,
        getBusinessMembers,
        getInactiveBusinessMembers,
        getNearbyBusinesses,
    },
    Mutation: {
        updateBusiness,
        deactivateBusiness,
        removeMember,
        setBusinessLocation,
    },
    // Decimal-backed fields need explicit Number() conversion, same reasoning
    // as Job.price in job/jobResolvers.ts — applies to every Business-returning
    // operation (getMyBusinesses, updateBusiness, getNearbyBusinesses, ...),
    // which is why this lives on the shared type rather than being repeated
    // per-resolver the way getNearbyBusinesses handles its own distanceMiles/fromPrice.
    Business: {
        avgRating: (parent: BusinessParent) => (parent.avgRating == null ? null : Number(parent.avgRating)),
        serviceFeeAmount: (parent: BusinessParent) => (parent.serviceFeeAmount == null ? null : Number(parent.serviceFeeAmount)),
    },
};
