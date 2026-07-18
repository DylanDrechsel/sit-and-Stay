import { GraphQLError } from 'graphql';
import { submitReportCardSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { SubmitReportCardInput } from '../../../../types/jobActivity.js';

/**
 * submitReportCard
 *
 * Submits the end-of-job report card — one per job. Only the job's assigned
 * sitter may submit, and only after the job is COMPLETED (mirrors
 * leaveReview's one-per-completed-job precedent).
 */
export const submitReportCard = async (
    _: unknown,
    { input }: { input: SubmitReportCardInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = submitReportCardSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, mood, peeCount, poopCount, ateFood, drankWater, gaveTreat, summary } = parsed.data;

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    if (job.assigneeId == null) {
        throw new GraphQLError('This job has no assigned sitter.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    const assignee = await context.prisma.businessMember.findUnique({ where: { id: job.assigneeId } });
    if (assignee == null || !assignee.isActive || assignee.userId !== context.user.userId) {
        throw new GraphQLError('Only the assigned sitter can submit a report card for this job.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'COMPLETED') {
        throw new GraphQLError(`A report card can only be submitted for a completed job (current status: ${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const existingReportCard = await context.prisma.reportCard.findUnique({ where: { jobId } });
    if (existingReportCard != null) {
        throw new GraphQLError('A report card has already been submitted for this job.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Build the create payload explicitly rather than spreading parsed.data —
    // see addPet.ts for why (exactOptionalPropertyTypes rejects Zod's
    // `T | undefined` optional fields against Prisma's `T | null` input types).
    const reportCardData: {
        jobId: string;
        mood?: 'VERY_HAPPY' | 'HAPPY' | 'CALM' | 'ANXIOUS' | 'LOW_ENERGY';
        peeCount?: number;
        poopCount?: number;
        ateFood?: boolean;
        drankWater?: boolean;
        gaveTreat?: boolean;
        summary?: string;
    } = { jobId };

    if (mood !== undefined) reportCardData.mood = mood;
    if (peeCount !== undefined) reportCardData.peeCount = peeCount;
    if (poopCount !== undefined) reportCardData.poopCount = poopCount;
    if (ateFood !== undefined) reportCardData.ateFood = ateFood;
    if (drankWater !== undefined) reportCardData.drankWater = drankWater;
    if (gaveTreat !== undefined) reportCardData.gaveTreat = gaveTreat;
    if (summary !== undefined) reportCardData.summary = summary;

    return context.prisma.reportCard.create({ data: reportCardData });
};
