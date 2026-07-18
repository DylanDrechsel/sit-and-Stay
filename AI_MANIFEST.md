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
    │   │   ├── booking.ts         # Booking/Job lifecycle inputs, job listing query inputs, Job/Booking parent shapes
    │   │   ├── business.ts        # UpdateBusinessInput, RemoveMemberInput, GetNearbyBusinessesInput, SetBusinessLocationInput, BusinessParent
    │   │   ├── context.ts         # GraphQLContext interface
    │   │   ├── customer.ts        # CustomerProfileParent
    │   │   ├── invitation.ts      # InviteInput, AcceptInvitationInput, InvitationEmailPayload
    │   │   ├── jobActivity.ts     # PostJobUpdateInput, SubmitReportCardInput
    │   │   ├── pet.ts             # AddPetInput, UpdatePetInput
    │   │   ├── registration.ts    # RegisterCustomerInput, RegisterOwnerInput
    │   │   ├── review.ts          # LeaveReviewInput
    │   │   ├── service.ts         # service CRUD inputs + ServiceOffering/AddOn/Package parent shapes
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
    │           │   ├── jobAccess.ts      # assertJobViewAccess — shared view-permission check for job reads
    │           │   ├── queries/
    │           │   │   ├── getAvailableEmployees.ts
    │           │   │   ├── getMyBookings.ts
    │           │   │   ├── getBusinessJobs.ts
    │           │   │   ├── getMyJobs.ts
    │           │   │   ├── getJob.ts
    │           │   │   └── getJobUpdates.ts
    │           │   └── mutations/
    │           │       ├── createBooking.ts
    │           │       ├── acceptJob.ts
    │           │       ├── declineJob.ts
    │           │       ├── assignSitter.ts
    │           │       ├── clockIn.ts
    │           │       ├── clockOut.ts
    │           │       ├── completeJob.ts
    │           │       ├── postJobUpdate.ts
    │           │       └── submitReportCard.ts
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
    │           │   ├── businessResolvers.ts   # also exports a Business type-level field map
    │           │   ├── queries/
    │           │   │   ├── getBusinessMembers.ts
    │           │   │   ├── getInactiveBusinessMembers.ts
    │           │   │   ├── getMyBusinesses.ts
    │           │   │   └── getNearbyBusinesses.ts   # PostGIS $queryRaw
    │           │   └── mutations/
    │           │       ├── deactivateBusiness.ts
    │           │       ├── removeMember.ts
    │           │       ├── setBusinessLocation.ts   # $executeRaw — Prisma can't write Unsupported columns
    │           │       └── updateBusiness.ts
    │           ├── review/
    │           │   ├── reviewResolvers.ts
    │           │   ├── queries/
    │           │   │   └── getBusinessReviews.ts
    │           │   └── mutations/
    │           │       └── leaveReview.ts
    │           ├── service/
    │           │   ├── serviceResolvers.ts
    │           │   ├── serviceAccess.ts   # requireBusinessManager (writes), isActiveMember (member-vs-public reads)
    │           │   ├── queries/
    │           │   │   ├── getServiceOffering.ts
    │           │   │   ├── getServiceOfferings.ts
    │           │   │   ├── getServiceAddOn.ts
    │           │   │   ├── getServiceAddOns.ts
    │           │   │   └── getServicePackages.ts
    │           │   └── mutations/
    │           │       ├── createServiceOffering.ts
    │           │       ├── updateServiceOffering.ts
    │           │       ├── deleteServiceOffering.ts
    │           │       ├── createServiceAddOn.ts
    │           │       ├── updateServiceAddOn.ts
    │           │       ├── deleteServiceAddOn.ts
    │           │       ├── createServicePackage.ts
    │           │       ├── updateServicePackage.ts
    │           │       └── deleteServicePackage.ts
    │           └── utils/
    │               ├── utilsResolvers.ts
    │               └── mutations/
    │                   └── login.ts
    ├── .env                       # Environment variables (never committed)
    ├── package.json
    └── tsconfig.json
```

> **Convention**: Each domain folder (`owner/`, `customer/`, `job/`, `invitation/`, `user/`,
> `business/`, `review/`, `service/`, `utils/`) contains a `*Resolvers.ts` barrel file that groups
> its `Query` and `Mutation` maps. The root `resolvers/index.ts` must explicitly import and spread
> each barrel; adding a domain folder alone does not expose its fields through GraphQL. Several
> barrels also export **type-level field maps** (`job` → `Job`/`Booking`/`BookingAddOn`, `business`
> → `Business`, `customer` → `CustomerProfile`, `service` → `ServiceOffering`/
> `ServiceOfferingAddOn`) — `resolvers/index.ts` attaches those directly as top-level keys alongside
> `Query`/`Mutation`/`JSON`, not inside either of them.

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

### Model: `Business` → table `"Business"`

> **Correction:** this section previously said `→ table businesses` (snake_case, pluralized). No
> `@@map`/`@map` directives exist anywhere in `schema.prisma`, so Prisma uses the model name as-is
> for every table and column — verified directly against `migration.sql`
> (`CREATE TABLE "Business" (...)`, with columns like `"isActive"`, `"heroPhotoUrl"`, not snake_case).
> This was discovered while writing `getNearbyBusinesses`' raw SQL (§10) — getting the table name
> wrong there wouldn't have been a docs nit, it would have been a broken query. Only this model's
> header is fixed here; every other `### Model:` heading in this section likely has the same
> `→ table snake_case_name` inaccuracy and hasn't been individually re-verified — don't trust those
> headings for table/column names in raw SQL. Verify against `migration.sql` or a running
> `\d "TableName"` instead.

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

> **GraphQL/resolver status:** the `Business` GraphQL type exposes every scalar field above except
> `location` (there's no natural GraphQL scalar for a PostGIS geometry, and clients get a computed
> `distanceMiles` instead — see `getNearbyBusinesses` in §10). `avgRating`/`serviceFeeAmount` go
> through a type-level `Business` field resolver (`resolvers/business/businessResolvers.ts`) for
> Decimal→Number conversion — shared across every Business-returning operation, not just
> `getNearbyBusinesses`, since `getMyBusinesses`/`updateBusiness`/`deactivateBusiness`/`registerOwner`
> all return this same type. Until this feature, the `Business` GraphQL type only exposed
> `id, name, description, isActive, createdAt` — the rest of this table (`isVerified`,
> `heroPhotoUrl`, `addressLine`, `city`, `neighborhood`, `serviceFeeAmount`, `avgRating`,
> `reviewCount`) was added specifically because the discovery UI needs them.
>
> **`location` itself is write-only via `setBusinessLocation`** (`resolvers/business/mutations/
> setBusinessLocation.ts`), the only mutation in the app that touches this column. Nothing else
> ever sets it — not `registerOwner`, not `updateBusiness` — so a business created through normal
> signup starts with `location: NULL` and is invisible to `getNearbyBusinesses` until this mutation
> is called. There's no geocoding integration (an address like `addressLine`/`city` is never turned
> into a `location` automatically); the caller must supply raw lat/lng. See `Business Resolver
> Behavior` below for why this had to be `$executeRaw` rather than a normal Prisma `update()`.

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

### Model: `ServiceOffering` → table `"ServiceOffering"`

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

> **GraphQL/resolver status:** full CRUD implemented in `resolvers/service/`
> (`getServiceOffering(s)`, `create`/`update`/`deleteServiceOffering`). Writes are OWNER/MANAGER
> only (`requireBusinessManager` in `service/serviceAccess.ts`); reads use a member-vs-public
> visibility split (`isActiveMember` in the same file) — see `Service Resolver Behavior` in §10 for
> both. `basePrice` goes through a type-level `Number()` conversion; `addOns`/`packages` resolve
> lazily and apply the same visibility split as their dedicated queries, so a nested
> `serviceOffering { addOns { ... } }` selection can't leak inactive rows to the public.

---

### Model: `ServicePackage` → table `"ServicePackage"`

A priced tier for a `ServiceOffering` (e.g., "Single Session" vs "4 Session Package").

| Field               | Type    | Notes                                          |
|---------------------|---------|-------------------------------------------------|
| `id`                | String  | uuid, primary key                                |
| `serviceOfferingId` | String  | FK → `service_offerings.id`, cascade delete      |
| `title`             | String  | e.g., "Single Session"                           |
| `sessionsCount`     | Int     | default `1`                                      |
| `pricePerSession`   | Decimal | USD, precision `(10,2)`                          |
| `isActive`          | Boolean | default `true`                                   |

> **GraphQL/resolver status:** full CRUD implemented in `resolvers/service/` — this model went
> from zero GraphQL surface straight to complete CRUD in one pass (previously "only reachable via
> `registerOwner.ts`'s seed data"). `getServicePackages(serviceOfferingId)` and
> `create`/`update`/`deleteServicePackage` follow the exact same permission/visibility pattern as
> `ServiceOfferingAddOn` below. Also reachable nested via `ServiceOffering.packages` (lazy,
> same visibility filter). `pricePerSession` goes through a type-level `Number()` conversion.

---

### Model: `ServiceOfferingAddOn` → table `"ServiceOfferingAddOn"`

An optional extra charge attached to a `ServiceOffering` (e.g., "Additional Dog").

| Field               | Type    | Notes                                          |
|---------------------|---------|-------------------------------------------------|
| `id`                | String  | uuid, primary key                                |
| `serviceOfferingId` | String  | FK → `service_offerings.id`, cascade delete      |
| `title`             | String  | e.g., "Additional Dog"                           |
| `pricePerSession`   | Decimal | USD, precision `(10,2)`                          |
| `perSession`        | Boolean | default `true` — whether the charge is per session or flat |
| `isActive`          | Boolean | default `true`                                   |

> **GraphQL/resolver status:** full CRUD implemented in `resolvers/service/`
> (`getServiceAddOn(s)`, `create`/`update`/`deleteServiceAddOn`) — see `Service Resolver Behavior`
> in §10. `pricePerSession` goes through a type-level `Number()` conversion.

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

> **GraphQL/resolver status:** created by `createBooking` (`resolvers/job/mutations/createBooking.ts`)
> and listed by `getMyBookings` (customer's bookings, newest first). Returned as the `Booking`
> GraphQL type; `jobs` and `addOns` are resolved lazily via type-level field resolvers rather than
> a Prisma `include` — see `Job Resolver Behavior` in §10. There is still no single-booking lookup
> by id and no business-side booking list (owners see per-session `Job`s via `getBusinessJobs`).

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

> **GraphQL/resolver status:** not exposed as its own type or CRUD surface — there is no
> `createAvailability`/`setAvailability` mutation yet, so rows must currently be created directly
> (e.g. via Prisma Studio) for `getAvailableEmployees` (§10, `resolvers/job/queries/`) to have
> anything to read. That query consumes this model read-only: for a given job, it checks each
> business member's row for the job's day of week (no row = not available) against the job's
> scheduled time-of-day window, then separately checks for overlapping `ASSIGNED`/`IN_PROGRESS`
> jobs already on that member. See `Job Resolver Behavior` in §10 for the full algorithm and its
> known limitation (multi-day jobs like boarding are only checked against `scheduledStartTime`'s
> single day).

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
> `declineJob`, `assignSitter`, `clockIn`, `clockOut`, `completeJob` (`resolvers/job/mutations/`);
> read via `getJob`, `getBusinessJobs`, `getMyJobs` (see `Job Resolver Behavior` in §10 for both
> the status state machine and the read-side access rules). The GraphQL `Job` type exposes lazy
> `customer`/`service`/`assignee`/`pets` relations for display; `updates` are fetched via the
> separate `getJobUpdates` query (not a `Job.updates` field), and `review`/`reportCard`/
> `conversation` are not exposed on the type at all — `conversation` still has no resolvers
> anywhere.

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

> **GraphQL/resolver status:** created via `postJobUpdate` (`resolvers/job/mutations/postJobUpdate.ts`);
> read via `getJobUpdates(jobId, limit, before)` (`resolvers/job/queries/getJobUpdates.ts`), which
> pages through the `(jobId, createdAt desc)` index exactly as designed — newest first, `before` as
> a `createdAt` cursor. Posting is assigned-sitter-only while `IN_PROGRESS`; reading uses the shared
> `assertJobViewAccess` rule (customer / assigned sitter / OWNER-MANAGER).

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

> **GraphQL/resolver status:** created via `submitReportCard`
> (`resolvers/job/mutations/submitReportCard.ts`). Only the job's assigned sitter may submit, only
> once per job (mirrors `leaveReview`'s one-per-completed-job pattern, including checking first for
> a friendlier error before the DB's `@unique` constraint on `jobId` would reject it), and only after
> `Job.status` is `COMPLETED`. No listing/lookup query exists yet.

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

The GraphQL SDL in `typeDefs.ts` and the resolver map in `resolvers/index.ts` are expected to stay,
and currently do stay, in lockstep — every domain's barrel is spread into the root map: user,
business, customer, job, review, and service all contribute `Query` fields; invitation, owner,
customer, utils, user, business, job, review, and service all contribute `Mutation` fields.
`registerOwner` is registered only as a mutation. The job domain has a full read side —
`getMyBookings`, `getBusinessJobs`, `getMyJobs`, `getJob`, `getJobUpdates`, plus
`getAvailableEmployees` — so jobs and bookings are discoverable through GraphQL, not just mutable
by ID. The service domain has full CRUD for `ServiceOffering`, `ServiceOfferingAddOn`, and
`ServicePackage` — see `Service Resolver Behavior` below for its member-vs-public read visibility
rule, which is the one non-obvious thing about it. Several domains also register **type-level**
field resolvers (`Job`, `Booking`, `BookingAddOn`, `Business`, `CustomerProfile`,
`ServiceOffering`, `ServiceOfferingAddOn`, `ServicePackage`) spread directly onto the root resolver
map alongside `Query`/`Mutation`/`JSON` — these back computed/gated/lazy fields (see the per-domain
behavior sections below), not root operations.

### Declared Queries

| Query         | Args            | Returns            | Auth Required | Location                               |
|---------------|-----------------|--------------------|---------------|----------------------------------------|
| `healthCheck` | none            | `String`           | No            | `resolvers/index.ts`                   |
| `getMe`       | none            | `User!`            | Yes (JWT)     | `resolvers/user/queries/getMe.ts`      |
| `getUserById` | `userId: ID!`   | `User!`            | Yes (JWT)     | `resolvers/user/queries/getUserById.ts`|
| `getMyBusinesses`   | none      | `[Business!]!`     | Yes (JWT)     | `resolvers/business/queries/getMyBusinesses.ts` — returns active memberships only |
| `getBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getBusinessMembers.ts` |
| `getInactiveBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getInactiveBusinessMembers.ts` |
| `getNearbyBusinesses` | `latitude: Float!, longitude: Float!, radiusMiles: Float, category: String, search: String, limit: Int` | `[NearbyBusiness!]!` | No | `resolvers/business/queries/getNearbyBusinesses.ts` — PostGIS `$queryRaw`; see `Business Resolver Behavior` below |
| `getMyPets`   | none            | `[Pet!]!`          | Yes (JWT)     | `resolvers/customer/queries/getMyPets.ts` — returns only `isActive: true` pets scoped to the caller's `CustomerProfile` |
| `getBusinessReviews` | `businessId: ID!` | `[Review!]!` | No | `resolvers/review/queries/getBusinessReviews.ts` — public-profile data; returns only `isPublic: true` reviews, ordered by `createdAt` descending |
| `getAvailableEmployees` | `jobId: ID!` | `[EmployeeAvailabilityStatus!]!` | Yes (active OWNER/MANAGER) | `resolvers/job/queries/getAvailableEmployees.ts` — see `Job Resolver Behavior` below for the availability + conflict-check algorithm |
| `getMyBookings` | none | `[Booking!]!` | Yes (JWT + CustomerProfile) | `resolvers/job/queries/getMyBookings.ts` — caller's bookings, newest first; per-session detail via the lazy `Booking.jobs` field |
| `getBusinessJobs` | `businessId: ID!, statuses: [String!], from: String, to: String` | `[Job!]!` | Yes (active OWNER/MANAGER) | `resolvers/job/queries/getBusinessJobs.ts` — dashboard/requests/schedule views; `statuses` filters, `from`/`to` bound `scheduledStartTime`; ordered by `scheduledStartTime` asc |
| `getMyJobs` | `statuses: [String!], from: String, to: String` | `[Job!]!` | Yes (JWT) | `resolvers/job/queries/getMyJobs.ts` — jobs assigned to the caller across all their **active** memberships (deactivated membership = excluded); same filters as `getBusinessJobs` |
| `getJob` | `jobId: ID!` | `Job!` | Yes (job's customer, assigned sitter, or active OWNER/MANAGER) | `resolvers/job/queries/getJob.ts` — access via shared `assertJobViewAccess` (`job/jobAccess.ts`) |
| `getJobUpdates` | `jobId: ID!, limit: Int, before: String` | `[JobUpdate!]!` | Yes (same access as `getJob`) | `resolvers/job/queries/getJobUpdates.ts` — newest first; `before` is a `createdAt` cursor (pass the oldest you have for the next page); `limit` defaults 50, max 100 |
| `getServiceOffering` | `serviceOfferingId: ID!` | `ServiceOffering!` | Member-vs-public (see `Service Resolver Behavior`) | `resolvers/service/queries/getServiceOffering.ts` |
| `getServiceOfferings` | `businessId: ID!` | `[ServiceOffering!]!` | Member-vs-public | `resolvers/service/queries/getServiceOfferings.ts` |
| `getServiceAddOn` | `serviceAddOnId: ID!` | `ServiceOfferingAddOn!` | Member-vs-public | `resolvers/service/queries/getServiceAddOn.ts` |
| `getServiceAddOns` | `serviceOfferingId: ID!` | `[ServiceOfferingAddOn!]!` | Member-vs-public | `resolvers/service/queries/getServiceAddOns.ts` |
| `getServicePackages` | `serviceOfferingId: ID!` | `[ServicePackage!]!` | Member-vs-public | `resolvers/service/queries/getServicePackages.ts` |

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
| `setBusinessLocation` | `SetBusinessLocationInput` | `Business!`   | Yes (active OWNER/MANAGER) | `resolvers/business/mutations/setBusinessLocation.ts` — the only mutation that writes `Business.location`; uses `$executeRaw` since Prisma can't write `Unsupported` columns via `update()` |
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
| `postJobUpdate`     | `PostJobUpdateInput`     | `JobUpdate!`       | Yes (assigned sitter only, job `IN_PROGRESS`) | `resolvers/job/mutations/postJobUpdate.ts` — at least one of `note`/`photoUrl` required |
| `submitReportCard`  | `SubmitReportCardInput`  | `ReportCard!`      | Yes (assigned sitter only, job `COMPLETED`) | `resolvers/job/mutations/submitReportCard.ts` — one report card per job |
| `createServiceOffering` | `CreateServiceOfferingInput` | `ServiceOffering!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/createServiceOffering.ts` — created active by default (unlike `registerOwner`'s seed offerings) |
| `updateServiceOffering` | `UpdateServiceOfferingInput` | `ServiceOffering!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/updateServiceOffering.ts` — partial update; `category`/`basePrice` accept explicit `null` to clear |
| `deleteServiceOffering` | `serviceOfferingId: ID!` | `ServiceOffering!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/deleteServiceOffering.ts` — soft delete; does not touch its packages/add-ons |
| `createServiceAddOn` | `CreateServiceAddOnInput` | `ServiceOfferingAddOn!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/createServiceAddOn.ts` |
| `updateServiceAddOn` | `UpdateServiceAddOnInput` | `ServiceOfferingAddOn!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/updateServiceAddOn.ts` — partial update |
| `deleteServiceAddOn` | `serviceAddOnId: ID!` | `ServiceOfferingAddOn!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/deleteServiceAddOn.ts` — soft delete |
| `createServicePackage` | `CreateServicePackageInput` | `ServicePackage!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/createServicePackage.ts` — `sessionsCount` defaults to `1` when omitted |
| `updateServicePackage` | `UpdateServicePackageInput` | `ServicePackage!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/updateServicePackage.ts` — partial update |
| `deleteServicePackage` | `servicePackageId: ID!` | `ServicePackage!` | Yes (active OWNER/MANAGER) | `resolvers/service/mutations/deleteServicePackage.ts` — soft delete |

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
| `SetBusinessLocationInput` | `businessId`, `latitude`, `longitude` | Zod schema (`setBusinessLocationSchema`) reuses the same lat/lng bounds as `getNearbyBusinessesSchema`. |
| `RemoveMemberInput` | `businessId`, `memberId` | Both IDs must be UUIDs; `memberId` identifies a `BusinessMember`, not a `User`. |
| `AddPetInput` | `name`, `type`, all other `Pet` fields optional | Zod schema (`addPetSchema`) in `validate.ts`. `name` and `type` (must be a valid `PetType` enum value) are required. All other fields are optional. |
| `UpdatePetInput` | `petId`, all other fields optional | Zod schema (`updatePetSchema`) in `validate.ts`. Partial update — only provided fields are written. An empty string on a clearable text field (`breed`, `medicalNotes`, etc.) clears it to `null`. `age`, `sex`, and `weightLb` accept explicit `null` to clear the value. |
| `BookingSessionInput` | `scheduledStartTime`, `scheduledEndTime` | Both required datetime strings; `scheduledEndTime` must be after `scheduledStartTime` (Zod `.refine()`). One `Job` is created per entry in `CreateBookingInput.sessions`. |
| `CreateBookingInput` | `businessId`, `serviceOfferingId`, `servicePackageId?`, `addOnIds?`, `petIds`, `sessions`, `specialInstructions?`, `accessCode?` | Zod schema (`createBookingSchema`) validates shapes/UUIDs; the resolver cross-checks against the DB that `sessions.length` matches the package's `sessionsCount` (or is exactly 1 for an ad-hoc booking with no package), that all `addOnIds` belong to the offering and are active, and that all `petIds` belong to the caller and are active. |
| `AssignSitterInput` | `jobId`, `assigneeId` | Both UUIDs. `assigneeId` is the `BusinessMember.id`, not the `User.id` — same convention as `RemoveMemberInput.memberId`. |
| `LeaveReviewInput` | `jobId`, `rating`, `comment?`, `tags?` | Zod schema (`leaveReviewSchema`) requires `rating` between 1–5. `businessId`/`customerId` are deliberately not accepted — both are derived from the job. `tags` defaults to `[]` if omitted. |
| `PostJobUpdateInput` | `jobId`, `note?`, `photoUrl?` | Zod schema (`postJobUpdateSchema`) requires at least one of `note`/`photoUrl` (object-level `.refine()`). |
| `SubmitReportCardInput` | `jobId`, all other fields optional | Zod schema (`submitReportCardSchema`). `mood` must be a valid `PetMood` enum value if provided; omitted fields fall back to the model's Prisma defaults (`peeCount`/`poopCount` → `0`, the boolean flags → `false`). |
| `CreateServiceOfferingInput` | `businessId`, `title`, `description`, `durationMinutes`, `category?`, `basePrice?`, `features?` | Zod schema (`createServiceOfferingSchema`). `category` must be a valid `ServiceCategory`; `basePrice` a positive price with ≤2 decimal places; `features` capped at 10 entries. |
| `UpdateServiceOfferingInput` | `serviceOfferingId`, all other fields optional | Zod schema (`updateServiceOfferingSchema`) requires a UUID id and at least one other field. `category`/`basePrice` accept explicit `null` to clear; `features`, when provided, replaces the whole array. |
| `CreateServiceAddOnInput` | `serviceOfferingId`, `title`, `pricePerSession`, `perSession?` | Zod schema (`createServiceAddOnSchema`) requires a positive price with ≤2 decimal places. |
| `UpdateServiceAddOnInput` | `serviceAddOnId`, `title?`, `pricePerSession?`, `perSession?`, `isActive?` | Zod schema (`updateServiceAddOnSchema`) requires a UUID id and at least one other field. |
| `CreateServicePackageInput` | `serviceOfferingId`, `title`, `sessionsCount?`, `pricePerSession` | Zod schema (`createServicePackageSchema`). `sessionsCount` defaults to `1` and caps at `52` — matching `createBookingSchema`'s `sessions` ceiling, since a package no booking could ever fulfill would be a mistake. |
| `UpdateServicePackageInput` | `servicePackageId`, all other fields optional | Zod schema (`updateServicePackageSchema`) requires a UUID id and at least one other field. |

> **Queries with non-trivial args take them directly (no `input` wrapper) but are still
> Zod-validated** — `getNearbyBusinesses` (`getNearbyBusinessesSchema`), `getBusinessJobs`
> (`getBusinessJobsSchema`), `getMyJobs` (`getMyJobsSchema`), and `getJobUpdates`
> (`getJobUpdatesSchema`). Simple single-ID queries keep the lightweight inline checks used
> elsewhere. For `getNearbyBusinesses`, `radiusMiles` defaults to `25` (max `100`) and `limit`
> defaults to `20` (max `50`) — bounds that cap the underlying raw-SQL query's cost, not just
> produce friendly errors. The job list filters validate `statuses` against the seven `JobStatus`
> values and coerce `from`/`to`/`before` date strings via `z.coerce.date`.

### GraphQL Object Types

| Type               | Fields                                      | Notes                                    |
|--------------------|---------------------------------------------|------------------------------------------|
| `User`             | `id, email, firstName, lastName, phone?, avatarUrl?, globalRole, createdAt` | User responses intentionally omit `passwordHash`. |
| `Business`         | `id, name, description?, isActive, isVerified, heroPhotoUrl?, addressLine?, city?, neighborhood?, serviceFeeAmount?, avgRating?, reviewCount, createdAt` | Does not expose PostGIS `location` (no natural GraphQL scalar for it — see `getNearbyBusinesses` for the computed-distance alternative) or `updatedAt`. `avgRating`/`serviceFeeAmount` go through a type-level field resolver for Decimal→Number conversion. |
| `NearbyBusiness`   | `business: Business!, distanceMiles: Float!, fromPrice: Float` | Returned only by `getNearbyBusinesses`. `fromPrice` is `MIN(basePrice)` across the business's active `ServiceOffering`s — `null` if it has none with a `basePrice` set. |
| `AuthPayload`      | `token: String!, user: User!`               | Returned by `registerCustomer`, `login`, `acceptInvitation` |
| `OwnerAuthPayload` | `token: String!, user: User!, business: Business!` | Returned by `registerOwner`       |
| `Invitation`       | `id, email, role, expiresAt, isAccepted`    | Returned by `inviteEmployee`, `resendInvitation` |
| `BusinessMember`   | `id, role, isActive, joinedAt, user: User!` | Returned by `getBusinessMembers`, `removeMember` |
| `Pet`              | All `Pet` model fields including `isActive` | Returned by `getMyPets`, `addPet`, `updatePet`, `deletePet`. `weightLb` is `Float?`; the underlying Prisma `Decimal` must be converted with `Number()` in resolvers before returning. |
| `Job`              | Nearly all `Job` model fields, plus lazy `pets`, `customer: CustomerProfile!`, `service: ServiceOffering!`, `assignee: BusinessMember` | `price` and `tipAmount` are `Float`/`Float?` resolved via type-level field resolvers (`Number()` conversion from Prisma `Decimal`). `pets`/`customer`/`service`/`assignee` are resolved lazily (own queries keyed off the parent, not `include`s) — the display relations list screens need ("Alex R. · Biscuit · Walk"). `accessCode` is resolved via a gated field resolver — see `Job Resolver Behavior` below; it is **not** a plain passthrough field. `status` is a raw `String!` (not a GraphQL enum) covering all seven `JobStatus` values including `DECLINED`. |
| `Booking`          | All `Booking` model fields, plus `jobs: [Job!]!` and `addOns: [BookingAddOn!]!` | `totalPrice` is `Float!` via a type-level resolver. `jobs` and `addOns` are both resolved lazily (separate queries keyed by `bookingId`), not via Prisma `include` — see `Job Resolver Behavior` below. Returned by `createBooking` and listed via `getMyBookings`. |
| `CustomerProfile`  | `id, address?, city?, user: User!` | Reachable nested via `Job.customer`. `user` resolves lazily via a type-level resolver (`customerResolvers.ts`). Deliberately minimal — no pets/jobs/location exposure through this type. |
| `BookingAddOn`     | `id, priceAtBooking, addOn: ServiceOfferingAddOn!` | `priceAtBooking` is `Float!` via a type-level resolver (snapshotted add-on price at purchase time, independent of the add-on's current price). |
| `Review`           | All `Review` model fields | Returned by `leaveReview`, `getBusinessReviews`. No `customer`/`user` field — the reviewer's name isn't exposed anywhere on this type yet. |
| `JobUpdate`        | All `JobUpdate` model fields | Returned by `postJobUpdate`. No plain field resolvers needed (no Decimal fields, nothing sensitive). |
| `ReportCard`       | All `ReportCard` model fields | Returned by `submitReportCard`. `mood` is a raw `String` (not a GraphQL enum), matching the `PetType`/`PetSex`/`JobStatus` convention elsewhere. |
| `EmployeeAvailabilityStatus` | `member: BusinessMember!, isAvailable: Boolean!, conflictReason: String` | Not a Prisma model — a computed shape returned only by `getAvailableEmployees`. `member` already carries its `user` relation (fetched via the same `include: { user: true }` pattern as `getBusinessMembers`), so no extra field resolver is needed for it. |
| `ServiceOffering`  | `id, businessId, title, category?, description, basePrice?, durationMinutes, features, isActive, addOns: [ServiceOfferingAddOn!]!, packages: [ServicePackage!]!` | Also reachable nested via `Job.service`. `basePrice` converts Decimal→Number via the type-level map in `serviceResolvers.ts`; `addOns`/`packages` resolve lazily there too, applying the same member-vs-public visibility filter as `getServiceAddOns`/`getServicePackages` (see `Service Resolver Behavior` in §10). |
| `ServiceOfferingAddOn` | `id, serviceOfferingId, title, pricePerSession, perSession, isActive` | Reachable nested via `ServiceOffering.addOns` and `BookingAddOn.addOn`. `pricePerSession` converts Decimal→Number via the type-level map in `serviceResolvers.ts`. |
| `ServicePackage`   | `id, serviceOfferingId, title, sessionsCount, pricePerSession, isActive` | Reachable nested via `ServiceOffering.packages`. `pricePerSession` converts Decimal→Number via the type-level map in `serviceResolvers.ts`. |

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
- `setBusinessLocation` permits only an active OWNER or MANAGER of the target business. Writes via `$executeRaw` (`UPDATE "Business" SET "location" = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), "updatedAt" = NOW() WHERE "id" = ...`) since `Business.location` is `Unsupported("geometry")` and Prisma's normal `update()` can't write to it at all. Manually sets `updatedAt` since bypassing `update()` also bypasses Prisma's automatic `@updatedAt` handling. Returns the row via a fresh `findUniqueOrThrow` after the raw write, not the pre-write object.
- `deactivateBusiness` is active-OWNER-only, rejects unknown or already inactive businesses, and performs a soft delete by setting `isActive` to `false`.
- `removeMember` permits active OWNERs to remove MANAGERs or EMPLOYEEs and active MANAGERs to remove EMPLOYEEs only. It rejects self-removal, removal of the OWNER, already inactive members, and members from another business. It retains the row and sets its `isActive` flag to `false`.

**`getNearbyBusinesses`** — public, no auth (same as `getBusinessReviews`); this is the PostGIS-backed
nearby-search behind the customer discovery/home screens. Prisma has no query-builder support for
geometry columns, so it's built entirely on `context.prisma.$queryRaw`. Everything dynamic —
including the `category`/`search` WHERE fragments, which are only conditionally included at all —
is composed with `Prisma.sql`/`Prisma.join`, never string concatenation, so every value stays a
driver-parameterized placeholder regardless of how the WHERE clause's shape changes. **Never rewrite
this resolver's SQL assembly using template-literal string interpolation** — that would reopen SQL
injection on a publicly-reachable, unauthenticated query.

Distance handling follows the standard PostGIS idiom for "nearby, ranked by distance" search:
- `ORDER BY b."location" <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)` sorts using the raw
  `geometry` column specifically so Postgres can use the `business_location_idx` GiST index for fast
  KNN ordering. (There is no geography-typed index on this column — ordering by a `::geography` cast
  instead would silently fall back to a full scan.)
- `ST_DWithin`/`ST_Distance` both cast to `::geography` so the radius filter and the returned
  `distanceMiles` are accurate real-world distance, not raw coordinate-degree distance.
- A `Business` with `location IS NULL` can never match — `ST_DWithin` against a `NULL` geography
  evaluates to `NULL` (not `TRUE`) in the `WHERE` clause, so it's excluded rather than erroring.
  The resolver also states this explicitly (`b."location" IS NOT NULL`) rather than relying on that
  implicit behavior alone.

`category` filters via `EXISTS (SELECT 1 FROM "ServiceOffering" so WHERE so."businessId" = b."id"
AND so."isActive" = true AND so."category" = ...)` — a business matches if it has *any* matching
active offering. `search` does a simple `ILIKE '%...%'` against `b."name"` only (no full-text search
infrastructure exists in this codebase). `fromPrice` is a correlated subquery,
`MIN(so."basePrice")` over that business's active offerings, chosen specifically to avoid needing a
`GROUP BY` across every selected column that a `JOIN`-based aggregate would require.

The raw rows' `avgRating`/`serviceFeeAmount`/`distanceMiles`/`fromPrice` are all Decimal-ish or
computed numeric values of uncertain runtime shape (string vs. `Decimal` vs. `number`, depending on
the driver) — `distanceMiles` and `fromPrice` are converted inline in the resolver with `Number()`
since only this one resolver produces them; `avgRating`/`serviceFeeAmount` are passed through
unconverted into the nested `business` object and rely on the shared `Business` type-level field
resolver (below) to convert them — the same one every other Business-returning operation uses.

### Customer Resolver Behavior

The following handlers are implemented and registered through `resolvers/customer/`. All four resolvers first resolve the caller's `CustomerProfile` from the JWT `userId` and throw `UNAUTHENTICATED` if no profile exists.

- `getMyPets` returns all pets where `customerId` matches the caller's profile **and** `isActive` is `true`, ordered by `name` ascending (`Pet` has no `createdAt` field).
- `addPet` creates a new `Pet` row scoped to the caller's `customerId`. `name` and `type` are required; all other fields are optional.
- `updatePet` applies a partial update. Empty strings on clearable text fields (`breed`, `medicalNotes`, etc.) are coerced to `null`. Explicit `null` on `age`, `sex`, or `weightLb` clears those fields. Returns `NOT_FOUND` (not `FORBIDDEN`) when the `petId` does not belong to the caller — this deliberately avoids confirming whether a pet ID exists on another account.
- `deletePet` soft-deletes the pet by setting `isActive` to `false`. Same `NOT_FOUND`-on-mismatch security pattern as `updatePet`. The row is preserved for historical job references.

### Job Resolver Behavior

The following handlers are implemented and registered through `resolvers/job/`.

**Listing/lookup queries** — the read side that makes the lifecycle mutations reachable:
- `getMyBookings` (customer): bookings for the caller's `CustomerProfile`, newest first.
- `getBusinessJobs` (active OWNER/MANAGER): a business's jobs, optional `statuses` filter (e.g.
  `["PENDING"]` = the requests inbox) and `from`/`to` window on `scheduledStartTime` (the day/week
  schedule). Ordered by `scheduledStartTime` ascending. EMPLOYEEs are refused — they use `getMyJobs`.
- `getMyJobs` (any JWT): jobs whose `assignee` membership belongs to the caller **and is still
  active** — a sitter removed from a business stops seeing that business's jobs. Spans all of the
  caller's businesses; same filters/ordering as `getBusinessJobs`.
- `getJob` / `getJobUpdates`: single-job detail and the update feed (newest first; `before`
  `createdAt` cursor + `limit` ≤ 100). Both authorize via the shared `assertJobViewAccess`
  (`job/jobAccess.ts`): the job's customer, the assigned sitter (active membership), or an active
  OWNER/MANAGER of the job's business. The rule lives in one place so the two reads can't drift;
  mutations keep their own stricter role-specific checks.

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

**`postJobUpdate` / `submitReportCard`** — both restricted to the job's assigned sitter specifically
(same `BusinessMember`-lookup-plus-`userId`-match pattern as `clockIn`/`clockOut`, not "any active
member of the business"), and both gated on `Job.status`: `postJobUpdate` requires `IN_PROGRESS`
(matches the model's own doc — "while a job is in progress"), `submitReportCard` requires
`COMPLETED` and pre-checks for an existing `ReportCard` on that `jobId` before writing (the DB's
`@unique` constraint is the backstop, not the primary error path — same approach as `leaveReview`).
Neither mutation spreads `parsed.data` into Prisma's `data` directly; both build the payload with
explicit `if (x !== undefined) data.x = x` per field, for the same `exactOptionalPropertyTypes`
reason documented on `addPet`.

**`getAvailableEmployees`** — OWNER/MANAGER of the job's business only. For every active
`BusinessMember` of that business, checks two independent things and returns `isAvailable: false`
with a human-readable `conflictReason` the moment either fails:
1. **Weekly availability**: looks up that member's `EmployeeAvailability` row for the job's day of
   week (via the `employeeId_dayOfWeek` composite key) with `isAvailable: true`, and requires the
   job's `[scheduledStartTime, scheduledEndTime]` time-of-day to fall entirely inside that row's
   `[startTime, endTime]` `HH:MM` window (plain string comparison — safe because both are zero-padded
   24-hour strings). No row for that day at all is treated as **not available** — availability must
   be explicitly configured per day, never assumed.
2. **Scheduling conflict**: a `Job.findFirst` for any *other* job already assigned to that member
   (`status` `ASSIGNED` or `IN_PROGRESS`) whose scheduled window overlaps this job's, via the
   standard interval-overlap condition (`existing.start < this.end AND existing.end > this.start`).

Both the "day of week" and the "time of day" are derived from `scheduledStartTime` using UTC methods
(`getUTCDay()`/`getUTCHours()`/`getUTCMinutes()`) — there is no per-business timezone field
anywhere in this schema yet, so this is a simplifying assumption, not a real timezone conversion.
**Known limitation:** the weekly-availability check (point 1) only looks at `scheduledStartTime`'s
single day — a multi-day job (e.g. a multi-night boarding stay) is not validated against every day
it spans. The conflict check (point 2) has no such limitation; it's a pure interval overlap and
works correctly regardless of job duration.

**Sensitive and Decimal-backed fields go through type-level field resolvers**, not plain schema
fields, defined in `job/jobResolvers.ts` and spread onto the root resolver map's `Job`/`Booking`/
`BookingAddOn` keys (alongside `Query`/`Mutation`/`JSON` in `resolvers/index.ts`) — this applies
regardless of which query or mutation returned the object:
- `Job.accessCode` resolves to the real value only if the caller is an active `OWNER`/`MANAGER` of the job's business, or the `BusinessMember` matching `job.assigneeId` — otherwise `null`. It performs its own `businessMember` lookup per call, independent of whatever authorization already ran in the parent mutation.
- `Job.price`, `Job.tipAmount`, `Booking.totalPrice`, `BookingAddOn.priceAtBooking` convert Prisma `Decimal` to `Number` before they reach the GraphQL `Float` scalar (see the `ServiceOfferingAddOn` warning above — Decimal instances are not natively serializable there).
- `Job.pets`, `Job.customer`, `Job.service`, `Job.assignee`, `Booking.jobs`, `Booking.addOns` are resolved lazily via their own Prisma queries keyed off the parent — mutations/queries that return a `Job`/`Booking` do not `include` these relations, so they're only fetched when a client actually asks for them. `Job.assignee` includes its `user` (matching the `BusinessMember` GraphQL type's non-null `user` field); `Job.customer` returns a `CustomerProfile` whose `user` resolves via the customer domain's own type-level map.

### Review Resolver Behavior

The following handlers are implemented and registered through `resolvers/review/`.

- `leaveReview` resolves the caller's `CustomerProfile`, then loads the target `Job` and checks, in order: the job's `customerId` matches the caller (`FORBIDDEN` otherwise — you can only review jobs you booked), the job's `status` is `COMPLETED` (`BAD_USER_INPUT` otherwise), and no `Review` already exists for that `jobId` (`BAD_USER_INPUT` — this is also enforced at the DB level by `Review.jobId` being `@unique`, but the resolver checks first to give a clean error instead of surfacing a raw constraint violation). `businessId`/`customerId` on the created row come from the job/caller, never from client input.
- **Aggregate sync**: in the same `$transaction` as the `Review` insert, `leaveReview` runs `review.aggregate({ where: { businessId, isPublic: true }, _avg: { rating: true }, _count: true })` and writes the result straight to `Business.avgRating`/`reviewCount`. This recomputes from scratch rather than incrementing a running average — same "derive, don't mutate in place" philosophy as the financial ledger (§11) — so there's no drift risk from repeated incremental arithmetic. This is the **only** place that writes `Business.avgRating`/`reviewCount`; anything that later adds `updateReview`/`deleteReview` must repeat this same recompute-and-write or the aggregate will go stale (see the note on `Business.avgRating` in §9).
- `getBusinessReviews` requires no authentication (it's public-profile data) and returns only `isPublic: true` reviews for the given `businessId`, ordered by `createdAt` descending. It 404s if the business itself doesn't exist, but does not check `Business.isActive`.

### Service Resolver Behavior

The following handlers are implemented and registered through `resolvers/service/`, covering
`ServiceOffering`, `ServiceOfferingAddOn`, and `ServicePackage` — three models with identical
read/write rules, sharing two helpers in `service/serviceAccess.ts`:

- **`requireBusinessManager(businessId, context)`** — throws unless the caller is an active
  `OWNER`/`MANAGER` of that business. Every create/update/delete mutation across all three models
  calls this after resolving the target row's owning `businessId` (for add-ons and packages, via
  their parent `ServiceOffering`).
- **`isActiveMember(businessId, context)`** — returns a boolean, never throws. Every read (both the
  dedicated `get*` queries and the `ServiceOffering.addOns`/`.packages` type-level lazy fields) uses
  this to pick one of two views: **member view** (any active role) returns every row regardless of
  `isActive`; **public view** (everyone else, including unauthenticated callers) returns only
  `isActive: true` rows of an `isActive: true` business, and 404s (`NOT_FOUND`) rather than
  `FORBIDDEN` if the target is inactive/hidden — same "don't confirm something exists" reasoning as
  `updatePet`/`deletePet`'s 404-on-mismatch pattern. **This is deliberately not JWT-gated at all** —
  unlike almost every other read in this codebase, an anonymous caller can browse a business's
  active service catalog, because that's the public storefront (the business detail / service
  detail screens).

The three delete mutations (`deleteServiceOffering`, `deleteServiceAddOn`, `deleteServicePackage`)
are all soft deletes (`isActive: false`) and all reject an already-inactive target with
`BAD_USER_INPUT`, matching `deactivateBusiness`'s precedent. `createServiceOffering` creates the
offering **active by default** — a deliberate contrast with `registerOwner`'s seed offerings, which
are created inactive since they're placeholders the owner hasn't configured yet, not something a
caller explicitly asked to publish.

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
- Raw SQL via `prisma.$queryRaw` (reads) or `$executeRaw` (writes) is required for PostGIS
  columns — Prisma does not generate query-builder helpers for them, and can't write to them via
  its normal `create()`/`update()` API at all (`location` is `Unsupported("geometry")`)
- **Reference implementation, read side**: `getNearbyBusinesses` (`resolvers/business/queries/getNearbyBusinesses.ts`)
  is the first (and so far only) resolver that does this — follow its pattern for any future
  `CustomerProfile.location`-based query (e.g. a future "sitters near this customer" query). In
  particular: `ORDER BY ... <->` on the raw `geometry` column (index-accelerated), `::geography`
  casts on `ST_DWithin`/`ST_Distance` for accurate real-world distance, and building every dynamic
  WHERE fragment with `Prisma.sql`/`Prisma.join` — never string interpolation — since raw SQL is the
  one place in this codebase where a careless mistake is a direct SQL injection risk, not just a bug.
- **Reference implementation, write side**: `setBusinessLocation`
  (`resolvers/business/mutations/setBusinessLocation.ts`) is the only mutation that writes
  `Business.location`, via `$executeRaw`. Nothing else does — not `registerOwner`, not
  `updateBusiness` — so a freshly-created business is invisible to `getNearbyBusinesses` until this
  is called explicitly. A raw write also bypasses Prisma's automatic `@updatedAt` handling, so
  `"updatedAt" = NOW()` must be set manually in the same statement, and the resolver re-fetches the
  row afterward (`findUniqueOrThrow`) rather than trusting a pre-write in-memory copy.

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
