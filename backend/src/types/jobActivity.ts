/**
 * JobUpdate / ReportCard input types — the live "Updates" feed and the
 * end-of-job report card the assigned sitter fills out.
 */

/**
 * Input for posting a live update (photo and/or note) to an in-progress job.
 * At least one of note/photoUrl must be provided.
 */
export interface PostJobUpdateInput {
    jobId: string;
    note?: string;
    photoUrl?: string;
}

/**
 * Input for submitting a job's report card. jobId is required; every other
 * field is optional and falls back to the model's default when omitted.
 */
export interface SubmitReportCardInput {
    jobId: string;
    mood?: string;
    peeCount?: number;
    poopCount?: number;
    ateFood?: boolean;
    drankWater?: boolean;
    gaveTreat?: boolean;
    summary?: string;
}
