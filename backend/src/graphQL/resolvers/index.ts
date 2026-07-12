import GraphQLJSON from 'graphql-type-json';
import { invitationResolvers } from './invitation/invitationResolvers.js';
import { ownerResolvers } from './owner/ownerResolvers.js';
import { customerResolvers } from './customer/customerResolvers.js';
import { utilsResolvers } from './utils/utilsResolvers.js';
import { userResolvers } from './user/userResolvers.js';
import { businessResolvers } from './business/businessResolvers.js';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
        ...userResolvers.Query,
        ...businessResolvers.Query,
    },
    Mutation: {
        ...invitationResolvers.Mutation,
        ...ownerResolvers.Mutation,
        ...customerResolvers.Mutation,
        ...utilsResolvers.Mutation,
        ...userResolvers.Mutation,
        ...businessResolvers.Mutation,
    },
    JSON: GraphQLJSON,
};
