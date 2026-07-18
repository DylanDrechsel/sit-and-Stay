import { GraphQLError } from 'graphql';
import { leaveReviewSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { LeaveReviewInput } from '../../../../types/review.js';

/**
 * leaveReview
 *
 * Leaves a review for a completed job. Only the customer who booked the job
 * may review it, only once, and only after it's COMPLETED.
 *
 * Business.avgRating/reviewCount are denormalized aggregates with no other
 * code keeping them in sync — this resolver recomputes both from the live
 * set of public reviews and writes them in the same transaction as the
 * review itself, so the two are never observably out of sync.
 */
export const leaveReview = async (
    _: unknown,
    { input }: { input: LeaveReviewInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = leaveReviewSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, rating, comment, tags } = parsed.data;

    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer == null) {
        throw new GraphQLError('Only customers can leave reviews.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    if (job.customerId !== customer.id) {
        throw new GraphQLError('You can only review your own jobs.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'COMPLETED') {
        throw new GraphQLError(`Only completed jobs can be reviewed (current status: ${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const existingReview = await context.prisma.review.findUnique({ where: { jobId } });
    if (existingReview != null) {
        throw new GraphQLError('This job has already been reviewed.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const review = await context.prisma.$transaction(async (tx) => {
        const newReview = await tx.review.create({
            data: {
                jobId,
                businessId: job.businessId,
                customerId: customer.id,
                rating,
                comment: comment ?? null,
                tags,
            },
        });

        // Recompute from scratch rather than incrementing — same "derive, don't
        // mutate in place" philosophy as the financial ledger. Only public
        // reviews count, since avgRating/reviewCount back the public profile.
        const aggregate = await tx.review.aggregate({
            where: { businessId: job.businessId, isPublic: true },
            _avg: { rating: true },
            _count: true,
        });

        await tx.business.update({
            where: { id: job.businessId },
            data: {
                avgRating: aggregate._avg.rating != null ? Number(aggregate._avg.rating).toFixed(2) : null,
                reviewCount: aggregate._count,
            },
        });

        return newReview;
    });

    return review;
};
