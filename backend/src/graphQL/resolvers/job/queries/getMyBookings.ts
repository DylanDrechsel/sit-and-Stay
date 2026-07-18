import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../../types/context.js';

/**
 * getMyBookings
 *
 * Returns the authenticated customer's bookings, newest first — the customer's
 * "Bookings" tab. Each booking's jobs/addOns resolve lazily via the Booking
 * type-level field resolvers, so per-session status ("walk 2 of 4 · ASSIGNED")
 * comes from querying booking.jobs.
 */
export const getMyBookings = async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer == null) {
        throw new GraphQLError('Only customers have bookings.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    return context.prisma.booking.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
    });
};
