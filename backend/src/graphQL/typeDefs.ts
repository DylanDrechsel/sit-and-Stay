const typeDefs = `#graphql
  scalar JSON
  scalar DateTime

  # ── Types ──────────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String
    avatarUrl: String
    globalRole: String!
    createdAt: DateTime!
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
    # Fallback share of a job's price paid to the assigned sitter, as a percent
    # (60 = 60%). Applies only to members with no payRatePercent of their own.
    # SENSITIVE — internal business data, not storefront data. Resolves to null
    # unless the caller is an active OWNER/MANAGER of this business.
    defaultSitterPayPercent: Float
    createdAt: DateTime!
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
    expiresAt: DateTime!
    isAccepted: Boolean!
  }

  # A user's membership record within a specific business
  type BusinessMember {
    id: ID!
    role: String!        # OWNER | MANAGER | EMPLOYEE
    isActive: Boolean!
    joinedAt: DateTime!
    user: User!          # Full profile of the member
    # This member's share of a job's price, as a percent (60 = 60%); null means
    # the business default applies. SENSITIVE — resolves to null unless the
    # caller is this member or an active OWNER/MANAGER of their business, so a
    # sitter can't read a colleague's pay through a nested selection.
    payRatePercent: Float
    # Recurring weekly schedule, Monday→Sunday. Lazily resolved, so it costs
    # nothing on queries that don't ask for it. Days never configured are simply
    # absent from the list — see setAvailability.
    availability: [EmployeeAvailability!]!
  }

  # One day of a member's recurring weekly schedule. This is the data
  # getAvailableEmployees reads when working out who can take a job.
  # A day with no row at all means "never configured", which is treated as
  # unavailable — distinct from a row with isAvailable: false, meaning "day off".
  type EmployeeAvailability {
    id: ID!
    employeeId: ID!      # BusinessMember.id, not User.id
    dayOfWeek: String!   # MONDAY | TUESDAY | ... | SUNDAY
    startTime: String!   # "HH:MM", 24-hour
    endTime: String!     # "HH:MM", 24-hour
    isAvailable: Boolean!
  }

  # A service a business advertises (e.g., Dog Walking — 30 min)
  type ServiceOffering {
    id: ID!
    businessId: ID!
    title: String!
    category: String        # WALKING | BOARDING | DROP_IN | DAY_CARE | TRAINING | GROOMING | HOUSE_SITTING
    description: String!
    basePrice: Float         # headline "from $X" price; null if only bookable via a package
    durationMinutes: Int!
    features: [String!]!     # badge chips, e.g. "GPS tracked", "Insured"
    isActive: Boolean!
    addOns: [ServiceOfferingAddOn!]!
    packages: [ServicePackage!]!
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

  # A priced tier for a ServiceOffering (e.g., "Single Session" vs "4 Session Package")
  type ServicePackage {
    id: ID!
    serviceOfferingId: ID!
    title: String!
    sessionsCount: Int!
    pricePerSession: Float!
    isActive: Boolean!
  }

  # A customer's booking profile — reachable nested via Job.customer so
  # business-side screens can show who booked ("Alex R. · Ballard")
  type CustomerProfile {
    id: ID!
    address: String
    city: String
    user: User!
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
    respondBy: DateTime
    sessionNumber: Int
    totalSessions: Int
    scheduledStartTime: DateTime!
    scheduledEndTime: DateTime!
    actualStartTime: DateTime
    actualEndTime: DateTime
    acceptedAt: DateTime
    declinedAt: DateTime
    assignedAt: DateTime
    cancelledAt: DateTime
    cancellationReason: String
    distanceMeters: Int
    specialInstructions: String
    # SENSITIVE — home access secret (e.g. lockbox code). Only visible to the
    # assigned sitter and an active OWNER/MANAGER of the job's business.
    accessCode: String
    price: Float!
    tipAmount: Float
    pets: [Pet!]!
    # Display relations for list/detail screens — resolved lazily
    customer: CustomerProfile!
    service: ServiceOffering!
    assignee: BusinessMember
    createdAt: DateTime!
    updatedAt: DateTime!
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
    createdAt: DateTime!
    updatedAt: DateTime!
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
    createdAt: DateTime!
  }

  # A single timestamped update (photo and/or note) posted by the assigned
  # sitter while a job is in progress — the "Updates" feed
  type JobUpdate {
    id: ID!
    jobId: ID!
    authorId: ID!
    note: String
    photoUrl: String
    createdAt: DateTime!
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
    createdAt: DateTime!
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
    # 0-100, max 2 decimals. Pass null to clear the business-wide default.
    defaultSitterPayPercent: Float
  }

  # memberId is the BusinessMember.id, not the User.id. Pass a null
  # payRatePercent to clear the override and fall back to the business default.
  input SetMemberPayRateInput {
    businessId: ID!
    memberId: ID!
    payRatePercent: Float
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

  # One day of a member's weekly schedule.
  # startTime/endTime are "HH:MM" 24-hour and required UNLESS isAvailable is
  # false — a day off has no meaningful window. isAvailable defaults to true.
  # Omitting the times while toggling a day off preserves whatever hours are
  # already stored, so switching it back on restores them.
  input AvailabilitySlotInput {
    dayOfWeek: String!   # MONDAY | TUESDAY | ... | SUNDAY
    startTime: String
    endTime: String
    isAvailable: Boolean
  }

  # memberId is the BusinessMember.id, not the User.id — availability is
  # per-membership, so a sitter working for two businesses keeps a separate
  # schedule for each. Days omitted from slots are left untouched: this is a
  # partial update, not a full-week replace. Each day may appear at most once.
  input SetAvailabilityInput {
    memberId: ID!
    slots: [AvailabilitySlotInput!]!
  }

  # ── Service inputs ————————————————————————————————

  # category/basePrice/features are optional — basePrice enables single ad-hoc
  # bookings (createBooking) without a package
  input CreateServiceOfferingInput {
    businessId: ID!
    title: String!
    description: String!
    durationMinutes: Int!
    category: String
    basePrice: Float
    features: [String!]
  }

  # serviceOfferingId is required; all other fields are optional (partial update).
  # category/basePrice accept explicit null to clear; features, when provided, replaces
  # the whole array. At least one field besides serviceOfferingId must be provided.
  input UpdateServiceOfferingInput {
    serviceOfferingId: ID!
    title: String
    description: String
    durationMinutes: Int
    category: String
    basePrice: Float
    features: [String!]
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

  # sessionsCount defaults to 1 when omitted
  input CreateServicePackageInput {
    serviceOfferingId: ID!
    title: String!
    sessionsCount: Int
    pricePerSession: Float!
  }

  # servicePackageId is required; all other fields are optional (partial update).
  # At least one field besides servicePackageId must be provided.
  input UpdateServicePackageInput {
    servicePackageId: ID!
    title: String
    sessionsCount: Int
    pricePerSession: Float
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
  # reason is optional, but must be non-empty when given — it's stored on the
  # job and surfaced on the cancelled request
  input CancelJobInput {
    jobId: ID!
    reason: String
  }

  # amount is in dollars — positive, at most 2 decimal places.
  input AddTipInput {
    jobId: ID!
    amount: Float!
  }

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

  # ── Finance ────────────────────────────────────────────────────────
  # Two separate books. LedgerEntry is the business's cash position and carries a
  # running balance. EmployeeEarning is what the business owes an individual
  # sitter and carries no balance — an outstanding total is derived by summing
  # the rows with no payout attached. See src/utils/ledger.ts.

  # One immutable line of a business's cash ledger. Never updated once written;
  # corrections are new ADJUSTMENT/REFUND entries, not edits.
  type LedgerEntry {
    id: ID!
    # Monotonic ordering key. Sort by this, not createdAt — entries written in
    # one transaction share a timestamp.
    seq: Int!
    entryType: String!      # CREDIT | DEBIT
    amount: Float!          # always positive; entryType carries the direction
    balanceAfter: Float!    # business cash balance after this entry
    currency: String!
    referenceType: String!  # JOB_PAYMENT | TIP | PAYOUT | REFUND | ADJUSTMENT
    description: String
    createdAt: DateTime!
    job: Job                # set on job-derived entries
    payout: Payout          # set on the PAYOUT debit
  }

  # One thing a sitter earned. ratePercent/basisAmount are the snapshotted
  # rule that produced the amount, so changing a pay rate never restates history.
  type EmployeeEarning {
    id: ID!
    type: String!           # JOB_PAY | TIP | BONUS | ADJUSTMENT
    amount: Float!
    ratePercent: Float      # null on BONUS/ADJUSTMENT, which are flat amounts
    basisAmount: Float      # what ratePercent applied to
    isPaid: Boolean!        # derived — true once a payout covers this earning
    description: String
    createdAt: DateTime!
    job: Job
    member: BusinessMember!
    payout: Payout
  }

  # A single settlement to one sitter, covering the earnings attached to it.
  type Payout {
    id: ID!
    amount: Float!
    status: String!         # PENDING | PAID | FAILED
    method: String
    note: String
    paidAt: DateTime
    createdAt: DateTime!
    member: BusinessMember!
    earnings: [EmployeeEarning!]!
  }

  # Headline numbers for the owner dashboard.
  type BusinessFinancialSummary {
    # Cash on hand: the running balance from the most recent ledger entry.
    currentBalance: Float!
    # Total accrued to sitters and not yet paid out — a liability, not cash.
    unpaidEarningsTotal: Float!
    # currentBalance minus unpaidEarningsTotal. Can go negative, which means
    # more is owed to sitters than the business has recorded taking in.
    availableBalance: Float!
    # Completed jobs that had an assigned sitter but produced no JOB_PAY,
    # because neither the sitter nor the business had a pay rate set at the
    # time. Non-zero means someone worked and accrued nothing — surface it.
    jobsMissingPayCount: Int!
  }

  # One row of the payroll screen: what a single sitter is currently owed.
  type MemberEarningsSummary {
    member: BusinessMember!
    unpaidTotal: Float!
    unpaidCount: Int!
  }

  # Note there is no amount field. The payout total is summed from the earnings
  # it settles, so it can never disagree with its own line items.
  input RecordPayoutInput {
    businessId: ID!
    memberId: ID!
    # ISO date-time. Settles only earnings accrued on or before it — a payroll
    # cutoff. Omit to settle everything outstanding.
    throughDate: String
    method: String   # free text, e.g. "Venmo", "Direct deposit"
    note: String
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

    # Returns a single service offering. Active members of its business see it regardless of
    # state; everyone else only if it and its business are active (no auth required otherwise).
    getServiceOffering(serviceOfferingId: ID!): ServiceOffering!

    # Returns a business's service offerings — all of them for an active member, active-only
    # for everyone else (no auth required otherwise; the public storefront view).
    getServiceOfferings(businessId: ID!): [ServiceOffering!]!

    # Same active-member-vs-public visibility rule as getServiceOffering, for a single add-on
    getServiceAddOn(serviceAddOnId: ID!): ServiceOfferingAddOn!

    # Same active-member-vs-public visibility rule as getServiceOfferings, for an offering's add-ons
    getServiceAddOns(serviceOfferingId: ID!): [ServiceOfferingAddOn!]!

    # Same active-member-vs-public visibility rule as getServiceAddOns, for an offering's pricing tiers
    getServicePackages(serviceOfferingId: ID!): [ServicePackage!]!

    # Returns the authenticated customer's active pets, ordered by name (requires JWT + CustomerProfile)
    getMyPets: [Pet!]!

    # Returns all public reviews for a business, most recent first (no auth required)
    getBusinessReviews(businessId: ID!): [Review!]!

    # Returns every active member of the job's business, each annotated with whether
    # they're free to be assigned at the job's scheduled time (OWNER/MANAGER only)
    getAvailableEmployees(jobId: ID!): [EmployeeAvailabilityStatus!]!

    # ── Job / Booking listing queries ————————————————

    # Returns the authenticated customer's bookings, newest first (requires JWT + CustomerProfile)
    getMyBookings: [Booking!]!

    # Returns a business's jobs for the dashboard/requests/schedule views (OWNER/MANAGER only).
    # statuses filters to those JobStatus values; from/to bound scheduledStartTime.
    getBusinessJobs(businessId: ID!, statuses: [String!], from: String, to: String): [Job!]!

    # Returns every job assigned to the caller in their sitter role, across all their
    # active memberships (requires JWT). Same statuses/from/to filters as getBusinessJobs.
    getMyJobs(statuses: [String!], from: String, to: String): [Job!]!

    # Returns a single job (job's customer, assigned sitter, or OWNER/MANAGER only)
    getJob(jobId: ID!): Job!

    # Returns a job's live update feed, newest first (same access as getJob).
    # Cursor pagination: pass the oldest createdAt you have as 'before' for the next page.
    getJobUpdates(jobId: ID!, limit: Int, before: String): [JobUpdate!]!

    # ── Finance queries ————————————————————————

    # A business's ledger statement, newest first (OWNER/MANAGER only).
    # Cursor pagination on seq: pass the lowest seq you have as 'before'.
    getBusinessLedger(businessId: ID!, limit: Int, before: Int): [LedgerEntry!]!

    # Headline finance numbers for the owner dashboard (OWNER/MANAGER only).
    getBusinessFinancialSummary(businessId: ID!): BusinessFinancialSummary!

    # What each sitter is currently owed, for the payroll screen (OWNER/MANAGER
    # only). Members with nothing outstanding are omitted.
    getUnpaidEarningsByMember(businessId: ID!): [MemberEarningsSummary!]!

    # Earnings for one business's sitters, newest first (OWNER/MANAGER only).
    # memberId narrows to a single sitter; unpaidOnly hides settled earnings.
    getBusinessEarnings(businessId: ID!, memberId: ID, unpaidOnly: Boolean, limit: Int): [EmployeeEarning!]!

    # The caller's own earnings at one business, newest first. Any active member
    # can call this for themselves — it needs no OWNER/MANAGER role.
    getMyEarnings(businessId: ID!, unpaidOnly: Boolean, limit: Int): [EmployeeEarning!]!
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

    # Sets one member's share of a job's price. OWNER only — deliberately
    # stricter than removeMember, since a MANAGER must not be able to set pay
    # (including their own). Takes effect on jobs completed after this point;
    # earnings already accrued keep the rate snapshotted on them.
    setMemberPayRate(input: SetMemberPayRateInput!): BusinessMember!

    # Writes one or more days of a member's recurring weekly schedule — the data
    # getAvailableEmployees reads when deciding who can be assigned to a job.
    # Callable by the member themselves, or by an active OWNER/MANAGER of their
    # business. Returns the member's full week, not just the days that changed.
    setAvailability(input: SetAvailabilityInput!): [EmployeeAvailability!]!

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

    # Creates a pricing tier under a service offering (OWNER or MANAGER only)
    createServicePackage(input: CreateServicePackageInput!): ServicePackage!

    # Partial update of a service package (OWNER or MANAGER only)
    updateServicePackage(input: UpdateServicePackageInput!): ServicePackage!

    # Soft-deletes a service package by setting isActive to false (OWNER or MANAGER only)
    deleteServicePackage(servicePackageId: ID!): ServicePackage!

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

    # Calls off a job. Cancels ONE session, not a whole booking.
    #   Customer:       PENDING | ACCEPTED | ASSIGNED -> CANCELLED
    #   OWNER/MANAGER:  ACCEPTED | ASSIGNED | IN_PROGRESS -> CANCELLED
    # PENDING is customer-only (a business declines rather than cancels — see
    # declineJob); IN_PROGRESS is business-only (the sitter is already on site).
    # The assigned sitter cannot cancel — they ask a manager to reassign.
    cancelJob(input: CancelJobInput!): Job!

    # Tips the sitter on a COMPLETED job (the job's customer only). Credits the
    # business ledger and accrues the tip in full to the assigned sitter, in the
    # same transaction that writes Job.tipAmount. One tip per job, final — there
    # is no edit or reversal flow, since a tip can be paid out immediately.
    addTip(input: AddTipInput!): Job!

    # ── Finance mutations ————————————————————————

    # Settles a sitter's outstanding earnings: creates a PAID Payout covering
    # them, marks them paid, and debits the business ledger, in one transaction.
    # OWNER only. Records a transfer made outside the app — nothing here moves
    # real money. The amount is derived from the earnings, not from input.
    # No reversal exists: correct a mistake with an ADJUSTMENT earning.
    recordPayout(input: RecordPayoutInput!): Payout!

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
