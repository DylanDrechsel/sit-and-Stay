import { createBooking } from './mutations/createBooking.js';
import { acceptJob } from './mutations/acceptJob.js';
import { declineJob } from './mutations/declineJob.js';
import { assignSitter } from './mutations/assignSitter.js';
import { clockIn } from './mutations/clockIn.js';
import { clockOut } from './mutations/clockOut.js';
import { completeJob } from './mutations/completeJob.js';
import { cancelJob } from './mutations/cancelJob.js';
import { addTip } from './mutations/addTip.js';
import { postJobUpdate } from './mutations/postJobUpdate.js';
import { submitReportCard } from './mutations/submitReportCard.js';
import { getAvailableEmployees } from './queries/getAvailableEmployees.js';
import { getMyBookings } from './queries/getMyBookings.js';
import { getBusinessJobs } from './queries/getBusinessJobs.js';
import { getMyJobs } from './queries/getMyJobs.js';
import { getJob } from './queries/getJob.js';
import { getJobUpdates } from './queries/getJobUpdates.js';
import type { GraphQLContext } from '../../../types/context.js';
import type { JobParent, BookingParent, BookingAddOnParent } from '../../../types/booking.js';

export const jobResolvers = {
    Query: {
        getAvailableEmployees,
        getMyBookings,
        getBusinessJobs,
        getMyJobs,
        getJob,
        getJobUpdates,
    },
    Mutation: {
        createBooking,
        acceptJob,
        declineJob,
        assignSitter,
        clockIn,
        clockOut,
        completeJob,
        cancelJob,
        addTip,
        postJobUpdate,
        submitReportCard,
    },
    // ── Type-level field resolvers ──────────────────────────────────────────
    // Everything below is keyed by GraphQL *type name*, not Query/Mutation. Each
    // function controls how ONE field of that type gets resolved, no matter which
    // query/mutation produced the object — e.g. Job.accessCode below runs the same
    // check whether the Job came from acceptJob, clockIn, or nested inside
    // booking.jobs. Any field NOT listed here just falls back to GraphQL's default:
    // read parent[fieldName] directly off whatever Prisma object was returned. That
    // default is why most Job/Booking fields (id, status, businessId, ...) need no
    // entry at all. These three type maps get spread onto the root resolver map in
    // resolvers/index.ts as siblings of Query/Mutation (`Job: jobResolvers.Job`, etc).
    Job: {
        // Prisma stores money as Decimal objects (decimal.js), not plain numbers.
        // The default resolver would hand that Decimal straight to the Float
        // scalar, which doesn't know how to serialize it — so convert explicitly.
        price: (parent: JobParent) => Number(parent.price),
        tipAmount: (parent: JobParent) => (parent.tipAmount == null ? null : Number(parent.tipAmount)),

        // No mutation `include`s pets, so parent.pets is undefined by default —
        // which would violate the non-null `[Pet!]!` in the schema. Fetch it
        // lazily instead, only when a client actually asks for this field.
        pets: (parent: JobParent, _: unknown, context: GraphQLContext) =>
            context.prisma.pet.findMany({ where: { jobs: { some: { id: parent.id } } } }),

        // Same lazy-fetch pattern for the display relations the list screens
        // need (customer name, service title, sitter card). Nested User comes
        // via the CustomerProfile.user / BusinessMember-include patterns of
        // their own domains.
        customer: (parent: JobParent, _: unknown, context: GraphQLContext) =>
            context.prisma.customerProfile.findUniqueOrThrow({ where: { id: parent.customerId } }),
        service: (parent: JobParent, _: unknown, context: GraphQLContext) =>
            context.prisma.serviceOffering.findUniqueOrThrow({ where: { id: parent.serviceOfferingId } }),
        assignee: (parent: JobParent, _: unknown, context: GraphQLContext) =>
            parent.assigneeId == null
                ? null
                : context.prisma.businessMember.findUnique({
                    where: { id: parent.assigneeId },
                    include: { user: true },
                }),

        // Deliberately NOT a passthrough field, even though parent.accessCode
        // already holds the real value. Re-checks on every read whether the
        // caller is the assigned sitter or an active OWNER/MANAGER of this job's
        // business; everyone else gets null regardless of what's on the row.
        accessCode: async (parent: JobParent, _: unknown, context: GraphQLContext) => {
            if (context.user == null) return null;

            const membership = await context.prisma.businessMember.findUnique({
                where: { userId_businessId: { userId: context.user.userId, businessId: parent.businessId } },
            });
            if (membership == null || !membership.isActive) return null;

            const isAuthorizedStaff = ['OWNER', 'MANAGER'].includes(membership.role);
            const isAssignedSitter = membership.id === parent.assigneeId;

            return isAuthorizedStaff || isAssignedSitter ? parent.accessCode : null;
        },
    },
    Booking: {
        // Same Decimal -> Number conversion as Job.price above.
        totalPrice: (parent: BookingParent) => Number(parent.totalPrice),

        // Same lazy-fetch reasoning as Job.pets above — createBooking doesn't
        // `include` these, so they're fetched on demand keyed by parent.id.
        jobs: (parent: BookingParent, _: unknown, context: GraphQLContext) =>
            context.prisma.job.findMany({
                where: { bookingId: parent.id },
                orderBy: { sessionNumber: 'asc' },
            }),
        addOns: (parent: BookingParent, _: unknown, context: GraphQLContext) =>
            context.prisma.bookingAddOn.findMany({
                where: { bookingId: parent.id },
                include: { addOn: true },
            }),
    },
    BookingAddOn: {
        // Same Decimal -> Number conversion as Job.price above.
        priceAtBooking: (parent: BookingAddOnParent) => Number(parent.priceAtBooking),
    },
};
