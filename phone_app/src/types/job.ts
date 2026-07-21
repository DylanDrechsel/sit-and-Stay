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
    customer: JobPersonName;
    service: { title: string };
    /** null until a sitter is assigned (status ACCEPTED and earlier). */
    assignee: JobPersonName | null;
}
