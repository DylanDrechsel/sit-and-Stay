import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { createBookingSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { CreateBookingInput } from '../../../../types/booking.js';

/**
 * How long a business gets to accept or decline a new request before the
 * deadline shown to the customer ("RESPOND BY 7 PM") elapses.
 *
 * Nothing enforces this: there is no scheduler in the app, so a request whose
 * deadline passes just sits in PENDING rather than auto-expiring. It's an SLA
 * for display and sorting, not a state transition. If auto-expiry is wanted
 * later it needs a background job — don't make acceptJob reject past-deadline
 * requests instead, or expired ones become permanently stuck with no way out.
 */
const RESPONSE_WINDOW_HOURS = 24;

/**
 * createBooking
 *
 * Creates a Booking + its Job session(s) for the authenticated customer.
 *
 * Provide servicePackageId to book a multi-session package — sessions.length
 * must match the package's sessionsCount, and every session gets the
 * package's pricePerSession. Omit it to book a single ad-hoc session priced
 * from the service offering's basePrice (which must be set).
 *
 * totalPrice = pricePerSession * session count, plus each selected add-on
 * (its own total, per-session or flat per its `perSession` flag), plus the
 * business's flat service fee. Each individual Job.price is just the
 * per-session rate — add-ons and the service fee are booking-level, not
 * attributed to a single session.
 */
export const createBooking = async (
    _: unknown,
    { input }: { input: CreateBookingInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = createBookingSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const {
        businessId, serviceOfferingId, servicePackageId, addOnIds,
        petIds, sessions, specialInstructions, accessCode,
    } = parsed.data;

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer == null) {
        throw new GraphQLError('Only customers can book services.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const business = await context.prisma.business.findUnique({ where: { id: businessId } });
    if (business == null || !business.isActive) {
        throw new GraphQLError('Business not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const serviceOffering = await context.prisma.serviceOffering.findUnique({
        where: { id: serviceOfferingId },
    });
    if (serviceOffering == null || serviceOffering.businessId !== businessId || !serviceOffering.isActive) {
        throw new GraphQLError('Service offering not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    // Resolve the per-session rate and required session count from the package
    // (or the offering's flat price for a single ad-hoc session).
    let pricePerSession: Prisma.Decimal;
    let sessionsCount: number;

    if (servicePackageId != null) {
        const servicePackage = await context.prisma.servicePackage.findUnique({
            where: { id: servicePackageId },
        });
        if (servicePackage == null || servicePackage.serviceOfferingId !== serviceOfferingId || !servicePackage.isActive) {
            throw new GraphQLError('Service package not found.', { extensions: { code: 'NOT_FOUND' } });
        }
        pricePerSession = servicePackage.pricePerSession;
        sessionsCount = servicePackage.sessionsCount;
    } else {
        if (serviceOffering.basePrice == null) {
            throw new GraphQLError('This service has no flat price — choose a package.', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }
        pricePerSession = serviceOffering.basePrice;
        sessionsCount = 1;
    }

    if (sessions.length !== sessionsCount) {
        throw new GraphQLError(
            `This ${servicePackageId != null ? 'package' : 'service'} requires exactly ${sessionsCount} session(s), but ${sessions.length} were provided.`,
            { extensions: { code: 'BAD_USER_INPUT' } },
        );
    }

    // Validate add-ons belong to this offering and are active
    const addOns = addOnIds.length > 0
        ? await context.prisma.serviceOfferingAddOn.findMany({
            where: { id: { in: addOnIds }, serviceOfferingId, isActive: true },
        })
        : [];
    if (addOns.length !== addOnIds.length) {
        throw new GraphQLError('One or more add-ons are invalid for this service.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Validate pets belong to this customer and are active
    const pets = await context.prisma.pet.findMany({
        where: { id: { in: petIds }, customerId: customer.id, isActive: true },
    });
    if (pets.length !== petIds.length) {
        throw new GraphQLError('One or more pets are invalid.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // One deadline for the whole booking, shared by every session. The business
    // accepts or declines the request as a unit, and it's derived from the
    // EARLIEST session start so a package's later dates can't buy extra time to
    // answer for the first one. Capped at that start time too — a response due
    // after the walk was meant to happen is no deadline at all.
    const earliestStart = new Date(Math.min(...sessions.map((s) => s.scheduledStartTime.getTime())));
    const windowCloses = new Date(Date.now() + RESPONSE_WINDOW_HOURS * 60 * 60 * 1000);
    const respondBy = windowCloses < earliestStart ? windowCloses : earliestStart;

    const pricePerSessionNum = Number(pricePerSession);
    const addOnTotal = addOns.reduce(
        (sum, addOn) => sum + Number(addOn.pricePerSession) * (addOn.perSession ? sessionsCount : 1),
        0,
    );
    const serviceFee = business.serviceFeeAmount != null ? Number(business.serviceFeeAmount) : 0;
    const totalPrice = pricePerSessionNum * sessionsCount + addOnTotal + serviceFee;

    const booking = await context.prisma.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
            data: {
                businessId,
                customerId: customer.id,
                serviceOfferingId,
                servicePackageId: servicePackageId ?? null,
                totalPrice: totalPrice.toFixed(2),
            },
        });

        if (addOns.length > 0) {
            await tx.bookingAddOn.createMany({
                data: addOns.map((addOn) => ({
                    bookingId: newBooking.id,
                    addOnId: addOn.id,
                    priceAtBooking: addOn.pricePerSession,
                })),
            });
        }

        for (const [index, session] of sessions.entries()) {
            await tx.job.create({
                data: {
                    bookingId: newBooking.id,
                    businessId,
                    customerId: customer.id,
                    serviceOfferingId,
                    status: 'PENDING',
                    respondBy,
                    sessionNumber: sessionsCount > 1 ? index + 1 : null,
                    totalSessions: sessionsCount > 1 ? sessionsCount : null,
                    scheduledStartTime: session.scheduledStartTime,
                    scheduledEndTime: session.scheduledEndTime,
                    specialInstructions: specialInstructions ?? null,
                    accessCode: accessCode ?? null,
                    price: pricePerSession,
                    pets: { connect: petIds.map((id) => ({ id })) },
                },
            });
        }

        return newBooking;
    });

    return booking;
};
