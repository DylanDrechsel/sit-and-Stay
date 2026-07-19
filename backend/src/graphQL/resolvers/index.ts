import GraphQLJSON from 'graphql-type-json';
import { DateTimeScalar } from '../scalars.js';
import { invitationResolvers } from './invitation/invitationResolvers.js';
import { ownerResolvers } from './owner/ownerResolvers.js';
import { customerResolvers } from './customer/customerResolvers.js';
import { utilsResolvers } from './utils/utilsResolvers.js';
import { userResolvers } from './user/userResolvers.js';
import { businessResolvers } from './business/businessResolvers.js';
import { jobResolvers } from './job/jobResolvers.js';
import { reviewResolvers } from './review/reviewResolvers.js';
import { serviceResolvers } from './service/serviceResolvers.js';
import { financeResolvers } from './finance/financeResolvers.js';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
        ...userResolvers.Query,
        ...businessResolvers.Query,
        ...customerResolvers.Query,
        ...jobResolvers.Query,
        ...reviewResolvers.Query,
        ...serviceResolvers.Query,
        ...financeResolvers.Query,
    },
    Mutation: {
        ...invitationResolvers.Mutation,
        ...ownerResolvers.Mutation,
        ...customerResolvers.Mutation,
        ...utilsResolvers.Mutation,
        ...userResolvers.Mutation,
        ...businessResolvers.Mutation,
        ...jobResolvers.Mutation,
        ...reviewResolvers.Mutation,
        ...serviceResolvers.Mutation,
        ...financeResolvers.Mutation,
    },
    Job: jobResolvers.Job,
    Booking: jobResolvers.Booking,
    BookingAddOn: jobResolvers.BookingAddOn,
    Business: businessResolvers.Business,
    BusinessMember: businessResolvers.BusinessMember,
    CustomerProfile: customerResolvers.CustomerProfile,
    ServiceOffering: serviceResolvers.ServiceOffering,
    ServiceOfferingAddOn: serviceResolvers.ServiceOfferingAddOn,
    ServicePackage: serviceResolvers.ServicePackage,
    LedgerEntry: financeResolvers.LedgerEntry,
    EmployeeEarning: financeResolvers.EmployeeEarning,
    Payout: financeResolvers.Payout,
    JSON: GraphQLJSON,
    DateTime: DateTimeScalar,
};
