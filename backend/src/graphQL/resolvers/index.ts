import GraphQLJSON from 'graphql-type-json';
import { invitationResolvers } from './invitation/invitationResolvers.js';
import { ownerResolvers } from './owner/ownerResolvers.js';
import { customerResolvers } from './customer/customerResolvers.js';
import { utilsResolvers } from './utils/utilsResolvers.js';
import { userResolvers } from './user/userResolvers.js';
import { businessResolvers } from './business/businessResolvers.js';
import { jobResolvers } from './job/jobResolvers.js';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
        ...userResolvers.Query,
        ...businessResolvers.Query,
        ...customerResolvers.Query,
        ...jobResolvers.Query,
    },
    Mutation: {
        ...invitationResolvers.Mutation,
        ...ownerResolvers.Mutation,
        ...customerResolvers.Mutation,
        ...utilsResolvers.Mutation,
        ...userResolvers.Mutation,
        ...businessResolvers.Mutation,
        ...jobResolvers.Mutation,
    },
    Job: jobResolvers.Job,
    Booking: jobResolvers.Booking,
    BookingAddOn: jobResolvers.BookingAddOn,
    JSON: GraphQLJSON,
};
