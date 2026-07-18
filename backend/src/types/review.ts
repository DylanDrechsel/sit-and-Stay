/**
 * Review input types.
 */

/**
 * Input for leaving a review on a completed job.
 * businessId and customerId are not accepted here — both are derived from
 * the job itself (job.businessId, and the caller's own CustomerProfile).
 */
export interface LeaveReviewInput {
    jobId: string;
    rating: number;
    comment?: string;
    tags?: string[];
}
