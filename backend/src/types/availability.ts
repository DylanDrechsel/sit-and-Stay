/**
 * EmployeeAvailability input types — the recurring weekly schedule that
 * getAvailableEmployees reads when deciding who can be assigned to a job.
 */

/**
 * One day's entry in a member's weekly schedule.
 *
 * startTime/endTime are "HH:MM" 24-hour strings, required unless isAvailable
 * is explicitly false — a day off carries no meaningful window. isAvailable
 * defaults to true when omitted.
 */
export interface AvailabilitySlotInput {
    dayOfWeek: string;
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
}

/**
 * Input for writing one or more days of a member's weekly availability.
 *
 * memberId is the `BusinessMember.id` (the membership record), not the
 * `User.id` — availability is per-membership, so someone who sits for two
 * businesses keeps a separate schedule for each.
 *
 * Days not listed are left untouched: this is a partial update, not a
 * full-week replace.
 */
export interface SetAvailabilityInput {
    memberId: string;
    slots: AvailabilitySlotInput[];
}
