const typeDefs = `#graphql
  scalar JSON

  # ── Types ──────────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String
    avatarUrl: String
    globalRole: String!
    createdAt: String!
  }

  type Business {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
    createdAt: String!
  }

  # Returned after registerCustomer, login, and acceptInvitation
  type AuthPayload {
    token: String!
    user: User!
  }

  # Returned after registerOwner — includes the newly created business
  type OwnerAuthPayload {
    token: String!
    user: User!
    business: Business!
  }

  type Invitation {
    id: ID!
    email: String!
    role: String!
    expiresAt: String!
    isAccepted: Boolean!
  }

  # ── Inputs ─────────────────────────────────────────────────────────

  input RegisterCustomerInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  input RegisterOwnerInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
    businessName: String!
    businessDescription: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input InviteInput {
    email: String!
    role: String!       # Must be MANAGER or EMPLOYEE
    businessId: String!
  }

  input AcceptInvitationInput {
    token: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  # ── Queries ────────────────────────────────────────────────────────

  type Query {
    healthCheck: String
    getOwner: User!
  }

  # ── Mutations ──────────────────────────────────────────────────────

  type Mutation {
    # Creates a User (globalRole: USER) + CustomerProfile
    registerCustomer(input: RegisterCustomerInput!): AuthPayload!

    # Creates a User + Business + BusinessMember(OWNER) in one transaction
    registerOwner(input: RegisterOwnerInput!): OwnerAuthPayload!
    
    # Works for all roles — returns a signed JWT
    login(input: LoginInput!): AuthPayload!

    # Sends an invitation to a Manager or Employee (OWNER/MANAGER only)
    inviteEmployee(input: InviteInput!): Invitation!

    # Accepts an invitation token and creates the user account + BusinessMember
    acceptInvitation(input: AcceptInvitationInput!): AuthPayload!

  }
`;

export default typeDefs;