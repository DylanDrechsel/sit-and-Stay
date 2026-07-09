const typeDefs = `#graphql
  scalar JSON

  type Query {
    healthCheck: String
  }

  type Mutation {
    _empty: String
  }
`;

export default typeDefs;