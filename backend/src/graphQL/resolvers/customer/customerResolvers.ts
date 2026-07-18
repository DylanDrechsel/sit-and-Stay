import { registerCustomer } from './mutations/registerCustomer.js';
import { addPet } from './mutations/addPet.js';
import { updatePet } from './mutations/updatePet.js';
import { deletePet } from './mutations/deletePet.js';
import { getMyPets } from './queries/getMyPets.js';
import type { GraphQLContext } from '../../../types/context.js';
import type { CustomerProfileParent } from '../../../types/customer.js';

export const customerResolvers = {
    Query: {
        getMyPets,
    },
    Mutation: {
        registerCustomer,
        addPet,
        updatePet,
        deletePet,
    },
    // CustomerProfile objects are reachable nested via Job.customer; `user` is
    // a relation the parent query never `include`s, so resolve it lazily —
    // same pattern as Job.pets in job/jobResolvers.ts.
    CustomerProfile: {
        user: (parent: CustomerProfileParent, _: unknown, context: GraphQLContext) =>
            context.prisma.user.findUniqueOrThrow({ where: { id: parent.userId } }),
    },
};
