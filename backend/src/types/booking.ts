/**
 * Booking / Job lifecycle input types.
 */

export interface BookingSessionInput {
    scheduledStartTime: string;
    scheduledEndTime: string;
}

/**
 * Input for creating a Booking (+ its Job session(s)).
 *
 * Provide servicePackageId to book a multi-session package — sessions.length
 * must match the package's sessionsCount. Omit it to book a single ad-hoc
 * session, priced from the service offering's basePrice.
 */
export interface CreateBookingInput {
    businessId: string;
    serviceOfferingId: string;
    servicePackageId?: string;
    addOnIds?: string[];
    petIds: string[];
    sessions: BookingSessionInput[];
    specialInstructions?: string;
    accessCode?: string;
}

/**
 * Input for assigning an active BusinessMember (sitter) to an accepted job.
 * assigneeId is the BusinessMember.id (the membership record), not the User.id.
 */
export interface AssignSitterInput {
    jobId: string;
    assigneeId: string;
}

// ── Type-level field resolver parent shapes ─────────────────────────────────
// Minimal shapes for the parent object passed into Job/Booking/BookingAddOn
// field resolvers in job/jobResolvers.ts. Decimal-backed fields are typed
// `unknown` since the resolver's job is exactly to convert them (Prisma.Decimal
// in, number out) — typing them as Decimal would require importing the Prisma
// namespace here for no benefit.

export interface JobParent {
    id: string;
    businessId: string;
    customerId: string;
    serviceOfferingId: string;
    assigneeId: string | null;
    price: unknown;
    tipAmount: unknown;
    accessCode: string | null;
}

export interface BookingParent {
    id: string;
    totalPrice: unknown;
}

export interface BookingAddOnParent {
    priceAtBooking: unknown;
}

// ── Job listing query inputs ────────────────────────────────────────────────

/**
 * Filters shared by the job listing queries: optional status filter plus an
 * optional scheduledStartTime window. Dates arrive as strings from GraphQL.
 */
export interface JobListFilters {
    statuses?: string[];
    from?: string;
    to?: string;
}

/** Input for the owner/manager job list (getBusinessJobs). */
export interface GetBusinessJobsInput extends JobListFilters {
    businessId: string;
}

/**
 * Input for paging a job's update feed (getJobUpdates).
 * `before` is a createdAt cursor for fetching the next (older) page.
 */
export interface GetJobUpdatesInput {
    jobId: string;
    limit?: number;
    before?: string;
}

/**
 * Input for cancelling a job. The reason is optional and stored on the job
 * for display; who may cancel, and from which statuses, is enforced in the
 * resolver — see cancelJob.
 */
export interface CancelJobInput {
    jobId: string;
    reason?: string;
}
