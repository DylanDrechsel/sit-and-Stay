import GraphQLJSON from 'graphql-type-json';
import { invitationResolvers } from './invitation/invitationResolvers.js';
import { ownerResolvers } from './owner/ownerResolvers.js';
import { customerResolvers } from './customer/customerResolvers.js';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
        ...ownerResolvers.Query,
    },
    Mutation: {
        ...invitationResolvers.Mutation,
        ...ownerResolvers.Mutation,
        ...customerResolvers.Mutation,
    },
    JSON: GraphQLJSON,
};