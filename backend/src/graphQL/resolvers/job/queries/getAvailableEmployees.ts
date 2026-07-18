import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

// JS Date#getUTCDay(): 0 = Sunday ... 6 = Saturday. Job.scheduledStartTime is read in
// UTC for this comparison — this codebase has no per-business timezone modeling yet,
// so "day of week" and "time of day" are both taken at face value from the stored UTC
// instant. Revisit if/when businesses get a timezone field.
const DAY_OF_WEEK_BY_UTC_INDEX = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
] as const;

const toHHMM = (date: Date): string => {
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

/**
 * getAvailableEmployees
 *
 * For a given job, returns every active BusinessMember of that job's business,
 * each annotated with whether they're free to be assigned at the job's
 * scheduled time — the "Assign a sitter" screen's available/unavailable split.
 * OWNER/MANAGER of the job's business only.
 *
 * A member is available only if BOTH hold:
 *   1. They have an EmployeeAvailability row for the job's day of week with
 *      isAvailable: true, and that day's [startTime, endTime] window fully
 *      contains the job's scheduled time. No row for that day = not available
 *      (availability must be explicitly configured, not assumed).
 *   2. They have no OTHER job assigned to them (status ASSIGNED or
 *      IN_PROGRESS) whose scheduled window overlaps this job's.
 *
 * Known limitation: the weekly-availability check only considers the job's
 * scheduledStartTime's day/time-of-day. A job spanning multiple days (e.g. a
 * multi-night boarding stay) is not checked against every day it spans — only
 * the conflict check (point 2) is duration-aware.
 */
export const getAvailableEmployees = async (
    _: unknown,
    { jobId }: { jobId: string },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    if (!jobId?.trim()) {
        throw new GraphQLError('Job ID is required.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId: job.businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to view sitter availability for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const members = await context.prisma.businessMember.findMany({
        where: { businessId: job.businessId, isActive: true },
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
    });

    // getUTCDay() is spec-guaranteed to return 0-6, always in bounds for this 7-element
    // tuple — the assertion is safe (noUncheckedIndexedAccess can't prove that itself).
    const dayOfWeek = DAY_OF_WEEK_BY_UTC_INDEX[job.scheduledStartTime.getUTCDay()]!;
    const jobStartHHMM = toHHMM(job.scheduledStartTime);
    const jobEndHHMM = toHHMM(job.scheduledEndTime);

    const statuses = await Promise.all(members.map(async (member) => {
        const availability = await context.prisma.employeeAvailability.findUnique({
            where: { employeeId_dayOfWeek: { employeeId: member.id, dayOfWeek } },
        });

        if (availability == null) {
            return { member, isAvailable: false, conflictReason: 'No availability set for this day' };
        }
        if (!availability.isAvailable) {
            return { member, isAvailable: false, conflictReason: 'Off this day' };
        }
        if (jobStartHHMM < availability.startTime || jobEndHHMM > availability.endTime) {
            return {
                member,
                isAvailable: false,
                conflictReason: `Only available ${availability.startTime}–${availability.endTime}`,
            };
        }

        const conflictingJob = await context.prisma.job.findFirst({
            where: {
                assigneeId: member.id,
                id: { not: job.id },
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
                scheduledStartTime: { lt: job.scheduledEndTime },
                scheduledEndTime: { gt: job.scheduledStartTime },
            },
        });
        if (conflictingJob != null) {
            return {
                member,
                isAvailable: false,
                conflictReason: `Conflict: Job #${conflictingJob.jobNumber}`,
            };
        }

        return { member, isAvailable: true, conflictReason: null };
    }));

    return statuses;
};
