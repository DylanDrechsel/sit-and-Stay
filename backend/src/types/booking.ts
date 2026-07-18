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
