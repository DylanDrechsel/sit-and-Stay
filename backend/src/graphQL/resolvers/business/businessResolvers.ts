import { getMyBusinesses } from './queries/getMyBusinesses.js';
import { getBusinessMembers } from './queries/getBusinessMembers.js';
import { getInactiveBusinessMembers } from './queries/getInactiveBusinessMembers.js';
import { getNearbyBusinesses } from './queries/getNearbyBusinesses.js';
import { updateBusiness } from './mutations/updateBusiness.js';
import { deactivateBusiness } from './mutations/deactivateBusiness.js';
import { removeMember } from './mutations/removeMember.js';
import { setBusinessLocation } from './mutations/setBusinessLocation.js';
import { setAvailability } from './mutations/setAvailability.js';
import { setMemberPayRate } from './mutations/setMemberPayRate.js';
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
        setMemberPayRate,
    },
    // Decimal-backed fields need explicit Number() conversion, same reasoning
    // as Job.price in job/jobResolvers.ts — applies to every Business-returning
    // operation (getMyBusinesses, updateBusiness, getNearbyBusinesses, ...),
    // which is why this lives on the shared type rather than being repeated
    // per-resolver the way getNearbyBusinesses handles its own distanceMiles/fromPrice.
    Business: {
        avgRating: (parent: BusinessParent) => (parent.avgRating == null ? null : Number(parent.avgRating)),
        serviceFeeAmount: (parent: BusinessParent) => (parent.serviceFeeAmount == null ? null : Number(parent.serviceFeeAmount)),
        // SENSITIVE — what a business pays its sitters is internal, and Business
        // is reachable from public paths (getNearbyBusinesses is unauthenticated
        // storefront data). Gated rather than plain, for the same reason as
        // Job.accessCode: the rule has to hold wherever a Business surfaces, not
        // just where someone remembered to check.
        //
        // Note getNearbyBusinesses builds its rows from a hand-written SELECT
        // that doesn't fetch this column, so it resolves null there even for an
        // owner. That's the safe direction to be wrong in; if it ever needs a
        // real value on that path, add the column to the SELECT — the gate here
        // is what keeps that from becoming a leak.
        defaultSitterPayPercent: async (
            parent: BusinessParent,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            if (parent.defaultSitterPayPercent == null || context.user == null) return null;

            const viewer = await context.prisma.businessMember.findUnique({
                where: {
                    userId_businessId: { userId: context.user.userId, businessId: parent.id },
                },
            });

            if (viewer != null && viewer.isActive && ['OWNER', 'MANAGER'].includes(viewer.role)) {
                return Number(parent.defaultSitterPayPercent);
            }

            return null;
        },
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

        // SENSITIVE — gated the same way as Job.accessCode: resolved here rather
        // than as a plain schema field so the rule holds no matter which query
        // surfaced this member, including nested selections like
        // getAvailableEmployees -> member, where a sitter could otherwise read a
        // colleague's pay. Runs its own membership lookup and does not trust
        // whatever authorization the parent operation already did.
        payRatePercent: async (
            parent: BusinessMemberParent,
            _args: unknown,
            context: GraphQLContext,
        ) => {
            if (parent.payRatePercent == null || context.user == null) return null;

            // A member can always see their own rate.
            if (parent.userId === context.user.userId) return Number(parent.payRatePercent);

            // Otherwise it takes an active OWNER/MANAGER of that member's business.
            // MANAGERs can read pay even though only an OWNER can set it — they
            // schedule against labour cost.
            const viewer = await context.prisma.businessMember.findUnique({
                where: {
                    userId_businessId: {
                        userId: context.user.userId,
                        businessId: parent.businessId,
                    },
                },
            });

            if (viewer != null && viewer.isActive && ['OWNER', 'MANAGER'].includes(viewer.role)) {
                return Number(parent.payRatePercent);
            }

            return null;
        },
    },
};
