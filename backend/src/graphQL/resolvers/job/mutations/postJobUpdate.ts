import { GraphQLError } from 'graphql';
import { postJobUpdateSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { PostJobUpdateInput } from '../../../../types/jobActivity.js';

/**
 * postJobUpdate
 *
 * Posts a live update (photo and/or note) to an in-progress job — the
 * "Updates" feed on the live job-tracking screen. Only the job's assigned
 * sitter may post, and only while the job is IN_PROGRESS.
 */
export const postJobUpdate = async (
    _: unknown,
    { input }: { input: PostJobUpdateInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = postJobUpdateSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, note, photoUrl } = parsed.data;

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
        throw new GraphQLError('Only the assigned sitter can post updates for this job.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'IN_PROGRESS') {
        throw new GraphQLError(`Updates can only be posted while a job is in progress (current status: ${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    // Build the create payload explicitly rather than spreading parsed.data —
    // see addPet.ts for why (exactOptionalPropertyTypes rejects Zod's
    // `T | undefined` optional fields against Prisma's `T | null` input types).
    const updateData: { jobId: string; authorId: string; note?: string; photoUrl?: string } = {
        jobId,
        authorId: context.user.userId,
    };
    if (note !== undefined) updateData.note = note;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    return context.prisma.jobUpdate.create({ data: updateData });
};
