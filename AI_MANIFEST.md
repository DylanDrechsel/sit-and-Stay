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
| Language             | TypeScript 5                                      |
| Web Framework        | Express 4                                         |
| API Layer            | Apollo Server 4 (GraphQL) via Express             |
| ORM                  | Prisma 5 (with `postgresqlExtensions` preview)    |
| Database             | PostgreSQL 16 + PostGIS 3.4 (via Docker)          |
| Geospatial           | PostGIS — `geometry(Point, 4326)` + GiST indexes  |
| Dev Runner           | `tsx watch`                                       |
| Auth (planned)       | JWT (`jsonwebtoken`) + bcrypt                     |
| Email (planned)      | Nodemailer                                        |
| Validation (planned) | Zod                                               |

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
    ├── src/
    │   ├── server.ts              # Entry point — Express + Apollo setup
    │   ├── types/                 # Shared TypeScript interfaces
    │   │   ├── auth.ts            # LoginInput
    │   │   ├── context.ts         # GraphQLContext interface
    │   │   ├── invitation.ts      # InviteInput, AcceptInvitationInput
    │   │   └── registration.ts    # RegisterCustomerInput, RegisterOwnerInput
    │   ├── utils/
    │   │   ├── generatePrisma.ts  # Prisma singleton (prevents hot-reload connection exhaustion)
    │   │   ├── auth.ts            # hashPassword, comparePassword, signToken, verifyToken, TokenPayload
    │   │   └── validate.ts        # Zod schemas for all inputs + formatZodError helper
    │   └── graphQL/
    │       ├── typeDefs.ts        # GraphQL schema (SDL)
    │       └── resolvers/
    │           ├── index.ts       # Merges all domain resolver maps
    │           ├── owner/
    │           │   ├── ownerResolvers.ts
    │           │   ├── queries/
    │           │   │   └── getOwner.ts
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
    │           │       └── acceptInvitation.ts
    │           ├── user/
    │           │   ├── userResolvers.ts
    │           │   ├── queries/
    │           │   │   ├── getMe.ts
    │           │   │   └── getUserById.ts
    │           │   └── mutations/
    │           └── utils/
    │               ├── utilsResolvers.ts
    │               └── mutations/
    │                   └── login.ts
    ├── .env                       # Environment variables (never committed)
    ├── package.json
    └── tsconfig.json
```

> **Convention**: Each domain folder (`owner/`, `customer/`, `invitation/`, `utils/`) contains
> a `*Resolvers.ts` barrel file that groups its `Query` and `Mutation` maps, then all are
> spread into the root `resolvers/index.ts`.

---

## 4. Environment Variables (`.env`)

| Variable       | Description                          | Value                                                              |
|----------------|--------------------------------------|--------------------------------------------------------------------|
| `DATABASE_URL` | Prisma PostgreSQL connection string  | `postgresql://postgres:postgres@localhost:5432/pet_sitter_pro?schema=public` |
| `PORT`         | HTTP port the server listens on      | `4000`                                                             |
| `JWT_SECRET`   | Secret key for signing JWTs          | `changeme_supersecret_jwt_key`                                     |

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
- Implements the **Singleton Pattern** for the `PrismaClient`.
- Attaches the Prisma instance to the Node.js `globalThis` object during local development.
- Prevents database connection exhaustion (the "Too many connections" error) caused by the server hot-reloading on every file save.
- Logs `info` and `warn` level events; uses `pretty` error format.

**Exported values:**
```ts
export default db  // Import this if you need DB access outside of GraphQL resolvers (e.g., utility scripts)
```

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
| `joinedAt`  | DateTime     | default now                         |

**Relations:**
- `user` → `User`
- `business` → `Business`
- `availability` → `EmployeeAvailability[]`
- `assignedJobs` → `Job[]` (via `JobAssignee` relation name)
- `conversations` → `Conversation[]` (Owner↔Employee conversations)

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

### Current Queries

| Query         | Args            | Returns  | Auth Required | Location                               |
|---------------|-----------------|----------|---------------|----------------------------------------|
| `healthCheck` | none            | `String` | No            | `resolvers/index.ts`                   |
| `getOwner`    | none            | `User!`  | Yes (JWT)     | `resolvers/owner/queries/getOwner.ts`  |
| `getMe`       | none            | `User!`  | Yes (JWT)     | `resolvers/user/queries/getMe.ts`      |
| `getUserById` | `userId: ID!`   | `User!`  | Yes (JWT)     | `resolvers/user/queries/getUserById.ts`|

### Current Mutations

| Mutation            | Input                    | Returns            | Auth Required | Location                                          |
|---------------------|--------------------------|--------------------|---------------|---------------------------------------------------|
| `registerCustomer`  | `RegisterCustomerInput`  | `AuthPayload`      | No            | `resolvers/customer/mutations/registerCustomer.ts`|
| `registerOwner`     | `RegisterOwnerInput`     | `OwnerAuthPayload` | No            | `resolvers/owner/mutations/registerOwner.ts`      |
| `login`             | `LoginInput`             | `AuthPayload`      | No            | `resolvers/utils/mutations/login.ts`              |
| `inviteEmployee`    | `InviteInput`            | `Invitation`       | Yes (OWNER/MANAGER) | `resolvers/invitation/mutations/inviteEmployee.ts` |
| `acceptInvitation`  | `AcceptInvitationInput`  | `AuthPayload`      | No            | `resolvers/invitation/mutations/acceptInvitation.ts` |

### GraphQL Return Types

| Type               | Fields                                      | Notes                                    |
|--------------------|---------------------------------------------|------------------------------------------|
| `AuthPayload`      | `token: String!, user: User!`               | Returned by `registerCustomer`, `login`, `acceptInvitation` |
| `OwnerAuthPayload` | `token: String!, user: User!, business: Business!` | Returned by `registerOwner`       |
| `Invitation`       | `id, email, role, expiresAt, isAccepted`    | Returned by `inviteEmployee`             |

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
6. The barrel is already spread in `resolvers/index.ts` — no change needed there unless adding a new domain
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

# Start dev server (auto-reloads)
npm run dev

# Create a new migration after schema changes
npx prisma migrate dev --name <description>

# Regenerate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Check health
curl http://localhost:4000/health
```
