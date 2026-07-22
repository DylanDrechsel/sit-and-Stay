import { gql, type TypedDocumentNode } from '@apollo/client';
import type { AvailableEmployee, BusinessJob, JobDetail } from '../types/job';

interface GetBusinessJobsData {
    getBusinessJobs: BusinessJob[];
}

interface GetBusinessJobsVariables {
    businessId: string;
    /** e.g. ["PENDING"] for the requests inbox / needs-attention preview. */
    statuses?: string[];
    /** ISO 8601. Bounds `scheduledStartTime` (gte). Optional server-side. */
    from?: string;
    /** ISO 8601. Bounds `scheduledStartTime` (lte). */
    to?: string;
}

/**
 * A business's jobs for the owner/manager views. OWNER/MANAGER only — the server
 * returns FORBIDDEN to anyone else, so only call it for a membership whose role
 * is OWNER or MANAGER.
 *
 * `from`/`to` bound `scheduledStartTime`; the server coerces the strings with
 * `z.coerce.date`. For a "today" list the CLIENT computes the day boundaries from
 * its own local midnight — the backend has no per-business timezone, so a
 * server-side "current date" would be UTC and wrong at the day's edges. See the
 * getSession discussion in AI_MANIFEST.md §10 for why this stayed out of the
 * session bootstrap.
 *
 * **`statuses` without `from`/`to` is deliberately unbounded by date** — this is
 * what `NeedsAttentionSection` uses for pending requests, because a request made
 * today can be for a session next week ("starts Tue Jul 15"). Reusing the
 * Today screen's date-bounded query would silently miss it.
 */
export const GET_BUSINESS_JOBS: TypedDocumentNode<GetBusinessJobsData, GetBusinessJobsVariables> = gql`
    query GetBusinessJobs($businessId: ID!, $statuses: [String!], $from: String, $to: String) {
        getBusinessJobs(businessId: $businessId, statuses: $statuses, from: $from, to: $to) {
            id
            jobNumber
            status
            scheduledStartTime
            scheduledEndTime
            createdAt
            actualStartTime
            price
            sessionNumber
            totalSessions
            customer {
                user {
                    firstName
                    lastName
                }
            }
            service {
                title
            }
            pets {
                name
            }
            assignee {
                user {
                    firstName
                    lastName
                }
            }
        }
    }
`;

interface JobStatusResult {
    id: string;
    status: string;
}

interface AcceptJobData {
    acceptJob: JobStatusResult;
}
interface AcceptJobVariables {
    jobId: string;
}

/**
 * PENDING -> ACCEPTED. OWNER/MANAGER only. Can fail with CONFLICT if another
 * request already resolved this job first (backend/src/graphQL/resolvers/job/
 * jobTransition.ts) — that's a real, expected outcome, not a bug, so the caller
 * should surface the error rather than assume success.
 */
export const ACCEPT_JOB: TypedDocumentNode<AcceptJobData, AcceptJobVariables> = gql`
    mutation AcceptJob($jobId: ID!) {
        acceptJob(jobId: $jobId) {
            id
            status
        }
    }
`;

interface DeclineJobData {
    declineJob: JobStatusResult;
}
interface DeclineJobVariables {
    jobId: string;
}

/** PENDING -> DECLINED. OWNER/MANAGER only. Same CONFLICT possibility as above. */
export const DECLINE_JOB: TypedDocumentNode<DeclineJobData, DeclineJobVariables> = gql`
    mutation DeclineJob($jobId: ID!) {
        declineJob(jobId: $jobId) {
            id
            status
        }
    }
`;

interface GetJobData {
    getJob: JobDetail;
}
interface GetJobVariables {
    jobId: string;
}

/**
 * One job in full, for the assign screen. Readable by the job's customer, its
 * assigned sitter, or an active OWNER/MANAGER of its business.
 *
 * Pets come with their care fields because that's what an owner needs in front
 * of them while picking who to send. `accessCode` is deliberately NOT selected —
 * it's the per-job home-entry secret, gated server-side to the assigned sitter
 * and OWNER/MANAGERs, and nothing on this screen needs it.
 */
export const GET_JOB: TypedDocumentNode<GetJobData, GetJobVariables> = gql`
    query GetJob($jobId: ID!) {
        getJob(jobId: $jobId) {
            id
            jobNumber
            status
            scheduledStartTime
            scheduledEndTime
            price
            sessionNumber
            totalSessions
            specialInstructions
            customer {
                user {
                    firstName
                    lastName
                    phone
                }
            }
            service {
                title
                durationMinutes
            }
            pets {
                id
                name
                type
                breed
                medicalNotes
                careInstructions
            }
            assignee {
                user {
                    firstName
                    lastName
                }
            }
        }
    }
`;

interface GetAvailableEmployeesData {
    getAvailableEmployees: AvailableEmployee[];
}
interface GetAvailableEmployeesVariables {
    jobId: string;
}

/**
 * Every active member of the job's business, each annotated with whether
 * they're free at the job's scheduled time. OWNER/MANAGER only.
 *
 * The availability check is **advisory, not enforced** — `assignSitter` will
 * happily assign someone this query flags unavailable. That's deliberate
 * server-side (an owner may know something the schedule doesn't), so the UI
 * shows the conflict rather than hiding the person.
 *
 * Known server-side limitation: the weekly-availability half of the check only
 * looks at `scheduledStartTime`'s single day, so a multi-day job isn't checked
 * against every day it spans. The overlap check has no such limit.
 */
export const GET_AVAILABLE_EMPLOYEES: TypedDocumentNode<
    GetAvailableEmployeesData,
    GetAvailableEmployeesVariables
> = gql`
    query GetAvailableEmployees($jobId: ID!) {
        getAvailableEmployees(jobId: $jobId) {
            member {
                id
                role
                user {
                    firstName
                    lastName
                }
            }
            isAvailable
            conflictReason
        }
    }
`;

interface AssignSitterData {
    assignSitter: {
        id: string;
        status: string;
        assigneeId: string | null;
    };
}
interface AssignSitterVariables {
    input: {
        jobId: string;
        /** A `BusinessMember.id`, NOT a `User.id`. */
        assigneeId: string;
    };
}

/**
 * ACCEPTED -> ASSIGNED. OWNER/MANAGER only.
 *
 * `assigneeId` is a `BusinessMember.id` — the same convention as
 * `removeMember`/`setAvailability`, and a `User.id` here fails validation.
 *
 * Guarded server-side on the job still being ACCEPTED, so this can return
 * CONFLICT if someone else assigned or cancelled it first (see
 * backend/src/graphQL/resolvers/job/jobTransition.ts). Surface that rather than
 * assuming success.
 */
export const ASSIGN_SITTER: TypedDocumentNode<AssignSitterData, AssignSitterVariables> = gql`
    mutation AssignSitter($input: AssignSitterInput!) {
        assignSitter(input: $input) {
            id
            status
            assigneeId
        }
    }
`;
