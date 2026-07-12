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

  # A user's membership record within a specific business
  type BusinessMember {
    id: ID!
    role: String!        # OWNER | MANAGER | EMPLOYEE
    isActive: Boolean!
    joinedAt: String!
    user: User!          # Full profile of the member
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
    # Required for new users — omit if the invited email already has an account
    password: String
    firstName: String
    lastName: String
    phone: String
  }

  # All fields optional — only provided fields are updated (partial update)
  # Pass an empty string for phone or avatarUrl to clear the field.
  input UpdateUserInput {
    firstName: String
    lastName: String
    phone: String
    avatarUrl: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input ChangeEmailInput {
    newEmail: String!
    password: String!  # Current password — confirms identity before the change is applied
  }

  # ── Business inputs ————————————————————————————————

  # At least one of name or description must be provided
  input UpdateBusinessInput {
    businessId: ID!
    name: String
    description: String
  }

  # memberId is the BusinessMember.id (the membership record), not the User.id
  input RemoveMemberInput {
    businessId: ID!
    memberId: ID!
  }

  # ── Queries ────────────────────────────────────────────────────────

  type Query {
    healthCheck: String

    # Returns the currently authenticated user (requires JWT)
    getMe: User!

    # Looks up any user by their UUID (requires JWT)
    getUserById(userId: ID!): User!

    # Returns all businesses the authenticated user is a member of (requires JWT)
    getMyBusinesses: [Business!]!

    # Returns all active members of a business with their user profiles (requires JWT + active membership)
    getBusinessMembers(businessId: ID!): [BusinessMember!]!

    # Returns all inactive members of a business with their user profiles (requires JWT + active membership)
    getInactiveBusinessMembers(businessId: ID!): [BusinessMember!]!
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

    # Resends a pending invitation with a fresh token + reset expiry (OWNER/MANAGER only)
    # Use this when the invitee didn't receive the original email.
    resendInvitation(input: InviteInput!): Invitation!

    # Accepts an invitation token and creates the user account + BusinessMember
    acceptInvitation(input: AcceptInvitationInput!): AuthPayload!

    # Updates the authenticated user's own profile (requires JWT)
    # email and password changes use separate dedicated mutations
    updateUser(input: UpdateUserInput!): User!

    # Changes the authenticated user's password (requires JWT)
    # currentPassword must match before the new password is accepted
    changePassword(input: ChangePasswordInput!): User!

    # Changes the authenticated user's email address (requires JWT)
    # Current password required to confirm identity
    changeEmail(input: ChangeEmailInput!): User!

    # ── Business mutations ———————————————————————

    # Updates a business's name and/or description (OWNER or MANAGER only)
    updateBusiness(input: UpdateBusinessInput!): Business!

    # Soft-deletes a business by setting isActive to false (OWNER only)
    deactivateBusiness(businessId: ID!): Business!

    # Soft-removes a member from a business by setting BusinessMember.isActive to false
    # OWNER can remove MANAGER or EMPLOYEE; MANAGER can only remove EMPLOYEE
    removeMember(input: RemoveMemberInput!): BusinessMember!

  }
`;

export default typeDefs;
