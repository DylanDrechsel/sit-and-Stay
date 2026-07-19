import { GraphQLError } from 'graphql';
import { setAvailabilitySchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { SetAvailabilityInput } from '../../../../types/availability.js';

/**
 * Window stored when a brand-new row is created for a day that's being marked
 * off. The times are meaningless while isAvailable is false —
 * getAvailableEmployees short-circuits on the flag before ever reading them —
 * but the columns are non-null, so they need *something*.
 */
const NO_HOURS = '00:00';

/**
 * setAvailability
 *
 * Writes one or more days of a member's recurring weekly schedule — the data
 * getAvailableEmployees reads when deciding who can take a job. Without this,
 * EmployeeAvailability rows can only be created by hand in Prisma Studio.
 *
 * Partial by day: days omitted from `slots` are left untouched, so a client can
 * send just the day that changed or the whole week. Each day is upserted
 * against the (employeeId, dayOfWeek) unique key.
 *
 * Permissions: a member owns their own schedule, and an active OWNER/MANAGER
 * can set anyone's in their business — staff schedules often get filled in by
 * whoever runs the business rather than by the sitter.
 *
 * Returns the member's full week, not just the days that changed.
 */
export const setAvailability = async (
    _: unknown,
    { input }: { input: SetAvailabilityInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = setAvailabilitySchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { memberId, slots } = parsed.data;

    const member = await context.prisma.businessMember.findUnique({ where: { id: memberId } });
    if (member == null || !member.isActive) {
        throw new GraphQLError('Member not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    // Self-service is the common path; the membership lookup only runs when
    // someone is editing a schedule that isn't theirs.
    if (member.userId !== context.user.userId) {
        const caller = await context.prisma.businessMember.findUnique({
            where: {
                userId_businessId: { userId: context.user.userId, businessId: member.businessId },
            },
        });

        if (caller == null || !caller.isActive || !['OWNER', 'MANAGER'].includes(caller.role)) {
            throw new GraphQLError("You do not have permission to set this member's availability.", {
                extensions: { code: 'FORBIDDEN' },
            });
        }
    }

    // One transaction so a partial week can't land — a rejected day shouldn't
    // leave the member with half their schedule updated.
    await context.prisma.$transaction(slots.map((slot) => {
        const isAvailable = slot.isAvailable ?? true;

        // Only overwrite the stored window when new times were actually sent.
        // Toggling a day off (isAvailable: false) without times therefore
        // preserves the hours already on the row instead of wiping them to
        // midnight-to-midnight. Re-activating a day is not symmetric: this
        // branch never sees isAvailable: true with times omitted, because
        // availabilitySlotSchema's refine (validate.ts) requires startTime
        // and endTime whenever isAvailable isn't false — a client turning a
        // day back on must resend its hours.
        const update: { isAvailable: boolean; startTime?: string; endTime?: string } = { isAvailable };
        if (slot.startTime !== undefined) update.startTime = slot.startTime;
        if (slot.endTime !== undefined) update.endTime = slot.endTime;

        return context.prisma.employeeAvailability.upsert({
            where: { employeeId_dayOfWeek: { employeeId: memberId, dayOfWeek: slot.dayOfWeek } },
            create: {
                employeeId: memberId,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime ?? NO_HOURS,
                endTime: slot.endTime ?? NO_HOURS,
                isAvailable,
            },
            update,
        });
    }));

    // Postgres orders enum columns by declaration order, and DayOfWeek is
    // declared MONDAY-first in schema.prisma, so this comes back Monday→Sunday
    // rather than alphabetically.
    return context.prisma.employeeAvailability.findMany({
        where: { employeeId: memberId },
        orderBy: { dayOfWeek: 'asc' },
    });
};
