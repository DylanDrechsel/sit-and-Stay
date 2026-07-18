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
    isVerified: Boolean!
    heroPhotoUrl: String
    addressLine: String
    city: String
    neighborhood: String
    serviceFeeAmount: Float
    avgRating: Float
    reviewCount: Int!
    createdAt: String!
  }

  # One business in a getNearbyBusinesses result, with the computed distance
  # from the search point and its headline "from $X" price
  type NearbyBusiness {
    business: Business!
    distanceMiles: Float!
    fromPrice: Float
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

  # A service a business advertises (e.g., Dog Walking — 30 min)
  type ServiceOffering {
    id: ID!
    businessId: ID!
    title: String!
    description: String!
    durationMinutes: Int!
    isActive: Boolean!
    addOns: [ServiceOfferingAddOn!]!
  }

  # An optional extra charge attached to a ServiceOffering (e.g., "Additional Dog")
  type ServiceOfferingAddOn {
    id: ID!
    serviceOfferingId: ID!
    title: String!
    pricePerSession: Float!
    perSession: Boolean!
    isActive: Boolean!
  }

  # A pet belonging to the authenticated customer
  type Pet {
    id: ID!
    name: String!
    type: String!         # DOG | CAT | BIRD | RABBIT | REPTILE | OTHER
    breed: String
    age: Int
    sex: String            # MALE | FEMALE
    weightLb: Float
    photoUrl: String
    isNeutered: Boolean!
    isMicrochipped: Boolean!
    medicalNotes: String
    careInstructions: String
    homeAccessNotes: String
    vetName: String
    vetClinic: String
    vetPhone: String
    isActive: Boolean!
  }

  # A single scheduled session — one Job per session of a Booking
  type Job {
    id: ID!
    jobNumber: Int!
    bookingId: ID
    businessId: ID!
    customerId: ID!
    serviceOfferingId: ID!
    assigneeId: ID
    status: String!         # PENDING | ACCEPTED | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED | DECLINED
    respondBy: String
    sessionNumber: Int
    totalSessions: Int
    scheduledStartTime: String!
    scheduledEndTime: String!
    actualStartTime: String
    actualEndTime: String
    acceptedAt: String
    declinedAt: String
    assignedAt: String
    distanceMeters: Int
    specialInstructions: String
    # SENSITIVE — home access secret (e.g. lockbox code). Only visible to the
    # assigned sitter and an active OWNER/MANAGER of the job's business.
    accessCode: String
    price: Float!
    tipAmount: Float
    pets: [Pet!]!
    createdAt: String!
    updatedAt: String!
  }

  # The customer's checkout order — groups the Job(s) created for a package purchase
  type Booking {
    id: ID!
    businessId: ID!
    customerId: ID!
    serviceOfferingId: ID!
    servicePackageId: ID
    totalPrice: Float!
    jobs: [Job!]!
    addOns: [BookingAddOn!]!
    createdAt: String!
    updatedAt: String!
  }

  # An add-on selected at checkout, with its price snapshotted at booking time
  type BookingAddOn {
    id: ID!
    priceAtBooking: Float!
    addOn: ServiceOfferingAddOn!
  }

  # A review left by a customer for a completed job
  type Review {
    id: ID!
    jobId: ID!
    businessId: ID!
    customerId: ID!
    rating: Int!
    comment: String
    tags: [String!]!
    isPublic: Boolean!
    createdAt: String!
  }

  # A single timestamped update (photo and/or note) posted by the assigned
  # sitter while a job is in progress — the "Updates" feed
  type JobUpdate {
    id: ID!
    jobId: ID!
    authorId: ID!
    note: String
    photoUrl: String
    createdAt: String!
  }

  # The end-of-job summary the sitter fills out — one per job
  type ReportCard {
    id: ID!
    jobId: ID!
    mood: String        # VERY_HAPPY | HAPPY | CALM | ANXIOUS | LOW_ENERGY
    peeCount: Int!
    poopCount: Int!
    ateFood: Boolean!
    drankWater: Boolean!
    gaveTreat: Boolean!
    summary: String
    createdAt: String!
  }

  # One business member's assignment-availability status for a specific job's
  # scheduled time — the "Assign a sitter" screen's available/unavailable split
  type EmployeeAvailabilityStatus {
    member: BusinessMember!
    isAvailable: Boolean!
    conflictReason: String
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

  input SetBusinessLocationInput {
    businessId: ID!
    latitude: Float!
    longitude: Float!
  }

  # ── Service inputs ————————————————————————————————

  input CreateServiceOfferingInput {
    businessId: ID!
    title: String!
    description: String!
    durationMinutes: Int!
  }

  # serviceOfferingId is required; all other fields are optional (partial update).
  # At least one of title, description, durationMinutes, or isActive must be provided.
  input UpdateServiceOfferingInput {
    serviceOfferingId: ID!
    title: String
    description: String
    durationMinutes: Int
    isActive: Boolean
  }

  input CreateServiceAddOnInput {
    serviceOfferingId: ID!
    title: String!
    pricePerSession: Float!
    perSession: Boolean
  }

  # serviceAddOnId is required; all other fields are optional (partial update).
  # At least one of title, pricePerSession, perSession, or isActive must be provided.
  input UpdateServiceAddOnInput {
    serviceAddOnId: ID!
    title: String
    pricePerSession: Float
    perSession: Boolean
    isActive: Boolean
  }

  # ── Pet inputs ————————————————————————————————————

  input AddPetInput {
    name: String!
    type: String!         # DOG | CAT | BIRD | RABBIT | REPTILE | OTHER
    breed: String
    age: Int
    sex: String            # MALE | FEMALE
    weightLb: Float
    photoUrl: String
    isNeutered: Boolean
    isMicrochipped: Boolean
    medicalNotes: String
    careInstructions: String
    homeAccessNotes: String
    vetName: String
    vetClinic: String
    vetPhone: String
  }

  # petId is required; all other fields are optional (partial update).
  # Pass an empty string for a clearable text field to clear it.
  # At least one field besides petId must be provided.
  input UpdatePetInput {
    petId: ID!
    name: String
    type: String
    breed: String
    age: Int
    sex: String
    weightLb: Float
    photoUrl: String
    isNeutered: Boolean
    isMicrochipped: Boolean
    medicalNotes: String
    careInstructions: String
    homeAccessNotes: String
    vetName: String
    vetClinic: String
    vetPhone: String
  }

  # ── Job / Booking inputs ————————————————————————

  input BookingSessionInput {
    scheduledStartTime: String!
    scheduledEndTime: String!
  }

  # Provide servicePackageId to book a multi-session package (sessions.length
  # must match the package's sessionsCount); omit it to book a single ad-hoc
  # session priced from the service offering's basePrice.
  input CreateBookingInput {
    businessId: ID!
    serviceOfferingId: ID!
    servicePackageId: ID
    addOnIds: [ID!]
    petIds: [ID!]!
    sessions: [BookingSessionInput!]!
    specialInstructions: String
    accessCode: String
  }

  # assigneeId is the BusinessMember.id (the membership record), not the User.id
  input AssignSitterInput {
    jobId: ID!
    assigneeId: ID!
  }

  # ── Review inputs ————————————————————————————————

  input LeaveReviewInput {
    jobId: ID!
    rating: Int!
    comment: String
    tags: [String!]
  }

  # ── Job Activity inputs (JobUpdate / ReportCard) —————————

  # At least one of note/photoUrl must be provided
  input PostJobUpdateInput {
    jobId: ID!
    note: String
    photoUrl: String
  }

  # jobId is required; every other field falls back to the model's default when omitted
  input SubmitReportCardInput {
    jobId: ID!
    mood: String        # VERY_HAPPY | HAPPY | CALM | ANXIOUS | LOW_ENERGY
    peeCount: Int
    poopCount: Int
    ateFood: Boolean
    drankWater: Boolean
    gaveTreat: Boolean
    summary: String
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

    # Finds active businesses within radiusMiles of the given point, nearest first (no auth required).
    # category filters to businesses with at least one active ServiceOffering in that category;
    # search does a simple case-insensitive match against the business name.
    # radiusMiles defaults to 25 (max 100); limit defaults to 20 (max 50).
    getNearbyBusinesses(
      latitude: Float!
      longitude: Float!
      radiusMiles: Float
      category: String
      search: String
      limit: Int
    ): [NearbyBusiness!]!

    # Returns a single service offering with its add-ons (requires JWT + active business membership)
    getServiceOffering(serviceOfferingId: ID!): ServiceOffering!

    # Returns all service offerings (active and inactive) for a business (requires JWT + active business membership)
    getServiceOfferings(businessId: ID!): [ServiceOffering!]!

    # Returns a single service add-on (requires JWT + active business membership)
    getServiceAddOn(serviceAddOnId: ID!): ServiceOfferingAddOn!

    # Returns all add-ons (active and inactive) for a service offering (requires JWT + active business membership)
    getServiceAddOns(serviceOfferingId: ID!): [ServiceOfferingAddOn!]!

    # Returns the authenticated customer's active pets, ordered by name (requires JWT + CustomerProfile)
    getMyPets: [Pet!]!

    # Returns all public reviews for a business, most recent first (no auth required)
    getBusinessReviews(businessId: ID!): [Review!]!

    # Returns every active member of the job's business, each annotated with whether
    # they're free to be assigned at the job's scheduled time (OWNER/MANAGER only)
    getAvailableEmployees(jobId: ID!): [EmployeeAvailabilityStatus!]!
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

    # Sets a business's PostGIS location — required for it to appear in getNearbyBusinesses
    # (OWNER or MANAGER only)
    setBusinessLocation(input: SetBusinessLocationInput!): Business!

    # Soft-deletes a business by setting isActive to false (OWNER only)
    deactivateBusiness(businessId: ID!): Business!

    # Soft-removes a member from a business by setting BusinessMember.isActive to false
    # OWNER can remove MANAGER or EMPLOYEE; MANAGER can only remove EMPLOYEE
    removeMember(input: RemoveMemberInput!): BusinessMember!

    # ── Service mutations ————————————————————————

    # Creates a service offering under a business (OWNER or MANAGER only)
    createServiceOffering(input: CreateServiceOfferingInput!): ServiceOffering!

    # Partial update of a service offering (OWNER or MANAGER only)
    updateServiceOffering(input: UpdateServiceOfferingInput!): ServiceOffering!

    # Soft-deletes a service offering by setting isActive to false (OWNER or MANAGER only)
    deleteServiceOffering(serviceOfferingId: ID!): ServiceOffering!

    # Creates an add-on under a service offering (OWNER or MANAGER only)
    createServiceAddOn(input: CreateServiceAddOnInput!): ServiceOfferingAddOn!

    # Partial update of a service add-on (OWNER or MANAGER only)
    updateServiceAddOn(input: UpdateServiceAddOnInput!): ServiceOfferingAddOn!

    # Soft-deletes a service add-on by setting isActive to false (OWNER or MANAGER only)
    deleteServiceAddOn(serviceAddOnId: ID!): ServiceOfferingAddOn!

    # ── Pet mutations ————————————————————————————

    # Adds a pet to the authenticated customer's profile (requires JWT + CustomerProfile)
    addPet(input: AddPetInput!): Pet!

    # Partial update of one of the authenticated customer's own pets (requires JWT + ownership)
    updatePet(input: UpdatePetInput!): Pet!

    # Soft-deletes one of the authenticated customer's own pets by setting isActive to false
    deletePet(petId: ID!): Pet!

    # ── Job / Booking mutations ————————————————————

    # Creates a Booking + its Job session(s) for the authenticated customer (requires JWT + CustomerProfile)
    createBooking(input: CreateBookingInput!): Booking!

    # Accepts a pending job request (OWNER/MANAGER only). PENDING -> ACCEPTED.
    acceptJob(jobId: ID!): Job!

    # Declines a pending job request (OWNER/MANAGER only). PENDING -> DECLINED.
    declineJob(jobId: ID!): Job!

    # Assigns an active BusinessMember to an accepted job (OWNER/MANAGER only). ACCEPTED -> ASSIGNED.
    assignSitter(input: AssignSitterInput!): Job!

    # Clocks the assigned sitter in to a job (assigned sitter only). ASSIGNED -> IN_PROGRESS.
    clockIn(jobId: ID!): Job!

    # Clocks the assigned sitter out, finishing the job (assigned sitter only). IN_PROGRESS -> COMPLETED.
    clockOut(jobId: ID!): Job!

    # Manually marks a job completed (OWNER/MANAGER only) — an override for when
    # clock-in/clock-out wasn't used. Allowed from ASSIGNED or IN_PROGRESS -> COMPLETED.
    completeJob(jobId: ID!): Job!

    # ── Review mutations ————————————————————————

    # Leaves a review for a completed job (requires JWT + job ownership + status COMPLETED).
    # Recomputes Business.avgRating/reviewCount in the same transaction as the review write.
    leaveReview(input: LeaveReviewInput!): Review!

    # ── Job Activity mutations ————————————————————

    # Posts a live update (photo and/or note) to an in-progress job (assigned sitter only)
    postJobUpdate(input: PostJobUpdateInput!): JobUpdate!

    # Submits a job's report card — one per job (assigned sitter only, job must be COMPLETED)
    submitReportCard(input: SubmitReportCardInput!): ReportCard!
  }
`;

export default typeDefs;
