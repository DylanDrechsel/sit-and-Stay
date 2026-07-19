import { getMyBusinesses } from './queries/getMyBusinesses.js';
import { getBusinessMembers } from './queries/getBusinessMembers.js';
import { getInactiveBusinessMembers } from './queries/getInactiveBusinessMembers.js';
import { getNearbyBusinesses } from './queries/getNearbyBusinesses.js';
import { updateBusiness } from './mutations/updateBusiness.js';
import { deactivateBusiness } from './mutations/deactivateBusiness.js';
import { removeMember } from './mutations/removeMember.js';
import { setBusinessLocation } from './mutations/setBusinessLocation.js';
import { setAvailability } from './mutations/setAvailability.js';
import type { GraphQLContext } from '../../../types/context.js';
import type { BusinessParent, BusinessMemberParent } from '../../../types/business.js';

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
        setAvailability,
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
    BusinessMember: {
        // Lazy-fetched, same pattern as Job.pets — nothing that returns a
        // BusinessMember `include`s availability, so resolving it here means the
        // schedule screen can ask for it without every member-returning query
        // paying for the join. Works anywhere a BusinessMember appears, including
        // nested under EmployeeAvailabilityStatus.member on the assign-sitter screen.
        //
        // Ordered Monday→Sunday: Postgres sorts enum columns by declaration
        // order, and DayOfWeek is declared MONDAY-first in schema.prisma.
        availability: (parent: BusinessMemberParent, _args: unknown, context: GraphQLContext) =>
            context.prisma.employeeAvailability.findMany({
                where: { employeeId: parent.id },
                orderBy: { dayOfWeek: 'asc' },
            }),
    },
};
