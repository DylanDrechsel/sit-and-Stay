import GraphQLJSON from 'graphql-type-json';

export default {
    Query: {
        healthCheck: () => 'Server is up and running smoothly!',
    },
    Mutation: {},
    JSON: GraphQLJSON,
}