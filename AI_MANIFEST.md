# PetSitterPro — AI Manifest

> **Purpose of this document**: Gives an AI assistant (or new developer) a complete, fast
> understanding of this application's architecture, data models, API surface, and conventions
> without reading every source file.
>
> **Keep this file up to date** as the app grows.

---

## 1. What This App Is

**PetSitterPro** is a B2B2C Rover-style pet care marketplace. It supports:
- **Businesses** (pet sitting companies) that manage employees, services, scheduling, and payments
- **Customers** (pet owners) who search for nearby sitters, book services, and leave reviews
- **Employees** who are assigned jobs by business owners/managers
- Real-time **messaging** between businesses↔customers and businesses↔employees
- An immutable **financial ledger** per business for payment tracking

---

## 2. Tech Stack

| Layer                | Technology                                        |
|----------------------|---------------------------------------------------|
| Runtime              | Node.js (ESM, `"type": "module"`)                 |
| Language             | TypeScript 7                                      |
| Web Framework        | Express 5                                         |
| API Layer            | Apollo Server 5 (GraphQL) via the Express 5 integration |
| ORM                  | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Database             | PostgreSQL 16 + PostGIS 3.4 (via Docker)          |
| Geospatial           | PostGIS — `geometry(Point, 4326)` + GiST indexes  |
| Dev Runner           | `tsx watch`                                       |
| Auth                 | JWT (`jsonwebtoken`) + bcrypt                     |
| Email                | Nodemailer (`nodemailer` + `@types/nodemailer`)   |
| Validation           | Zod 4                                             |

---

## 3. Project Structure

```
pet_sitter_pro/
├── docker-compose.yml             # PostgreSQL + PostGIS container
├── .gitignore                     # Excludes node_modules, .env
├── AI_MANIFEST.md                 # This file — living architecture reference
└── backend/
    ├── prisma/
    │   ├── schema.prisma          # Single source of truth for all DB models
    │   └── migrations/            # Prisma migration history (committed to git)
    ├── prisma.config.ts           # Prisma CLI config (points to schema.prisma)
    ├── src/
    │   ├── server.ts              # Entry point — Express + Apollo setup
    │   ├── types/                 # Shared TypeScript interfaces
    │   │   ├── auth.ts            # LoginInput
    │   │   ├── booking.ts         # CreateBookingInput, BookingSessionInput, AssignSitterInput
    │   │   ├── business.ts        # UpdateBusinessInput, RemoveMemberInput
    │   │   ├── context.ts         # GraphQLContext interface
    │   │   ├── invitation.ts      # InviteInput, AcceptInvitationInput, InvitationEmailPayload
    │   │   ├── pet.ts             # AddPetInput, UpdatePetInput
    │   │   ├── registration.ts    # RegisterCustomerInput, RegisterOwnerInput
    │   │   ├── review.ts          # LeaveReviewInput
    │   │   └── user.ts            # UpdateUserInput, ChangePasswordInput, ChangeEmailInput
    │   ├── utils/
    │   │   ├── generatePrisma.ts  # Prisma singleton using pg.Pool + PrismaPg adapter
    │   │   ├── auth.ts            # hashPassword, comparePassword, signToken, verifyToken, TokenPayload
    │   │   ├── email.ts           # Nodemailer transporter + sendInvitationEmail
    │   │   └── validate.ts        # Zod schemas for all inputs + formatZodError helper
    │   └── graphQL/
    │       ├── typeDefs.ts        # GraphQL schema (SDL)
    │       └── resolvers/
    │           ├── index.ts       # Merges all domain resolver maps
    │           ├── owner/
    │           │   ├── ownerResolvers.ts
    │           │   ├── queries/
    │           │   └── mutations/
    │           │       └── registerOwner.ts
    │           ├── customer/
    │           │   ├── customerResolvers.ts
    │           │   ├── queries/
    │           │   │   └── getMyPets.ts
    │           │   └── mutations/
    │           │       ├── registerCustomer.ts
    │           │       ├── addPet.ts
    │           │       ├── updatePet.ts
    │           │       └── deletePet.ts
    │           ├── job/
    │           │   ├── jobResolvers.ts   # also exports Job/Booking/BookingAddOn type-level field maps
    │           │   └── mutations/
    │           │       ├── createBooking.ts
    │           │       ├── acceptJob.ts
    │           │       ├── declineJob.ts
    │           │       ├── assignSitter.ts
    │           │       ├── clockIn.ts
    │           │       ├── clockOut.ts
    │           │       └── completeJob.ts
    │           ├── invitation/
    │           │   ├── invitationResolvers.ts
    │           │   └── mutations/
    │           │       ├── inviteEmployee.ts
    │           │       ├── acceptInvitation.ts
    │           │       └── resendInvitation.ts
    │           ├── user/
    │           │   ├── userResolvers.ts
    │           │   ├── queries/
    │           │   │   ├── getMe.ts
    │           │   │   └── getUserById.ts
    │           │   └── mutations/
    │           │       ├── changeEmail.ts
    │           │       ├── changePassword.ts
    │           │       └── updateUser.ts
    │           ├── business/
    │           │   ├── businessResolvers.ts
    │           │   ├── queries/
    │           │   │   ├── getBusinessMembers.ts
    │           │   │   └── getMyBusinesses.ts
    │           │   └── mutations/
    │           │       ├── deactivateBusiness.ts
    │           │       ├── removeMember.ts
    │           │       └── updateBusiness.ts
    │           ├── review/
    │           │   ├── reviewResolvers.ts
    │           │   ├── queries/
    │           │   │   └── getBusinessReviews.ts
    │           │   └── mutations/
    │           │       └── leaveReview.ts
    │           └── utils/
    │               ├── utilsResolvers.ts
    │               └── mutations/
    │                   └── login.ts
    ├── .env                       # Environment variables (never committed)
    ├── package.json
    └── tsconfig.json
```

> **Convention**: Each domain folder (`owner/`, `customer/`, `job/`, `invitation/`, `user/`,
> `business/`, `review/`, `utils/`) contains a `*Resolvers.ts` barrel file that groups its `Query`
> and `Mutation` maps. The root `resolvers/index.ts` must explicitly import and spread each barrel;
> adding a domain folder alone does not expose its fields through GraphQL. `job/jobResolvers.ts` is
> the one exception that also exports type-level field maps (`Job`, `Booking`, `BookingAddOn`) —
> `resolvers/index.ts` spreads those directly as top-level keys alongside `Query`/`Mutation`/`JSON`,
> not inside either of them.

---

## 4. Environment Variables (`.env`)

| Variable         | Description                                                    | Example / Default                                                          |
|------------------|----------------------------------------------------------------|----------------------------------------------------------------------------|
| `DATABASE_URL`   | Prisma PostgreSQL connection string                            | `postgresql://postgres:postgres@localhost:5432/pet_sitter_pro?schema=public` |
| `PORT`           | HTTP port the server listens on                                | `4000`                                                                     |
| `JWT_SECRET`     | Secret key for signing JWTs                                    | `changeme_supersecret_jwt_key`                                             |
| `JWT_EXPIRES_IN` | JWT expiry duration (optional)                                 | `1d`                                                                       |
| `EMAIL_HOST`     | SMTP server hostname                                           | `smtp.gmail.com`                                                           |
| `EMAIL_PORT`     | SMTP port (`587` for STARTTLS, `465` for SSL)                  | `587`                                                                      |
| `EMAIL_USER`     | SMTP login username                                            | `your-email@gmail.com`                                                     |
| `EMAIL_PASS`     | SMTP password or app-specific password                         | —                                                                          |
| `EMAIL_FROM`     | Display name + address for outgoing mail                       | `PetSitterPro <noreply@petsitterpro.com>`                                  |
| `APP_BASE_URL`   | Frontend base URL used to build invitation acceptance links    | `http://localhost:3000`                                                    |

---

## 5. Database Setup (Docker)

The database runs in Docker via `docker-compose.yml`. It uses the official `postgis/postgis:16-3.4`
image which includes PostgreSQL 16 + PostGIS 3.4 pre-installed.

**Starting the database:**
```bash
# From project root
docker compose up -d
```

**Stopping the database:**
```bash
docker compose down
```

The database persists data in a Docker named volume (`pgdata`) so data survives container restarts.

> ⚠️ Do NOT use `sudo service postgresql start` anymore — the database is now fully managed by Docker.

---

## 6. Entry Point — `src/server.ts`

**What it does:**
- Loads `.env` via `dotenv`
- Imports the shared `PrismaClient` singleton from `utils/generatePrisma.ts` (exported as `db`)
- Creates an `ApolloServer` with `typeDefs` + `resolvers`
- Mounts Apollo at `/graphql` via `expressMiddleware`
- Decodes the JWT from the `Authorization: Bearer <token>` header on every request
- Passes `{ req, prisma: db, user }` as the **GraphQL context** (`user` is `null` if unauthenticated)
- Registers REST routes (`/` and `/health`)
- Starts Express on `process.env.PORT` (default `4000`)

**CORS whitelist (defined in `server.ts`):**
- `http://localhost:3000`
- `http://localhost:5001/graphql`
- `http://localhost:8000`
- `http://localhost:8080`
- `https://studio.apollographql.com`

---

## 7. Database Connection (`src/utils/generatePrisma.ts`)

**What it does:**
- Implements the **Singleton Pattern** for the `PrismaClient` using the Prisma driver adapter API.
- Uses a **`pg.Pool`** (node-postgres) created from `DATABASE_URL`, wrapped in a **`PrismaPg`** adapter (`@prisma/adapter-pg`).
- The adapter is passed directly to `new PrismaClient({ adapter })` — this is the recommended approach for using Prisma with a connection pool.
- Attaches the Prisma instance to the Node.js `globalThis` object during local development.
- Prevents database connection exhaustion (the "Too many connections" error) caused by the server hot-reloading on every file save.
- Logs `info` and `warn` level events; uses `pretty` error format.

**Implementation overview:**
```ts
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prismaClientSingleton = () => new PrismaClient({ adapter, log: ['info', 'warn'], errorFormat: 'pretty' });

const db = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db;

export default db;
```

**Exported values:**
```ts
export default db  // Import this if you need DB access outside of GraphQL resolvers (e.g., utility scripts)
```

> ⚠️ Because Prisma is initialized with a driver adapter, the `postgresqlExtensions` preview feature
> must remain in `schema.prisma` and `prisma.config.ts` must point to the correct schema path.

---

## 8. REST API Routes

| Method | Path      | Description                                              |
|--------|-----------|----------------------------------------------------------|
| GET    | `/`       | Returns API name + links to `/graphql` and `/health`     |
| GET    | `/health` | Pings the DB. Returns `200` if connected, `503` if not   |

### `GET /health` response shapes

**200 OK:**
```json
{ "status": "ok", "timestamp": "...", "database": "connected" }
```
**503 Error:**
```json
{ "status": "error", "timestamp": "...", "database": "unreachable", "error": "..." }
```

---

## 9. Database Models (`prisma/schema.prisma`)

All IDs use `uuid()`. Models with timestamps have both `createdAt` and `updatedAt`.

### Enums

| Enum                 | Values                                                              |
|----------------------|---------------------------------------------------------------------|
| `GlobalRole`         | `ADMIN`, `USER`                                                     |
| `BusinessRole`       | `OWNER`, `MANAGER`, `EMPLOYEE`                                      |
| `PetType`            | `DOG`, `CAT`, `BIRD`, `RABBIT`, `REPTILE`, `OTHER`                  |
| `DayOfWeek`          | `MONDAY` … `SUNDAY`                                                 |
| `JobStatus`          | `PENDING`, `ACCEPTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DECLINED` |
| `EntryType`          | `CREDIT`, `DEBIT`                                                   |
| `LedgerReferenceType`| `JOB_PAYMENT`, `TIP`, `PAYOUT`, `REFUND`, `ADJUSTMENT`             |
| `AuthProvider`       | `EMAIL`, `GOOGLE`, `APPLE` — how a `User` authenticates            |
| `PetSex`             | `MALE`, `FEMALE`                                                    |
| `ServiceCategory`    | `WALKING`, `BOARDING`, `DROP_IN`, `DAY_CARE`, `TRAINING`, `GROOMING`, `HOUSE_SITTING` |
| `BackgroundCheckStatus`| `NOT_STARTED`, `PENDING`, `APPROVED`, `REJECTED` — sitter onboarding |
| `PetMood`            | `VERY_HAPPY`, `HAPPY`, `CALM`, `ANXIOUS`, `LOW_ENERGY` — report-card mood |

---

### Model: `User` → table `users`

The global identity record for any person on the platform (customer or business member).

| Field          | Type        | Notes                            |
|----------------|-------------|----------------------------------|
| `id`           | String       | uuid, primary key                |
| `email`        | String       | unique                           |
| `passwordHash` | String?      | bcrypt hash; **nullable** — `null` for OAuth-only accounts (Google/Apple) |
| `authProvider` | AuthProvider | default `EMAIL`; `GOOGLE`/`APPLE` for social sign-in |
| `firstName`    | String       |                                  |
| `lastName`     | String       |                                  |
| `phone`        | String?      | optional                         |
| `avatarUrl`    | String?      | optional profile photo URL       |
| `globalRole`   | GlobalRole   | `USER` or `ADMIN`, default `USER`|

**Relations:**
- `memberships` → `BusinessMember[]` — which businesses this user belongs to (and in what role)
- `customer` → `CustomerProfile?` — exists if user has booked as a pet owner
- `messages` → `Message[]` — all messages sent by this user
- `jobUpdates` → `JobUpdate[]` — live photo/note updates this user posted while working a job

---

### Model: `Business` → table `businesses`

A pet sitting business (the tenant in the multi-tenant model).

| Field         | Type       | Notes                                               |
|---------------|------------|-----------------------------------------------------|
| `id`             | String     | uuid, primary key                                |
| `name`           | String     |                                                  |
| `description`    | String?    | optional                                         |
| `isActive`       | Boolean    | default `true`; indexed for filtering            |
| `isVerified`     | Boolean    | default `false`; drives the "Verified" badge     |
| `heroPhotoUrl`   | String?    | hero image on the business profile               |
| `addressLine`    | String?    | human-readable street address                    |
| `city`           | String?    | e.g. "Seattle"                                   |
| `neighborhood`   | String?    | e.g. "Ballard"                                   |
| `serviceFeeAmount`| Decimal?  | precision `(10,2)`; flat per-booking checkout fee |
| `avgRating`      | Decimal?   | precision `(3,2)`; denormalized review average   |
| `reviewCount`    | Int        | default `0`; denormalized review count           |
| `location`       | geometry?  | PostGIS Point (lng, lat) for geospatial search   |

> `avgRating`/`reviewCount` are denormalized for fast list rendering — they are not auto-maintained
> by Prisma. `leaveReview` (`resolvers/review/mutations/leaveReview.ts`) keeps them in sync on
> **create**, by recomputing both from a fresh `review.aggregate()` over that business's public
> reviews and writing the result in the same transaction as the review. There is no `updateReview`
> or `deleteReview` yet — if either is added later, it must recompute and write these two fields the
> same way, or the aggregate will silently drift from the underlying review rows.

**Relations:**
- `members` → `BusinessMember[]`
- `offerings` → `ServiceOffering[]`
- `jobs` → `Job[]`
- `ledgerEntries` → `LedgerEntry[]`
- `reviews` → `Review[]`
- `invitations` → `Invitation[]`
- `conversations` → `Conversation[]`

**Indexes:** `isActive`, `location` (GiST for PostGIS)

---

### Model: `BusinessMember` → table `business_members`

Junction table connecting a `User` to a `Business` with a scoped role.
A user can be a member of multiple businesses, but only one role per business (`@@unique([userId, businessId])`).

| Field       | Type         | Notes                               |
|-------------|--------------|-------------------------------------|
| `id`        | String       | uuid, primary key                   |
| `userId`    | String       | FK → `users.id`, cascade delete     |
| `businessId`| String       | FK → `businesses.id`, cascade delete|
| `role`      | BusinessRole | `OWNER`, `MANAGER`, or `EMPLOYEE`   |
| `title`     | String?      | display role, e.g. "Walker & drop-ins", "Boarding lead" |
| `isActive`  | Boolean      | default `true`; set to `false` when the member is removed |
| `backgroundCheckStatus`| BackgroundCheckStatus | default `NOT_STARTED`; sitter onboarding |
| `onboardingCompletedAt`| DateTime? | set when the invite → onboarding flow finishes |
| `joinedAt`  | DateTime     | default now                         |

**Relations:**
- `user` → `User`
- `business` → `Business`
- `availability` → `EmployeeAvailability[]`
- `assignedJobs` → `Job[]` (via `JobAssignee` relation name)
- `conversations` → `Conversation[]` (Owner↔Employee conversations)

**Indexes:** `businessId`, `(businessId, isActive)`

`removeMember` is a soft removal: it preserves the membership and related history while setting
`isActive` to `false`. A later accepted invitation for the same user and business reactivates
the existing record and updates its role.

---

### Model: `Invitation` → table `invitations`

Used to onboard new employees into a business. A secure token is generated and
emailed to the invitee. On acceptance, a `BusinessMember` record is created.

| Field       | Type         | Notes                               |
|-------------|--------------|-------------------------------------|
| `id`        | String       | uuid, primary key                   |
| `businessId`| String       | FK → `businesses.id`, cascade delete|
| `email`     | String       | invitee's email                     |
| `role`      | BusinessRole | role they will be granted           |
| `token`     | String       | unique secure token                 |
| `expiresAt` | DateTime     | token expiry                        |
| `isAccepted`| Boolean      | default `false`                     |

---

### Model: `CustomerProfile` → table `customer_profiles`

Extended profile for users who book pet care services. One-to-one with `User`.

| Field      | Type      | Notes                                          |
|------------|-----------|------------------------------------------------|
| `id`       | String    | uuid, primary key                              |
| `userId`   | String    | FK → `users.id`, unique, cascade delete        |
| `address`  | String?   | optional text address                          |
| `city`     | String?   | e.g. "Seattle"                                 |
| `location` | geometry? | PostGIS Point for proximity-based search       |

**Relations:**
- `user` → `User`
- `pets` → `Pet[]`
- `jobs` → `Job[]`
- `reviews` → `Review[]`
- `conversations` → `Conversation[]` (Owner↔Customer conversations)

**Indexes:** `location` (GiST for PostGIS)

---

### Model: `Pet` → table `pets`

A pet belonging to a customer.

| Field             | Type           | Notes                          |
|-------------------|----------------|--------------------------------|
| `id`              | String         | uuid, primary key              |
| `customerId`      | String         | FK → `customer_profiles.id`, cascade delete |
| `name`            | String         |                                |
| `type`            | PetType        | enum                           |
| `breed`           | String?        | optional                       |
| `age`             | Int?           | optional, in years             |
| `sex`             | PetSex?        | optional; `MALE`/`FEMALE`      |
| `weightLb`        | Decimal?       | precision `(5,2)`; shown as "64 lb" |
| `photoUrl`        | String?        | optional pet photo             |
| `isNeutered`      | Boolean        | default `false`; "Neutered"/"Spayed" badge |
| `isMicrochipped`  | Boolean        | default `false`; "Microchipped" badge |
| `medicalNotes`    | String?        | optional                       |
| `careInstructions`| String?        | optional                       |
| `homeAccessNotes` | String?        | optional; non-secret access notes (e.g. "harness in hall closet"). Do **not** store lockbox codes here — those are shared per job |
| `vetName`         | String?        | optional; shared with assigned sitter |
| `vetClinic`       | String?        | optional                       |
| `vetPhone`        | String?        | optional                       |
| `isActive`        | Boolean        | default `true`; **soft-delete flag** — set to `false` by `deletePet`; active pets only are returned by `getMyPets` |

**Relations:**
- `customer` → `CustomerProfile`
- `jobs` → `Job[]` (via `JobPets` many-to-many relation)

**Indexes:** `(customerId, isActive)` — scopes all pet reads to the owner and filters out soft-deleted pets efficiently

---

### Model: `ServiceOffering` → table `service_offerings`

A service that a business advertises (e.g., Dog Walking — 30 min). Carries an optional headline
`basePrice` ("from $X"), while detailed pricing is still expressed through its `packages` and
`addOns` relations.

| Field            | Type    | Notes                                |
|------------------|---------|--------------------------------------|
| `id`             | String  | uuid, primary key                    |
| `businessId`     | String  | FK → `businesses.id`, cascade delete |
| `title`          | String  | e.g., "Dog Walking"                  |
| `category`       | ServiceCategory? | optional for now; backfill existing rows before making it required |
| `description`    | String  |                                      |
| `basePrice`      | Decimal? | precision `(10,2)`; headline "from $X" price. Packages still price individually |
| `durationMinutes`| Int     | expected duration                    |
| `features`       | String[] | badge chips, e.g. `["GPS tracked", "Photo updates", "Insured"]` |
| `isActive`       | Boolean | default `true`                       |
| `packages`       | ServicePackage[] | pricing tiers for this offering (see below) |
| `addOns`         | ServiceOfferingAddOn[] | optional extra charges for this offering (see below) |

> **GraphQL/resolver status:** `typeDefs.ts` declares a full CRUD surface for `ServiceOffering`
> (`ServiceOffering` type, `Create`/`UpdateServiceOfferingInput`, `getServiceOffering(s)`,
> `create`/`update`/`deleteServiceOffering`) and `src/utils/validate.ts` has matching Zod schemas
> (`createServiceOfferingSchema`, `updateServiceOfferingSchema`), but **no resolver files exist**
> for any of it — there is no `resolvers/service/` domain and `resolvers/index.ts` does not
> reference one. These SDL fields have no backing resolver map entries; calling them will fail
> at query time (or break schema construction, depending on Apollo's strictness setting). Treat
> this as declared-but-unimplemented until resolvers are added following §12.

---

### Model: `ServicePackage` → table `service_packages`

A priced tier for a `ServiceOffering` (e.g., "Single Session" vs "4 Session Package").

| Field               | Type    | Notes                                          |
|---------------------|---------|-------------------------------------------------|
| `id`                | String  | uuid, primary key                                |
| `serviceOfferingId` | String  | FK → `service_offerings.id`, cascade delete      |
| `title`             | String  | e.g., "Single Session"                           |
| `sessionsCount`     | Int     | default `1`                                      |
| `pricePerSession`   | Decimal | USD, precision `(10,2)`                          |
| `isActive`          | Boolean | default `true`                                   |

> **GraphQL/resolver status:** not exposed anywhere in `typeDefs.ts` — no type, input, query, or
> mutation references `ServicePackage`. Only reachable today via the seed data created inside
> `registerOwner.ts`'s transaction. No CRUD surface exists for this model.

---

### Model: `ServiceOfferingAddOn` → table `service_offering_add_ons`

An optional extra charge attached to a `ServiceOffering` (e.g., "Additional Dog").

| Field               | Type    | Notes                                          |
|---------------------|---------|-------------------------------------------------|
| `id`                | String  | uuid, primary key                                |
| `serviceOfferingId` | String  | FK → `service_offerings.id`, cascade delete      |
| `title`             | String  | e.g., "Additional Dog"                           |
| `pricePerSession`   | Decimal | USD, precision `(10,2)`                          |
| `perSession`        | Boolean | default `true` — whether the charge is per session or flat |
| `isActive`          | Boolean | default `true`                                   |

> **GraphQL/resolver status:** same situation as `ServiceOffering` above — `typeDefs.ts` declares
> a `ServiceOfferingAddOn` type, `Create`/`UpdateServiceAddOnInput`, and
> `get`/`create`/`update`/`deleteServiceAddOn` operations, and `validate.ts` has matching Zod
> schemas, but no `resolvers/service/` files or `resolvers/index.ts` wiring exist. Declared but
> unimplemented.

---

### Model: `Booking` → table `bookings`

The customer's checkout order. Groups the `Job` rows created for a multi-session package purchase
("4-walk pack" → 4 `Job` rows sharing one `Booking`) and holds the pack-level total shown at
checkout ("$104 pack + $10 add-on + $6 fee = $120"). A single ad-hoc session is still a `Booking`
with exactly one `Job` and `servicePackageId: null`.

| Field               | Type     | Notes                                              |
|---------------------|----------|-----------------------------------------------------|
| `id`                | String   | uuid, primary key                                  |
| `businessId`        | String   | FK → `businesses.id`                               |
| `customerId`        | String   | FK → `customer_profiles.id`                        |
| `serviceOfferingId` | String   | FK → `service_offerings.id`                        |
| `servicePackageId`  | String?  | FK → `service_packages.id`, optional — null for a single ad-hoc session |
| `totalPrice`        | Decimal  | precision `(10,2)`; full order total incl. add-ons and service fee |
| `createdAt`         | DateTime | default now                                        |
| `updatedAt`         | DateTime | auto-updated                                       |

**Relations:**
- `business` → `Business`
- `customer` → `CustomerProfile`
- `serviceOffering` → `ServiceOffering`
- `servicePackage` → `ServicePackage?`
- `jobs` → `Job[]` — one row per session
- `addOns` → `BookingAddOn[]`

**Indexes:** `businessId`, `customerId`

> **GraphQL/resolver status:** created by `createBooking` (`resolvers/job/mutations/createBooking.ts`).
> Returned as the `Booking` GraphQL type; `jobs` and `addOns` are resolved lazily via type-level
> field resolvers rather than a Prisma `include` — see `Job Resolver Behavior` in §10. There is no
> query yet to look up a `Booking` after creation (e.g. by id, or "my bookings for this business").

---

### Model: `BookingAddOn` → table `booking_add_ons`

An add-on selected at checkout. `priceAtBooking` snapshots the add-on's price at the moment of
purchase so a later price change on the `ServiceOfferingAddOn` doesn't rewrite old receipts.

| Field             | Type    | Notes                                              |
|-------------------|---------|------------------------------------------------------|
| `id`              | String  | uuid, primary key                                    |
| `bookingId`       | String  | FK → `bookings.id`, cascade delete                   |
| `addOnId`         | String  | FK → `service_offering_add_ons.id`                   |
| `priceAtBooking`  | Decimal | precision `(10,2)`; price snapshot at purchase time  |

`@@unique([bookingId, addOnId])` — an add-on can only be selected once per booking.

> **GraphQL/resolver status:** created by `createBooking`; exposed as `Booking.addOns` via a
> type-level field resolver (not a plain `include`). `priceAtBooking` is snapshotted from the
> add-on's price at the moment of booking, independent of later price changes.

---

### Model: `EmployeeAvailability` → table `employee_availabilities`

Recurring weekly schedule for an employee. One record per day per employee (`@@unique([employeeId, dayOfWeek])`).

| Field        | Type          | Notes                                   |
|--------------|---------------|-----------------------------------------|
| `id`         | String        | uuid, primary key                       |
| `employeeId` | String        | FK → `business_members.id`, cascade delete |
| `dayOfWeek`  | DayOfWeek     | enum                                    |
| `startTime`  | String        | format `HH:MM`                          |
| `endTime`    | String        | format `HH:MM`                          |
| `isAvailable`| Boolean       | default `true`                          |

---

### Model: `Job` → table `jobs`

The central operational entity connecting a Customer, Business, ServiceOffering, assigned Employee, and Pets.

| Field                | Type          | Notes                                      |
|----------------------|---------------|--------------------------------------------|
| `id`                 | String        | uuid, primary key                          |
| `jobNumber`          | Int           | unique, autoincrement; human-readable "Job #1382" |
| `bookingId`          | String?       | FK → `bookings.id`, optional — parent checkout order grouping a package's sessions |
| `businessId`         | String        | FK → `businesses.id`                       |
| `customerId`         | String        | FK → `customer_profiles.id`                |
| `serviceOfferingId`  | String        | FK → `service_offerings.id`                |
| `assigneeId`         | String?       | FK → `business_members.id`, optional       |
| `status`             | JobStatus     | default `PENDING`                          |
| `respondBy`          | DateTime?     | request-acceptance deadline ("RESPOND BY 7 PM") |
| `sessionNumber`      | Int?          | position within a multi-session package ("walk **2** of 4") |
| `totalSessions`      | Int?          | total sessions in the package ("walk 2 of **4**") |
| `scheduledStartTime` | DateTime      |                                            |
| `scheduledEndTime`   | DateTime      |                                            |
| `actualStartTime`    | DateTime?     | clock-in — set when job actually begins    |
| `actualEndTime`      | DateTime?     | clock-out — set when job actually ends     |
| `acceptedAt`         | DateTime?     | when the business accepted the request     |
| `declinedAt`         | DateTime?     | when the business declined the request (pairs with `JobStatus.DECLINED`) |
| `assignedAt`         | DateTime?     | when a sitter was assigned                 |
| `distanceMeters`     | Int?          | route distance walked ("0.8 mi walked")    |
| `specialInstructions`| String?       | optional customer notes                    |
| `accessCode`         | String?       | **SENSITIVE** — per-job home access secret (e.g. lockbox code). Set by the customer per job, never stored on `Pet`. Resolvers must expose this only to the assigned sitter and an active OWNER/MANAGER of the job's business — never in public/list queries or logs |
| `price`              | Decimal       | USD, precision `(10,2)`                    |
| `tipAmount`          | Decimal?      | USD, precision `(10,2)`, set on completion |
| `createdAt`          | DateTime      | default now (serves as the "Requested" timestamp) |
| `updatedAt`          | DateTime      | auto-updated                               |

**Relations:**
- `booking` → `Booking?`
- `business` → `Business`
- `customer` → `CustomerProfile`
- `service` → `ServiceOffering`
- `assignee` → `BusinessMember?`
- `pets` → `Pet[]` (via `JobPets` many-to-many)
- `ledgerEntries` → `LedgerEntry[]`
- `review` → `Review?`
- `conversation` → `Conversation?`
- `updates` → `JobUpdate[]` — live photo/note feed during the job
- `reportCard` → `ReportCard?` — single end-of-job summary

**Indexes:** `bookingId`, `businessId`, `customerId`

> **GraphQL/resolver status:** created via `createBooking`; transitioned via `acceptJob`,
> `declineJob`, `assignSitter`, `clockIn`, `clockOut`, `completeJob` (`resolvers/job/mutations/`).
> See `Job Resolver Behavior` in §10 for the enforced status state machine. No listing/lookup query
> exists yet — `updates`, `review`, and `conversation` relations also have no resolvers.

---

### Model: `Review` → table `reviews`

One review per completed job. Links the job, the business being reviewed, and the customer who wrote it.

| Field       | Type           | Notes                            |
|-------------|----------------|----------------------------------|
| `id`        | String         | uuid, primary key                |
| `jobId`     | String         | FK → `jobs.id`, unique           |
| `businessId`| String         | FK → `businesses.id`             |
| `customerId`| String         | FK → `customer_profiles.id`      |
| `rating`    | Int            | 1–5 stars                        |
| `comment`   | String?        | optional                         |
| `tags`      | String[]       | quick-select highlights, e.g. `["On time", "Great photos"]` |
| `isPublic`  | Boolean        | default `true`; shown on the business's public profile |

**Indexes:** `(businessId, rating)` — for sorted/filtered review queries

> **GraphQL/resolver status:** created via `leaveReview` (`resolvers/review/mutations/leaveReview.ts`);
> listed via `getBusinessReviews` (`resolvers/review/queries/getBusinessReviews.ts`), which is public
> (no auth) and filters to `isPublic: true`, ordered by `createdAt` descending. `isPublic` itself is
> not yet settable through any mutation — every review is created public; there is no way for a
> business to hide one. No `updateReview`/`deleteReview` exist — see the note on `Business.avgRating`/
> `reviewCount` in §9 above for why that matters if either gets added later. The reviewer's identity
> (customer name) is not exposed anywhere on `Review` — there's no `customer`/`user` field yet.

---

### Model: `JobUpdate` → table `job_updates`

A single timestamped post the assigned sitter shares while a job is in progress — the "Updates"
feed on the live job-tracking screen. A job has many updates.

| Field       | Type      | Notes                                          |
|-------------|-----------|------------------------------------------------|
| `id`        | String    | uuid, primary key                              |
| `jobId`     | String    | FK → `jobs.id`, cascade delete                 |
| `authorId`  | String    | FK → `users.id`; the poster (typically the assigned sitter) |
| `note`      | String?   | optional text (`@db.Text`)                     |
| `photoUrl`  | String?   | optional photo                                 |
| `createdAt` | DateTime  | default now                                    |

**Indexes:** `(jobId, createdAt desc)` — for reverse-chronological feed paging

---

### Model: `ReportCard` → table `report_cards`

The single end-of-job summary the sitter fills out at clock-out ("report card after every session").
One-to-one with `Job` (`jobId` is unique).

| Field       | Type      | Notes                                          |
|-------------|-----------|------------------------------------------------|
| `id`        | String    | uuid, primary key                              |
| `jobId`     | String    | FK → `jobs.id`, unique, cascade delete         |
| `mood`      | PetMood?  | optional; "😄 Mood: Very Happy"                |
| `peeCount`  | Int       | default `0`                                    |
| `poopCount` | Int       | default `0`                                    |
| `ateFood`   | Boolean   | default `false`                                |
| `drankWater`| Boolean   | default `false`                                |
| `gaveTreat` | Boolean   | default `false`                                |
| `summary`   | String?   | free-text recap surfaced to the owner (`@db.Text`) |
| `createdAt` | DateTime  | default now                                    |

---

### Model: `LedgerEntry` → table `ledger_entries`

Immutable financial record. Every payment event appends a new row — balances are never mutated in place.
Use Prisma `$transaction` with `isolationLevel: Serializable` when writing entries to prevent race conditions.

| Field          | Type                | Notes                              |
|----------------|---------------------|------------------------------------|
| `id`           | String              | uuid, primary key                  |
| `businessId`   | String              | FK → `businesses.id`               |
| `jobId`        | String?             | FK → `jobs.id`, optional           |
| `entryType`    | EntryType           | `CREDIT` or `DEBIT`                |
| `amount`       | Decimal             | USD, precision `(10,2)`            |
| `balanceAfter` | Decimal             | running balance after this entry   |
| `currency`     | String              | default `"USD"`                    |
| `referenceType`| LedgerReferenceType | reason for the entry               |
| `description`  | String?             | optional human-readable note       |

**Indexes:** `(businessId, createdAt DESC)` — for efficient balance history queries

---

### Model: `Conversation` → table `conversations`

A conversation always belongs to a `Business`. Exactly **three** shapes are allowed:
- `customerId` set, `memberId` null → **Business ↔ Customer** conversation
- `memberId` set, `customerId` null → **Business ↔ Employee** conversation
- both `customerId` and `memberId` set → **group chat**: Business + Employee + Customer together

Both fields are optional at the DB level, but application logic must ensure at least one of the
three shapes above holds when creating a conversation (i.e. never both null).

| Field       | Type    | Notes                                        |
|-------------|---------|----------------------------------------------|
| `id`        | String  | uuid, primary key                            |
| `jobId`     | String? | FK → `jobs.id`, unique — optional job link   |
| `businessId`| String  | FK → `businesses.id`                         |
| `customerId`| String? | FK → `customer_profiles.id` — set for Business↔Customer and group chats |
| `memberId`  | String? | FK → `business_members.id` — set for Business↔Employee and group chats  |

**Relations:**
- `business` → `Business`
- `customer` → `CustomerProfile?`
- `member` → `BusinessMember?`
- `job` → `Job?`
- `messages` → `Message[]`

**Indexes:** `businessId`, `customerId`, `memberId`

---

### Model: `Message` → table `messages`

A single message within a `Conversation`. Uses cursor-based pagination — always query ordered by `createdAt DESC` using the composite index.

| Field           | Type    | Notes                                  |
|-----------------|---------|----------------------------------------|
| `id`            | String  | uuid, primary key                      |
| `conversationId`| String  | FK → `conversations.id`, cascade delete|
| `senderId`      | String  | FK → `users.id`                        |
| `content`       | String  | `@db.Text` — no length limit           |
| `isRead`        | Boolean | default `false`                        |

**Indexes:** `(conversationId, createdAt DESC)` — for O(1) cursor-based pagination

---

### Model: `Favorite` → table `favorites`

A customer bookmarking a business ("tap to favorite" paw-fill interaction). One row per
customer/business pair.

| Field       | Type     | Notes                                |
|-------------|----------|---------------------------------------|
| `id`        | String   | uuid, primary key                    |
| `customerId`| String   | FK → `customer_profiles.id`, cascade delete |
| `businessId`| String   | FK → `businesses.id`, cascade delete |
| `createdAt` | DateTime | default now                          |

`@@unique([customerId, businessId])` — a customer can favorite a business only once.

**Indexes:** `businessId`

> **GraphQL/resolver status:** not yet exposed anywhere in `typeDefs.ts`.

---

## 10. GraphQL API (`/graphql`)

### Apollo Context

Every resolver receives (typed as `GraphQLContext` in `src/types/context.ts`):
```ts
{
  req: express.Request,        // raw Express request
  prisma: PrismaClient,        // shared DB client
  user: TokenPayload | null    // decoded JWT payload; null if unauthenticated
}
```

`TokenPayload` (from `src/utils/auth.ts`) contains: `userId`, `email`, `globalRole`.

> **Planned**: Context will also expose `activeBusinessId` and `activeRole` (tenant-scoped)
> once the business-selection flow is implemented.

### Resolver Registration Status

The GraphQL SDL in `typeDefs.ts` and the resolver map in `resolvers/index.ts` are expected to stay
in lockstep, but **currently do not** for the service domain. The root resolver map explicitly
spreads the user, business, customer, job, and review query and mutation barrels, so all declared
user/business/customer/job/review operations below are callable. `registerOwner` is registered only
as a mutation. The `job` domain currently exports no queries (only mutations) — there is no way yet
to list/look up jobs or bookings through GraphQL; every job mutation takes an ID supplied by the
caller. The `job` domain also registers **type-level** field resolvers (`Job`, `Booking`,
`BookingAddOn`) spread directly onto the root resolver map alongside `Query`/`Mutation`/`JSON` —
these back computed/gated fields (see `Job Resolver Behavior` below), not root operations.

> **Known gap:** `typeDefs.ts` declares a full CRUD surface for `ServiceOffering` and
> `ServiceOfferingAddOn` (5 queries/mutations each — see the tables below) and `validate.ts` has
> matching Zod schemas, but there is no `resolvers/service/` domain and `resolvers/index.ts` does
> not spread one. These SDL fields have zero backing resolver functions. Building the service
> domain (queries + mutations + barrel + wiring into `resolvers/index.ts`) per the §12 checklist
> is the next step before this feature is usable.

### Declared Queries

| Query         | Args            | Returns            | Auth Required | Location                               |
|---------------|-----------------|--------------------|---------------|----------------------------------------|
| `healthCheck` | none            | `String`           | No            | `resolvers/index.ts`                   |
| `getMe`       | none            | `User!`            | Yes (JWT)     | `resolvers/user/queries/getMe.ts`      |
| `getUserById` | `userId: ID!`   | `User!`            | Yes (JWT)     | `resolvers/user/queries/getUserById.ts`|
| `getMyBusinesses`   | none      | `[Business!]!`     | Yes (JWT)     | `resolvers/business/queries/getMyBusinesses.ts` — returns active memberships only |
| `getBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getBusinessMembers.ts` |
| `getInactiveBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getInactiveBusinessMembers.ts` |
| `getMyPets`   | none            | `[Pet!]!`          | Yes (JWT)     | `resolvers/customer/queries/getMyPets.ts` — returns only `isActive: true` pets scoped to the caller's `CustomerProfile` |
| `getBusinessReviews` | `businessId: ID!` | `[Review!]!` | No | `resolvers/review/queries/getBusinessReviews.ts` — public-profile data; returns only `isPublic: true` reviews, ordered by `createdAt` descending |
| `getServiceOffering` ⚠️ | `serviceOfferingId: ID!` | `ServiceOffering!` | — | **Declared in SDL only — no resolver file exists. Calling this will error/no-op.** |
| `getServiceOfferings` ⚠️ | `businessId: ID!` | `[ServiceOffering!]!` | — | **Declared in SDL only — no resolver file exists.** |
| `getServiceAddOn` ⚠️ | `serviceAddOnId: ID!` | `ServiceOfferingAddOn!` | — | **Declared in SDL only — no resolver file exists.** |
| `getServiceAddOns` ⚠️ | `serviceOfferingId: ID!` | `[ServiceOfferingAddOn!]!` | — | **Declared in SDL only — no resolver file exists.** |

### Declared Mutations

| Mutation            | Input                    | Returns            | Auth Required | Location                                          |
|---------------------|--------------------------|--------------------|---------------|---------------------------------------------------|
| `registerCustomer`  | `RegisterCustomerInput`  | `AuthPayload`      | No            | `resolvers/customer/mutations/registerCustomer.ts`|
| `registerOwner`     | `RegisterOwnerInput`     | `OwnerAuthPayload` | No            | `resolvers/owner/mutations/registerOwner.ts`      |
| `login`             | `LoginInput`             | `AuthPayload`      | No            | `resolvers/utils/mutations/login.ts`              |
| `inviteEmployee`    | `InviteInput`            | `Invitation`       | Yes (OWNER/MANAGER) | `resolvers/invitation/mutations/inviteEmployee.ts` — sends invitation email via `utils/email.ts` |
| `resendInvitation`  | `InviteInput`            | `Invitation`       | Yes (OWNER/MANAGER) | `resolvers/invitation/mutations/resendInvitation.ts` — regenerates token + resets expiry + re-sends email |
| `acceptInvitation`  | `AcceptInvitationInput`  | `AuthPayload`      | No            | `resolvers/invitation/mutations/acceptInvitation.ts` — two-path: creates User for new invitees; links a new existing account or reactivates a removed membership |
| `updateUser`        | `UpdateUserInput`        | `User!`            | Yes (JWT)     | `resolvers/user/mutations/updateUser.ts` — partial update; only provided fields written. The resolver has empty-value clearing branches, but current Zod validation rejects empty phone and avatar URL inputs. |
| `changePassword`    | `ChangePasswordInput`    | `User!`            | Yes (JWT)     | `resolvers/user/mutations/changePassword.ts` — verifies current password; rejects if new == current |
| `changeEmail`       | `ChangeEmailInput`       | `User!`            | Yes (JWT)     | `resolvers/user/mutations/changeEmail.ts` — confirms identity via password; checks uniqueness; normalizes to lowercase |
| `updateBusiness`    | `UpdateBusinessInput`    | `Business!`        | Yes (active OWNER/MANAGER) | `resolvers/business/mutations/updateBusiness.ts` |
| `deactivateBusiness`| `businessId: ID!`        | `Business!`        | Yes (active OWNER)   | `resolvers/business/mutations/deactivateBusiness.ts` |
| `removeMember`      | `RemoveMemberInput`      | `BusinessMember!`  | Yes (active OWNER/MANAGER) | `resolvers/business/mutations/removeMember.ts` — sets `isActive` to `false`; does not delete the row |
| `addPet`            | `AddPetInput`            | `Pet!`             | Yes (JWT + CustomerProfile) | `resolvers/customer/mutations/addPet.ts` — resolves the caller's `CustomerProfile` from the JWT, then creates the pet scoped to that `customerId` |
| `updatePet`         | `UpdatePetInput`         | `Pet!`             | Yes (JWT + pet ownership)  | `resolvers/customer/mutations/updatePet.ts` — returns 404 (NOT_FOUND) rather than FORBIDDEN if the `petId` belongs to another customer, to avoid confirming a pet ID exists cross-account |
| `deletePet`         | `petId: ID!`             | `Pet!`             | Yes (JWT + pet ownership)  | `resolvers/customer/mutations/deletePet.ts` — same 404-on-mismatch pattern as `updatePet`; sets `isActive` to `false` (soft delete), does not destroy the row |
| `createBooking`     | `CreateBookingInput`     | `Booking!`         | Yes (JWT + CustomerProfile) | `resolvers/job/mutations/createBooking.ts` — creates a `Booking` + one `Job` per session in a transaction; see `Job Resolver Behavior` below |
| `acceptJob`         | `jobId: ID!`             | `Job!`             | Yes (active OWNER/MANAGER) | `resolvers/job/mutations/acceptJob.ts` — `PENDING → ACCEPTED`; sets `acceptedAt` |
| `declineJob`        | `jobId: ID!`             | `Job!`             | Yes (active OWNER/MANAGER) | `resolvers/job/mutations/declineJob.ts` — `PENDING → DECLINED`; sets `declinedAt` |
| `assignSitter`      | `AssignSitterInput`      | `Job!`             | Yes (active OWNER/MANAGER) | `resolvers/job/mutations/assignSitter.ts` — `ACCEPTED → ASSIGNED`; sets `assigneeId` + `assignedAt` |
| `clockIn`           | `jobId: ID!`             | `Job!`             | Yes (assigned sitter only) | `resolvers/job/mutations/clockIn.ts` — `ASSIGNED → IN_PROGRESS`; sets `actualStartTime` |
| `clockOut`          | `jobId: ID!`             | `Job!`             | Yes (assigned sitter only) | `resolvers/job/mutations/clockOut.ts` — `IN_PROGRESS → COMPLETED`; sets `actualEndTime` |
| `completeJob`       | `jobId: ID!`             | `Job!`             | Yes (active OWNER/MANAGER) | `resolvers/job/mutations/completeJob.ts` — manual override, `ASSIGNED` or `IN_PROGRESS → COMPLETED`; backfills `actualStartTime` if clock-in never happened |
| `leaveReview`       | `LeaveReviewInput`       | `Review!`          | Yes (job owner + job `COMPLETED`) | `resolvers/review/mutations/leaveReview.ts` — one review per job (enforced via `Review.jobId` uniqueness + an explicit pre-check); recomputes and writes `Business.avgRating`/`reviewCount` in the same transaction — see `Review Resolver Behavior` below |
| `createServiceOffering` ⚠️ | `CreateServiceOfferingInput` | `ServiceOffering!` | — | **Declared in SDL only — no resolver file exists.** |
| `updateServiceOffering` ⚠️ | `UpdateServiceOfferingInput` | `ServiceOffering!` | — | **Declared in SDL only — no resolver file exists.** |
| `deleteServiceOffering` ⚠️ | `serviceOfferingId: ID!` | `ServiceOffering!` | — | **Declared in SDL only — no resolver file exists.** |
| `createServiceAddOn` ⚠️ | `CreateServiceAddOnInput` | `ServiceOfferingAddOn!` | — | **Declared in SDL only — no resolver file exists.** |
| `updateServiceAddOn` ⚠️ | `UpdateServiceAddOnInput` | `ServiceOfferingAddOn!` | — | **Declared in SDL only — no resolver file exists.** |
| `deleteServiceAddOn` ⚠️ | `serviceAddOnId: ID!` | `ServiceOfferingAddOn!` | — | **Declared in SDL only — no resolver file exists.** |

### GraphQL Input Types

| Input | Fields | Validation and behavior |
|-------|--------|-------------------------|
| `RegisterCustomerInput` | `email`, `password`, `firstName`, `lastName`, `phone?` | Creates a `User` with a `CustomerProfile`. Password must be at least 8 characters and include uppercase, numeric, and special characters. |
| `RegisterOwnerInput` | Customer fields plus `businessName`, `businessDescription?` | Creates the user, business, and OWNER membership atomically. |
| `LoginInput` | `email`, `password` | Email is trimmed and lowercased. |
| `InviteInput` | `email`, `role`, `businessId` | `role` must be `MANAGER` or `EMPLOYEE`; used for both initial and resent invitations. A resend keeps the existing invitation's role. |
| `AcceptInvitationInput` | `token`, `password?`, `firstName?`, `lastName?`, `phone?` | Profile fields are conditionally required only when the invitee does not already have an account. |
| `UpdateUserInput` | `firstName?`, `lastName?`, `phone?`, `avatarUrl?` | Requires at least one field. Phone must match the phone pattern and `avatarUrl` must be a URL. Although the resolver has empty-value clearing branches, current Zod validation rejects empty strings for these fields. |
| `ChangePasswordInput` | `currentPassword`, `newPassword` | New password must meet the registration password rules and differ from the current one. |
| `ChangeEmailInput` | `newEmail`, `password` | Confirms the password and normalizes the new email to lowercase. |
| `UpdateBusinessInput` | `businessId`, `name?`, `description?` | Requires a UUID business ID and at least one update field. Empty `description` clears the stored value. |
| `RemoveMemberInput` | `businessId`, `memberId` | Both IDs must be UUIDs; `memberId` identifies a `BusinessMember`, not a `User`. |
| `AddPetInput` | `name`, `type`, all other `Pet` fields optional | Zod schema (`addPetSchema`) in `validate.ts`. `name` and `type` (must be a valid `PetType` enum value) are required. All other fields are optional. |
| `UpdatePetInput` | `petId`, all other fields optional | Zod schema (`updatePetSchema`) in `validate.ts`. Partial update — only provided fields are written. An empty string on a clearable text field (`breed`, `medicalNotes`, etc.) clears it to `null`. `age`, `sex`, and `weightLb` accept explicit `null` to clear the value. |
| `BookingSessionInput` | `scheduledStartTime`, `scheduledEndTime` | Both required datetime strings; `scheduledEndTime` must be after `scheduledStartTime` (Zod `.refine()`). One `Job` is created per entry in `CreateBookingInput.sessions`. |
| `CreateBookingInput` | `businessId`, `serviceOfferingId`, `servicePackageId?`, `addOnIds?`, `petIds`, `sessions`, `specialInstructions?`, `accessCode?` | Zod schema (`createBookingSchema`) validates shapes/UUIDs; the resolver cross-checks against the DB that `sessions.length` matches the package's `sessionsCount` (or is exactly 1 for an ad-hoc booking with no package), that all `addOnIds` belong to the offering and are active, and that all `petIds` belong to the caller and are active. |
| `AssignSitterInput` | `jobId`, `assigneeId` | Both UUIDs. `assigneeId` is the `BusinessMember.id`, not the `User.id` — same convention as `RemoveMemberInput.memberId`. |
| `LeaveReviewInput` | `jobId`, `rating`, `comment?`, `tags?` | Zod schema (`leaveReviewSchema`) requires `rating` between 1–5. `businessId`/`customerId` are deliberately not accepted — both are derived from the job. `tags` defaults to `[]` if omitted. |
| `CreateServiceOfferingInput` | `businessId`, `title`, `description`, `durationMinutes` | Zod schema (`createServiceOfferingSchema`) exists in `validate.ts`; no resolver consumes it yet. |
| `UpdateServiceOfferingInput` | `serviceOfferingId`, `title?`, `description?`, `durationMinutes?`, `isActive?` | Zod schema (`updateServiceOfferingSchema`) requires a UUID id and at least one other field; no resolver consumes it yet. |
| `CreateServiceAddOnInput` | `serviceOfferingId`, `title`, `pricePerSession`, `perSession?` | Zod schema (`createServiceAddOnSchema`) requires a positive price with ≤2 decimal places; no resolver consumes it yet. |
| `UpdateServiceAddOnInput` | `serviceAddOnId`, `title?`, `pricePerSession?`, `perSession?`, `isActive?` | Zod schema (`updateServiceAddOnSchema`) requires a UUID id and at least one other field; no resolver consumes it yet. |

### GraphQL Object Types

| Type               | Fields                                      | Notes                                    |
|--------------------|---------------------------------------------|------------------------------------------|
| `User`             | `id, email, firstName, lastName, phone?, avatarUrl?, globalRole, createdAt` | User responses intentionally omit `passwordHash`. |
| `Business`         | `id, name, description?, isActive, createdAt` | The GraphQL type does not currently expose PostGIS location or `updatedAt`. |
| `AuthPayload`      | `token: String!, user: User!`               | Returned by `registerCustomer`, `login`, `acceptInvitation` |
| `OwnerAuthPayload` | `token: String!, user: User!, business: Business!` | Returned by `registerOwner`       |
| `Invitation`       | `id, email, role, expiresAt, isAccepted`    | Returned by `inviteEmployee`, `resendInvitation` |
| `BusinessMember`   | `id, role, isActive, joinedAt, user: User!` | Returned by `getBusinessMembers`, `removeMember` |
| `Pet`              | All `Pet` model fields including `isActive` | Returned by `getMyPets`, `addPet`, `updatePet`, `deletePet`. `weightLb` is `Float?`; the underlying Prisma `Decimal` must be converted with `Number()` in resolvers before returning. |
| `Job`              | Nearly all `Job` model fields | `price` and `tipAmount` are `Float`/`Float?` resolved via type-level field resolvers (`Number()` conversion from Prisma `Decimal`). `pets` is resolved lazily (a `Pet.findMany` keyed by the job, not an `include`). `accessCode` is resolved via a gated field resolver — see `Job Resolver Behavior` below; it is **not** a plain passthrough field. `status` is a raw `String!` (not a GraphQL enum) covering all seven `JobStatus` values including `DECLINED`. |
| `Booking`          | All `Booking` model fields, plus `jobs: [Job!]!` and `addOns: [BookingAddOn!]!` | `totalPrice` is `Float!` via a type-level resolver. `jobs` and `addOns` are both resolved lazily (separate queries keyed by `bookingId`), not via Prisma `include` — see `Job Resolver Behavior` below. Only returned today by `createBooking`; there is no query to look one up later. |
| `BookingAddOn`     | `id, priceAtBooking, addOn: ServiceOfferingAddOn!` | `priceAtBooking` is `Float!` via a type-level resolver (snapshotted add-on price at purchase time, independent of the add-on's current price). |
| `Review`           | All `Review` model fields | Returned by `leaveReview`, `getBusinessReviews`. No `customer`/`user` field — the reviewer's name isn't exposed anywhere on this type yet. |
| `ServiceOffering`  | `id, businessId, title, description, durationMinutes, isActive, addOns: [ServiceOfferingAddOn!]!` | Declared in SDL only — no resolver returns this type yet. Does not expose `packages` (the `ServicePackage[]` relation is not in the GraphQL schema at all). |
| `ServiceOfferingAddOn` | `id, serviceOfferingId, title, pricePerSession, perSession, isActive` | Declared in SDL only — no resolver returns this type yet. `pricePerSession` is `Float!`; the underlying Prisma field is `Decimal` and will need explicit `Number()` conversion in whatever resolver is written, since Decimal instances aren't natively serializable as a GraphQL Float. |

### `AcceptInvitationInput` — Two-Path Logic

`password`, `firstName`, and `lastName` are optional in the GraphQL schema and Zod schema.
The resolver enforces them **conditionally** after checking the invitation email:

| Scenario | Required fields | What the resolver does |
|----------|----------------|------------------------|
| **New user** (email has no account) | `token`, `password`, `firstName`, `lastName` | Creates `User` + `BusinessMember` in one transaction |
| **Existing user** (email already registered) | `token` only | Creates a membership, or reactivates the existing inactive membership; profile fields are ignored |

In both cases the invitation is marked `isAccepted: true` and a JWT is returned.
If the existing user is already an active member of that business, a `BAD_USER_INPUT` error is thrown.

### Business Resolver Behavior

The following handlers are implemented and registered through `resolvers/business/`.

- `getMyBusinesses` returns every business where the authenticated user has an active membership, ordered by `joinedAt` ascending.
- `getBusinessMembers` accepts any active business member role and returns active members with their user profile, ordered by `joinedAt` ascending.
- `getInactiveBusinessMembers` accepts any active business member role and returns inactive members with their user profile, ordered by `joinedAt` ascending.
- `updateBusiness` permits only an active OWNER or MANAGER of the target business. It applies a partial update and treats an empty description as `null`.
- `deactivateBusiness` is active-OWNER-only, rejects unknown or already inactive businesses, and performs a soft delete by setting `isActive` to `false`.
- `removeMember` permits active OWNERs to remove MANAGERs or EMPLOYEEs and active MANAGERs to remove EMPLOYEEs only. It rejects self-removal, removal of the OWNER, already inactive members, and members from another business. It retains the row and sets its `isActive` flag to `false`.

### Customer Resolver Behavior

The following handlers are implemented and registered through `resolvers/customer/`. All four resolvers first resolve the caller's `CustomerProfile` from the JWT `userId` and throw `UNAUTHENTICATED` if no profile exists.

- `getMyPets` returns all pets where `customerId` matches the caller's profile **and** `isActive` is `true`, ordered by `name` ascending (`Pet` has no `createdAt` field).
- `addPet` creates a new `Pet` row scoped to the caller's `customerId`. `name` and `type` are required; all other fields are optional.
- `updatePet` applies a partial update. Empty strings on clearable text fields (`breed`, `medicalNotes`, etc.) are coerced to `null`. Explicit `null` on `age`, `sex`, or `weightLb` clears those fields. Returns `NOT_FOUND` (not `FORBIDDEN`) when the `petId` does not belong to the caller — this deliberately avoids confirming whether a pet ID exists on another account.
- `deletePet` soft-deletes the pet by setting `isActive` to `false`. Same `NOT_FOUND`-on-mismatch security pattern as `updatePet`. The row is preserved for historical job references.

### Job Resolver Behavior

The following handlers are implemented and registered through `resolvers/job/`. There are no
listing/lookup queries yet (see the known gap above) — every mutation here is given a `jobId` (or
IDs) by the caller; nothing generates or discovers them server-side beyond `createBooking`.

**`createBooking`** — the only entry point that creates `Job` rows. Resolves the caller's
`CustomerProfile`, then validates against the DB (not just Zod): the `Business` and
`ServiceOffering` exist and are active; if `servicePackageId` is given, it belongs to that offering,
is active, and `sessions.length` equals its `sessionsCount`; if omitted, exactly one session is
required and the offering's `basePrice` must be set (errors otherwise — "choose a package"); every
`addOnId` belongs to the offering and is active; every `petId` belongs to the caller and is active.
Pricing: `totalPrice = pricePerSession × sessionCount + Σ(addOn total) + business.serviceFeeAmount`,
where each add-on's total is `pricePerSession × sessionCount` if `perSession` is `true`, else a flat
`pricePerSession` once. Creates the `Booking`, its `BookingAddOn` rows (snapshotting each add-on's
current price into `priceAtBooking`), and one `Job` per session — all in a single `$transaction`.
Every `Job.price` is set to the plain per-session rate; add-ons and the service fee live only on
`Booking.totalPrice`, not attributed to an individual session. `sessionNumber`/`totalSessions` are
only set (non-null) when the booking has more than one session.

**Job status is a server-enforced state machine** — every transition mutation re-reads the job's
current `status` from the DB and rejects the call with `BAD_USER_INPUT` if it doesn't match the
required starting state. Valid transitions:

```
PENDING ──acceptJob──► ACCEPTED ──assignSitter──► ASSIGNED ──clockIn──► IN_PROGRESS ──clockOut──► COMPLETED
   │                                                  │
   └──declineJob──► DECLINED                          └──completeJob──► COMPLETED  (manual override)
```

- `acceptJob` / `declineJob`: caller must be an active `OWNER`/`MANAGER` of the job's business. Set `acceptedAt`/`declinedAt` respectively.
- `assignSitter`: caller must be an active `OWNER`/`MANAGER`. Validates `assigneeId` is an active `BusinessMember` of the **same** business as the job. Sets `assigneeId` + `assignedAt`.
- `clockIn` / `clockOut`: caller must be the job's assigned sitter specifically — resolved by looking up the `BusinessMember` row at `job.assigneeId` and checking its `userId` matches the caller, not just any active member of the business. Set `actualStartTime`/`actualEndTime` respectively; `clockOut` also completes the job.
- `completeJob`: caller must be an active `OWNER`/`MANAGER`. An escape hatch for when clock-in/out wasn't used — allowed from either `ASSIGNED` or `IN_PROGRESS`, and backfills `actualStartTime` with the current time if it was never set, so reporting never sees a completed job with no start time.

**Sensitive and Decimal-backed fields go through type-level field resolvers**, not plain schema
fields, defined in `job/jobResolvers.ts` and spread onto the root resolver map's `Job`/`Booking`/
`BookingAddOn` keys (alongside `Query`/`Mutation`/`JSON` in `resolvers/index.ts`) — this applies
regardless of which query or mutation returned the object:
- `Job.accessCode` resolves to the real value only if the caller is an active `OWNER`/`MANAGER` of the job's business, or the `BusinessMember` matching `job.assigneeId` — otherwise `null`. It performs its own `businessMember` lookup per call, independent of whatever authorization already ran in the parent mutation.
- `Job.price`, `Job.tipAmount`, `Booking.totalPrice`, `BookingAddOn.priceAtBooking` convert Prisma `Decimal` to `Number` before they reach the GraphQL `Float` scalar (see the `ServiceOfferingAddOn` warning above — Decimal instances are not natively serializable there).
- `Job.pets`, `Booking.jobs`, `Booking.addOns` are resolved lazily via their own Prisma queries keyed off the parent's `id` — mutations that return a `Job`/`Booking` do not `include` these relations, so they're only fetched when a client actually asks for them.

### Review Resolver Behavior

The following handlers are implemented and registered through `resolvers/review/`.

- `leaveReview` resolves the caller's `CustomerProfile`, then loads the target `Job` and checks, in order: the job's `customerId` matches the caller (`FORBIDDEN` otherwise — you can only review jobs you booked), the job's `status` is `COMPLETED` (`BAD_USER_INPUT` otherwise), and no `Review` already exists for that `jobId` (`BAD_USER_INPUT` — this is also enforced at the DB level by `Review.jobId` being `@unique`, but the resolver checks first to give a clean error instead of surfacing a raw constraint violation). `businessId`/`customerId` on the created row come from the job/caller, never from client input.
- **Aggregate sync**: in the same `$transaction` as the `Review` insert, `leaveReview` runs `review.aggregate({ where: { businessId, isPublic: true }, _avg: { rating: true }, _count: true })` and writes the result straight to `Business.avgRating`/`reviewCount`. This recomputes from scratch rather than incrementing a running average — same "derive, don't mutate in place" philosophy as the financial ledger (§11) — so there's no drift risk from repeated incremental arithmetic. This is the **only** place that writes `Business.avgRating`/`reviewCount`; anything that later adds `updateReview`/`deleteReview` must repeat this same recompute-and-write or the aggregate will go stale (see the note on `Business.avgRating` in §9).
- `getBusinessReviews` requires no authentication (it's public-profile data) and returns only `isPublic: true` reviews for the given `businessId`, ordered by `createdAt` descending. It 404s if the business itself doesn't exist, but does not check `Business.isActive`.

### Scalar Types

| Scalar | Package             | Purpose                      |
|--------|---------------------|------------------------------|
| `JSON` | `graphql-type-json` | Allows arbitrary JSON fields |

---

## 11. Architecture Notes

### Multi-Tenancy
- Uses **Shared Database with Tenant ID** — all businesses share the same tables, scoped by `businessId`
- Every resolver that reads business data **must** filter by `businessId` — never return cross-tenant data
- Roles are **tenant-scoped** via `BusinessMember.role`, not global — a user can be `OWNER` of Business A and `EMPLOYEE` of Business B

- Membership authorization must also require `BusinessMember.isActive`; a soft-removed member retains history but has no business access.

### Auth Flow
- JWT tokens are signed by `signToken()` in `src/utils/auth.ts` (default expiry: `1d`, overridable via `JWT_EXPIRES_IN` env var)
- `verifyToken()` returns `null` on invalid/expired tokens rather than throwing — resolvers treat a `null` `context.user` as unauthenticated
- Protected resolvers should throw a `GraphQLError` with `UNAUTHENTICATED` code when `context.user` is `null`

### Input Validation (Zod)
- All mutation inputs are validated via schemas in `src/utils/validate.ts` using `.safeParse()`
- Use `formatZodError()` to convert `ZodError` into a single comma-separated string for GraphQL error messages
- Data-layer constraint enforcement (e.g., single `customerId`/`memberId` on `Conversation`) will also be handled by Zod schemas when those mutations are built

### Geospatial Search
- Business and CustomerProfile locations stored as PostGIS `geometry(Point, 4326)`
- Use `ST_DWithin` for radius filtering and `<->` operator for nearest-neighbor sorting
- Raw SQL via `prisma.$queryRaw` is required for PostGIS queries — Prisma does not generate PostGIS helpers

### Financial Ledger
- **Never** update a balance in place — always append a new `LedgerEntry`
- Derive current balance from `findFirst({ orderBy: { createdAt: 'desc' } }).balanceAfter`
- Wrap all payment operations in `prisma.$transaction({ isolationLevel: Serializable })` with retry logic

### Planned, Not Yet Designed

These are confirmed product directions with no schema or resolver work started — don't assume any
of the following exists until this section is updated:

- **Customer payments**: Stripe is the planned processor for charging customers (saved cards,
  charge-on-acceptance, tips, refunds). No `PaymentMethod`/`Charge` model or Stripe integration
  exists yet; `LedgerEntry` today only tracks business-side bookkeeping, not the customer payment
  instrument itself.
- **Business subscription billing**: a tiered plan system for businesses (see the `2g` "Billing &
  payment" screen — Growth $89/mo, staff limits) is planned but undesigned; whether plan/tier data
  lives in this schema or is delegated entirely to a billing provider (e.g. Stripe Billing) is not
  yet decided.
- **Sitter payouts**: earnings are calculated **per completed job** (a sitter's cut of that job's
  price), not a flat percentage or salary. There is no payout model yet — `LedgerEntry` is
  business-scoped only, with no `BusinessMember`-scoped equivalent. Design the payout ledger when
  this is built, following the same append-only philosophy as `LedgerEntry`.

---

## 12. Adding New Features — Conventions

### New GraphQL Query or Mutation
1. Add the type/input/return type to `src/graphQL/typeDefs.ts`
2. Add a Zod schema for the input to `src/utils/validate.ts`
3. Add TypeScript input interface to the appropriate file in `src/types/`
4. Create the resolver in the appropriate domain folder under `src/graphQL/resolvers/<domain>/queries/` or `.../mutations/`
5. Export it from the domain's `*Resolvers.ts` barrel file
6. Import the domain barrel and spread the new `Query` and/or `Mutation` map in `resolvers/index.ts`; verify every SDL field has a matching registered resolver
7. Update this manifest

### New Resolver Domain
1. Create `src/graphQL/resolvers/<domain>/` with `<domain>Resolvers.ts`, `queries/`, and `mutations/` subdirs
2. Import and spread the new barrel in `resolvers/index.ts`
3. Update this manifest

### New REST Route
1. Add handler in `src/server.ts` before the `/graphql` middleware
2. Update this manifest

### New Prisma Model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Run `npx prisma generate`
4. Update this manifest

---

## 13. Key Commands (Quick Reference)

```bash
# Start Docker
sudo service docker start

# Start the database (Docker)
docker compose up -d

# Stop the database
docker compose down

# Start dev server (auto-reloads)
npm run dev

# Type-check and compile TypeScript to backend/dist/
npm run build

# Create a new migration after schema changes
npx prisma migrate dev --name <description>

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Check health
curl http://localhost:4000/health
```
