import { gql, type TypedDocumentNode } from '@apollo/client';
import type { BusinessJob } from '../types/job';

interface GetBusinessJobsData {
    getBusinessJobs: BusinessJob[];
}

interface GetBusinessJobsVariables {
    businessId: string;
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
 */
export const GET_BUSINESS_JOBS: TypedDocumentNode<GetBusinessJobsData, GetBusinessJobsVariables> = gql`
    query GetBusinessJobs($businessId: ID!, $from: String, $to: String) {
        getBusinessJobs(businessId: $businessId, from: $from, to: $to) {
            id
            jobNumber
            status
            scheduledStartTime
            scheduledEndTime
            customer {
                user {
                    firstName
                    lastName
                }
            }
            service {
                title
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
