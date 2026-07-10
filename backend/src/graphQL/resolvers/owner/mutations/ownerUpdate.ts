import type { GraphQLContext } from '../../../../types/context.js';

export interface UpdateOwnerInput {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
}

export const ownerUpdate = async (
    _: unknown,
    { input }: { input: UpdateOwnerInput },
    context: GraphQLContext,
) => {
    // TODO: implement ownerUpdate
    throw new Error('ownerUpdate not yet implemented');
};
