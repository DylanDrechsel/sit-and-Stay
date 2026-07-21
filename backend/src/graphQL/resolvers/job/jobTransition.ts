import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';

/**
 * runGuardedTransition
 *
 * Makes a job status transition safe against a concurrent one.
 *
 * Every lifecycle mutation checks the job's current status before writing, but
 * that check reads the row, decides in JS, then writes — three separate steps.
 * Two callers can both pass the same check and the second write silently
 * overwrites the first's transition. Neither sees an error: each gets back a Job
 * reflecting its own intended state rather than what actually landed, so a
 * cancelled job can come back ASSIGNED with a sitter dispatched to it.
 *
 * The fix is to repeat the status the check just verified as a condition on the
 * UPDATE itself, so Postgres matches the row only while it is still in that
 * state. The loser matches nothing, Prisma raises P2025, and this converts that
 * into a CONFLICT — the same code ledger.ts returns when a serialization failure
 * costs a caller its write.
 *
 * This is the single-write counterpart to what clockOut/completeJob/addTip do
 * with runSerializable. Those need a transaction because they write the job and
 * the financial tables together, and the ledger's read-modify-write balance has
 * to be serialized against competing writers. A lone status flip needs neither:
 * one conditional UPDATE is already atomic, without the retry and backoff cost
 * of Serializable isolation.
 *
 * Keep the pre-check as well — it produces the specific, actionable message in
 * the ordinary non-racing case ("use declineJob", "contact the business"). This
 * only has to explain the rare genuine race.
 */
export const runGuardedTransition = async <T>(
    write: () => Promise<T>,
    conflictMessage: string,
): Promise<T> => {
    try {
        return await write();
    } catch (err) {
        // P2025 is "record to update not found". The caller has already
        // confirmed the job exists, so the only way the guarded UPDATE matches
        // nothing is that the status moved between the check and the write.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            throw new GraphQLError(conflictMessage, {
                extensions: { code: 'CONFLICT' },
            });
        }
        throw err;
    }
};
