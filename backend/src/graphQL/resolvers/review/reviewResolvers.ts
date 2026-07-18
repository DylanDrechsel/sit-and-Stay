import { leaveReview } from './mutations/leaveReview.js';
import { getBusinessReviews } from './queries/getBusinessReviews.js';

export const reviewResolvers = {
    Query: {
        getBusinessReviews,
    },
    Mutation: {
        leaveReview,
    },
};
