import GraphQLJSON from 'graphql-type-json';
import { invitationResolvers } from './invitation.js';
import { ownerResolvers } from './owner/ownerResolvers.js';
import { authResolvers } from './auth.js';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
        ...ownerResolvers.Query,
    },
    Mutation: {
        ...invitationResolvers.Mutation,
        ...ownerResolvers.Mutation,
        ...authResolvers.Mutation,
    },
    JSON: GraphQLJSON,
};