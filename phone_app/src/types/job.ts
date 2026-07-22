/**
 * Types mirroring the backend `Job` GraphQL type (backend/src/graphQL/typeDefs.ts).
 *
 * Hand-written and able to drift — the schema is the authority. These cover only
 * the slice `GET_BUSINESS_JOBS` selects, not every Job field; widen them field by
 * field as the query grows rather than mirroring the whole type speculatively.
 */

/** Just the name fields the job list needs off a nested User — not the full User. */
interface JobPersonName {
    user: {
        firstName: string;
        lastName: string;
    };
}

/** The pet fields the assign screen shows — care info a sitter needs up front. */
export interface JobPet {
    id: string;
    name: string;
    /** DOG | CAT | BIRD | RABBIT | REPTILE | OTHER — a raw string, like Job.status. */
    type: string;
    breed: string | null;
    medicalNotes: string | null;
    careInstructions: string | null;
}

/**
 * One job as the assign screen needs it — wider than `BusinessJob` because
 * choosing a sitter needs the care detail a list row doesn't.
 *
 * Still not the *booking*: `Job` has no `booking` relation in the schema (only
 * `bookingId: ID`), so a package's combined total, add-ons, and service fee
 * aren't reachable. `price` here is the per-session rate. See `BusinessJob.price`.
 */
export interface JobDetail {
    id: string;
    jobNumber: number;
    status: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    price: number;
    sessionNumber: number | null;
    totalSessions: number | null;
    specialInstructions: string | null;
    customer: { user: { firstName: string; lastName: string; phone: string | null } };
    service: { title: string; durationMinutes: number };
    pets: JobPet[];
    assignee: JobPersonName | null;
}

/**
 * One row from `getAvailableEmployees` — every active member of the business,
 * annotated with whether they can take this job.
 *
 * `conflictReason` is the server's own wording and distinguishes the three
 * cases the backend cares about: no availability configured for that day, an
 * explicit day off, or an overlapping job. Rendered verbatim rather than
 * re-derived client-side, so the reason shown always matches the reason the
 * server actually decided on.
 */
export interface AvailableEmployee {
    member: {
        id: string;
        role: string;
        user: { firstName: string; lastName: string };
    };
    isAvailable: boolean;
    conflictReason: string | null;
}

/**
 * One row from `getBusinessJobs`. `status` is a raw string, not a union, because
 * the backend deliberately exposes JobStatus as `String!` rather than a GraphQL
 * enum (see the Job type in typeDefs.ts). All seven values are possible:
 * PENDING | ACCEPTED | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | DECLINED.
 */
export interface BusinessJob {
    id: string;
    jobNumber: number;
    status: string;
    /** ISO 8601 — the backend's DateTime scalar serializes to a string. */
    scheduledStartTime: string;
    /** ISO 8601. */
    scheduledEndTime: string;
    /** ISO 8601 — when the request came in; drives "18 min ago" on a request card. */
    createdAt: string;
    /**
     * ISO 8601 — clock-in time, set by `clockIn`. Null until a sitter actually
     * starts the job (PENDING/ACCEPTED/ASSIGNED jobs never have one). In
     * practice never null on a job this app has already filtered to
     * IN_PROGRESS, but the schema doesn't encode that, so callers still check.
     */
    actualStartTime: string | null;
    /**
     * USD, per-session. NOT a booking's full total — `Job` has no `booking`
     * relation in the schema (only `bookingId: ID`), so a multi-session pack's
     * combined price (add-ons + service fee) isn't reachable from this query.
     * A request card showing "$120" for a 4-walk pack in the design prototype
     * is showing `Booking.totalPrice`, which this type cannot represent yet.
     */
    price: number;
    /** Both null for a single ad-hoc booking; both set for a multi-session package. */
    sessionNumber: number | null;
    totalSessions: number | null;
    customer: JobPersonName;
    service: { title: string };
    pets: { name: string }[];
    /** null until a sitter is assigned (status ACCEPTED and earlier). */
    assignee: JobPersonName | null;
}
