import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../../types/context.js';

interface JobAccessShape {
    businessId: string;
    customerId: string;
    assigneeId: string | null;
}

/**
 * assertJobViewAccess
 *
 * Throws unless the authenticated caller is allowed to view this job:
 *   - the customer who booked it,
 *   - the assigned sitter (active membership), or
 *   - an active OWNER/MANAGER of the job's business.
 *
 * Shared by the job read queries (getJob, getJobUpdates) so the access rule
 * can't drift between them. The job mutations keep their own stricter,
 * role-specific checks — this is view access only.
 */
export const assertJobViewAccess = async (
    job: JobAccessShape,
    context: GraphQLContext,
): Promise<void> => {
    if (context.user == null) {
        throw new GraphQLError('You must be logged in.', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }

    // Customer who booked the job?
    const customer = await context.prisma.customerProfile.findUnique({
        where: { userId: context.user.userId },
    });
    if (customer != null && customer.id === job.customerId) return;

    // Active member of the job's business — OWNER/MANAGER always, EMPLOYEE
    // only if they're this job's assignee.
    const membership = await context.prisma.businessMember.findUnique({
        where: { userId_businessId: { userId: context.user.userId, businessId: job.businessId } },
    });
    if (membership != null && membership.isActive) {
        if (['OWNER', 'MANAGER'].includes(membership.role)) return;
        if (membership.id === job.assigneeId) return;
    }

    throw new GraphQLError('You do not have permission to view this job.', {
        extensions: { code: 'FORBIDDEN' },
    });
};
