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
    │   │   ├── business.ts        # UpdateBusinessInput, RemoveMemberInput
    │   │   ├── context.ts         # GraphQLContext interface
    │   │   ├── invitation.ts      # InviteInput, AcceptInvitationInput, InvitationEmailPayload
    │   │   ├── registration.ts    # RegisterCustomerInput, RegisterOwnerInput
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
    │           │   └── mutations/
    │           │       └── registerCustomer.ts
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
    │           └── utils/
    │               ├── utilsResolvers.ts
    │               └── mutations/
    │                   └── login.ts
    ├── .env                       # Environment variables (never committed)
    ├── package.json
    └── tsconfig.json
```

> **Convention**: Each domain folder (`owner/`, `customer/`, `invitation/`, `user/`,
> `business/`, `utils/`) contains a `*Resolvers.ts` barrel file that groups its `Query` and
> `Mutation` maps. The root `resolvers/index.ts` must explicitly import and spread each barrel;
> adding a domain folder alone does not expose its fields through GraphQL.

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
| `JobStatus`          | `PENDING`, `ACCEPTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `EntryType`          | `CREDIT`, `DEBIT`                                                   |
| `LedgerReferenceType`| `JOB_PAYMENT`, `TIP`, `PAYOUT`, `REFUND`, `ADJUSTMENT`             |

---

### Model: `User` → table `users`

The global identity record for any person on the platform (customer or business member).

| Field          | Type        | Notes                            |
|----------------|-------------|----------------------------------|
| `id`           | String      | uuid, primary key                |
| `email`        | String      | unique                           |
| `passwordHash` | String      | bcrypt hash — never store plain  |
| `firstName`    | String      |                                  |
| `lastName`     | String      |                                  |
| `phone`        | String?     | optional                         |
| `avatarUrl`    | String?     | optional profile photo URL       |
| `globalRole`   | GlobalRole  | `USER` or `ADMIN`, default `USER`|

**Relations:**
- `memberships` → `BusinessMember[]` — which businesses this user belongs to (and in what role)
- `customer` → `CustomerProfile?` — exists if user has booked as a pet owner
- `messages` → `Message[]` — all messages sent by this user

---

### Model: `Business` → table `businesses`

A pet sitting business (the tenant in the multi-tenant model).

| Field         | Type       | Notes                                               |
|---------------|------------|-----------------------------------------------------|
| `id`          | String     | uuid, primary key                                   |
| `name`        | String     |                                                     |
| `description` | String?    | optional                                            |
| `isActive`    | Boolean    | default `true`; indexed for filtering               |
| `location`    | geometry?  | PostGIS Point (lng, lat) for geospatial search      |

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
| `isActive`  | Boolean      | default `true`; set to `false` when the member is removed |
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
| `medicalNotes`    | String?        | optional                       |
| `careInstructions`| String?        | optional                       |

**Relations:**
- `customer` → `CustomerProfile`
- `jobs` → `Job[]` (via `JobPets` many-to-many relation)

---

### Model: `ServiceOffering` → table `service_offerings`

A service that a business advertises (e.g., Dog Walking — $25 — 60 min).

| Field            | Type    | Notes                                |
|------------------|---------|--------------------------------------|
| `id`             | String  | uuid, primary key                    |
| `businessId`     | String  | FK → `businesses.id`, cascade delete |
| `title`          | String  | e.g., "Dog Walking"                  |
| `description`    | String  |                                      |
| `basePrice`      | Decimal | USD, precision `(10,2)`              |
| `durationMinutes`| Int     | expected duration                    |
| `isActive`       | Boolean | default `true`                       |

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
| `businessId`         | String        | FK → `businesses.id`                       |
| `customerId`         | String        | FK → `customer_profiles.id`                |
| `serviceOfferingId`  | String        | FK → `service_offerings.id`                |
| `assigneeId`         | String?       | FK → `business_members.id`, optional       |
| `status`             | JobStatus     | default `PENDING`                          |
| `scheduledStartTime` | DateTime      |                                            |
| `scheduledEndTime`   | DateTime      |                                            |
| `actualStartTime`    | DateTime?     | set when job actually begins               |
| `actualEndTime`      | DateTime?     | set when job actually ends                 |
| `specialInstructions`| String?       | optional customer notes                    |
| `price`              | Decimal       | USD, precision `(10,2)`                    |
| `tipAmount`          | Decimal?      | USD, precision `(10,2)`, set on completion |

**Relations:**
- `business` → `Business`
- `customer` → `CustomerProfile`
- `service` → `ServiceOffering`
- `assignee` → `BusinessMember?`
- `pets` → `Pet[]` (via `JobPets` many-to-many)
- `ledgerEntries` → `LedgerEntry[]`
- `review` → `Review?`
- `conversation` → `Conversation?`

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

**Indexes:** `(businessId, rating)` — for sorted/filtered review queries

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

A conversation always belongs to a `Business` and has exactly **one** participant on the other side:
- `customerId` set → **Owner ↔ Customer** conversation
- `memberId` set → **Owner ↔ Employee** conversation

Both `customerId` and `memberId` are optional at the DB level, but application logic must ensure
exactly one is set when creating a conversation.

| Field       | Type    | Notes                                        |
|-------------|---------|----------------------------------------------|
| `id`        | String  | uuid, primary key                            |
| `jobId`     | String? | FK → `jobs.id`, unique — optional job link   |
| `businessId`| String  | FK → `businesses.id`                         |
| `customerId`| String? | FK → `customer_profiles.id` — set for Owner↔Customer |
| `memberId`  | String? | FK → `business_members.id` — set for Owner↔Employee  |

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

The GraphQL SDL in `typeDefs.ts` and the resolver map in `resolvers/index.ts` stay in lockstep.
The root resolver map explicitly spreads the user and business query and mutation barrels, so the
declared business operations below are callable. `registerOwner` is registered only as a mutation.

### Declared Queries

| Query         | Args            | Returns            | Auth Required | Location                               |
|---------------|-----------------|--------------------|---------------|----------------------------------------|
| `healthCheck` | none            | `String`           | No            | `resolvers/index.ts`                   |
| `getMe`       | none            | `User!`            | Yes (JWT)     | `resolvers/user/queries/getMe.ts`      |
| `getUserById` | `userId: ID!`   | `User!`            | Yes (JWT)     | `resolvers/user/queries/getUserById.ts`|
| `getMyBusinesses`   | none      | `[Business!]!`     | Yes (JWT)     | `resolvers/business/queries/getMyBusinesses.ts` — returns active memberships only |
| `getBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getBusinessMembers.ts` |
| `getInactiveBusinessMembers`| `businessId: ID!` | `[BusinessMember!]!` | Yes (JWT + active member) | `resolvers/business/queries/getInactiveBusinessMembers.ts` |

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

### GraphQL Object Types

| Type               | Fields                                      | Notes                                    |
|--------------------|---------------------------------------------|------------------------------------------|
| `User`             | `id, email, firstName, lastName, phone?, avatarUrl?, globalRole, createdAt` | User responses intentionally omit `passwordHash`. |
| `Business`         | `id, name, description?, isActive, createdAt` | The GraphQL type does not currently expose PostGIS location or `updatedAt`. |
| `AuthPayload`      | `token: String!, user: User!`               | Returned by `registerCustomer`, `login`, `acceptInvitation` |
| `OwnerAuthPayload` | `token: String!, user: User!, business: Business!` | Returned by `registerOwner`       |
| `Invitation`       | `id, email, role, expiresAt, isAccepted`    | Returned by `inviteEmployee`, `resendInvitation` |
| `BusinessMember`   | `id, role, isActive, joinedAt, user: User!` | Returned by `getBusinessMembers`, `removeMember` |

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
# Start the database (Docker)
docker compose up -d

# Stop the database
docker compose down

# Backend commands (run from the repository root)
cd backend

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
