import { GraphQLError } from 'graphql';
import { assignSitterSchema, formatZodError } from '../../../../utils/validate.js';
import type { GraphQLContext } from '../../../../types/context.js';
import type { AssignSitterInput } from '../../../../types/booking.js';

/**
 * assignSitter
 *
 * Assigns an active BusinessMember to an accepted job. OWNER or MANAGER of
 * the job's business only. Valid transition: ACCEPTED -> ASSIGNED.
 */
export const assignSitter = async (
    _: unknown,
    { input }: { input: AssignSitterInput },
    context: GraphQLContext,
) => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    const parsed = assignSitterSchema.safeParse(input);
    if (parsed.success === false) {
        throw new GraphQLError(formatZodError(parsed.error), {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const { jobId, assigneeId } = parsed.data;

    const job = await context.prisma.job.findUnique({ where: { id: jobId } });
    if (job == null) {
        throw new GraphQLError('Job not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId: job.businessId } },
    });
    if (membership == null || !membership.isActive || !['OWNER', 'MANAGER'].includes(membership.role)) {
        throw new GraphQLError('You do not have permission to assign sitters for this business.', {
            extensions: { code: 'FORBIDDEN' },
        });
    }

    if (job.status !== 'ACCEPTED') {
        throw new GraphQLError(`Only accepted jobs can be assigned a sitter (current status: ${job.status}).`, {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    const assignee = await context.prisma.businessMember.findUnique({ where: { id: assigneeId } });
    if (assignee == null || assignee.businessId !== job.businessId || !assignee.isActive) {
        throw new GraphQLError('Invalid employee for this business.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
    }

    return context.prisma.job.update({
        where: { id: jobId },
        data: { assigneeId, status: 'ASSIGNED', assignedAt: new Date() },
    });
};
