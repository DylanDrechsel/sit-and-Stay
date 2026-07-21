# PetSitter — Test Data & API Responses

> **Purpose**: A running record of test accounts, tokens, and raw API responses so you don't
> have to re-query the database during development.
>
> **Keep this file up to date** as you add new test users, businesses, and operations.

## Quick Reference: Current Test Tokens

Grab a valid JWT here instead of re-running `login`. **Tokens expire** (`JWT_EXPIRES_IN` in `.env`)
— if a call suddenly 401s with a token below, re-run `login` for that account and replace its row.

| Role | Email | Password | User ID | BusinessMember ID |
|------|-------|----------|---------|--------------------|
| Owner | owner.test1@petsitterpro.dev | TestPass123! | `0bfaff01-7e2f-4b60-811b-04b9909285ae` | `f6f86288-8cb4-4f08-a79d-7e1bdc2d9f6d` |
| Manager | manager.test1@petsitterpro.dev | TestPass123! (phone since changed to `+12065559999` via §12) | `20be60f0-7d99-470c-ad24-e8ddd1314241` | `68081d4b-8bf9-4099-b6ec-2806cf8b1c5a` |
| Employee | ~~employee.test1@petsitterpro.dev~~ → **employee.newemail@petsitterpro.dev** (changed via §40) | ~~TestPass123!~~ → **NewTestPass456!** (changed via §39) | `ca7aa688-4426-451c-8ed7-8b17babe0363` | `cc28c51f-3c59-4c44-9cea-cf881b468533` |
| Customer | customer.test1@petsitterpro.dev | TestPass123! | `7065a3f9-aec6-4d66-a9f5-e05cf18392ac` | `8f024572-3ff9-4651-b4b8-d2979ab2f40a` — **also an active MANAGER** of this business (dual-role, from an earlier `cancelJob` union-of-roles test; not a clean "non-member" account) |
| Outsider (throwaway) | outsider.test1@petsitterpro.dev | TestPass123! | `471565e6-4fb7-464a-9845-6cfc9715ffe9` | — (registered in §42 purely for true non-member negative tests; no business affiliation at all) |

`BusinessMember.id` (not `User.id`) is what `assignSitter.assigneeId`, `setAvailability.memberId`, and
`removeMember.memberId` all expect — keep this column in mind for the job-lifecycle phase.

**Business:** Puget Sound Pet Care — `eeed145f-246b-4c14-8b1a-246850d1ea8a` (reactivated after §41;
`isActive: true` as of §42). `defaultSitterPayPercent: 50`. Employee `cc28c51f-3c59-4c44-9cea-cf881b468533`
has a `payRatePercent` override of `70`. Current ledger balance after §42: **$22.50**.

**Current JWTs** (use as `Authorization: Bearer <token>`) — all five re-logged-in fresh for the §43
`getSession` testing pass; the tokens previously logged here had expired (`JWT_EXPIRES_IN=1d`):

- **Owner**:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYmZhZmYwMS03ZTJmLTRiNjAtODExYi0wNGI5OTA5Mjg1YWUiLCJlbWFpbCI6Im93bmVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDY2MDk4OSwiZXhwIjoxNzg0NzQ3Mzg5fQ.slZSgo2Tz-SCmg8AsfJaP9SpT3HH1zFhqbhMZJWYo3Q`
- **Manager**:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMGJlNjBmMC03ZDk5LTQ3MGMtYWQyNC1lOGRkZDEzMTQyNDEiLCJlbWFpbCI6Im1hbmFnZXIudGVzdDFAcGV0c2l0dGVycHJvLmRldiIsImdsb2JhbFJvbGUiOiJVU0VSIiwiaWF0IjoxNzg0NjYwOTkyLCJleHAiOjE3ODQ3NDczOTJ9.1IgzkN5oERB3dvSE3xYpb08KdCFFfA7NmYAtn-mZJ5Q`
- **Employee**:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYTdhYTY4OC00NDI2LTQ1MWMtOGVkNy04YjE3YmFiZTAzNjMiLCJlbWFpbCI6ImVtcGxveWVlLm5ld2VtYWlsQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDY2MDk5NSwiZXhwIjoxNzg0NzQ3Mzk1fQ.gQFMSlcE9tCniiG8fK01ysZRBaVO-YUUTFPvN4psFxs`
- **Customer**:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDY1YTNmOS1hZWM2LTRkNjYtYTlmNS1lMDVjZjE4MzkyYWMiLCJlbWFpbCI6ImN1c3RvbWVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDY2MDk5OCwiZXhwIjoxNzg0NzQ3Mzk4fQ.jYuBxcOkwSPyBRLNgQMl-HizLwP2bXwfvUfwaUSAlLY`
- **Outsider** (throwaway, confirmed in §43 to be a plain customer via `registerCustomer` — no business affiliation, but does have a `CustomerProfile`):
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzE1NjVlNi00ZmI3LTQ2NGEtOTg0NS02Y2ZjOTcxNWZmZTkiLCJlbWFpbCI6Im91dHNpZGVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDY2MDk5OSwiZXhwIjoxNzg0NzQ3Mzk5fQ.pj4bb56PqogZ54bn3jw-jck3KFlpbRXt1cLxs6LGUU4`

---

## Test Coverage Checklist

Check items off as each one gets exercised against a running server and logged in a numbered
section below. Grouped by resolver domain (`src/graphQL/resolvers/<domain>/`).

### Queries (27)

**business**
- [x] getMyBusinesses
- [x] getBusinessMembers
- [x] getInactiveBusinessMembers
- [x] getNearbyBusinesses

**customer**
- [x] getMyPets

**finance**
- [x] getBusinessLedger
- [x] getBusinessFinancialSummary
- [x] getUnpaidEarningsByMember
- [x] getBusinessEarnings
- [x] getMyEarnings

**job**
- [x] getAvailableEmployees
- [x] getMyBookings
- [x] getMyUpcomingJobs
- [x] getBusinessJobs
- [x] getMyJobs
- [x] getJob
- [x] getJobUpdates

**review**
- [x] getBusinessReviews

**service**
- [x] getServiceOffering
- [x] getServiceOfferings
- [x] getServiceAddOn
- [x] getServiceAddOns
- [x] getServicePackages

**user**
- [x] getMe
- [x] getSession
- [x] getUserById

**root**
- [x] healthCheck

### Mutations (40)

**owner**
- [x] registerOwner

**customer**
- [x] registerCustomer
- [x] addPet
- [x] updatePet
- [x] deletePet

**utils**
- [x] login

**invitation**
- [x] inviteEmployee
- [x] resendInvitation
- [x] acceptInvitation

**user**
- [x] updateUser
- [x] changePassword
- [x] changeEmail

**business**
- [x] updateBusiness
- [x] setBusinessLocation
- [x] deactivateBusiness
- [x] removeMember
- [x] setAvailability
- [x] setMemberPayRate

**finance**
- [x] recordPayout

**service**
- [x] createServiceOffering
- [x] updateServiceOffering
- [x] deleteServiceOffering
- [x] createServiceAddOn
- [x] updateServiceAddOn
- [x] deleteServiceAddOn
- [x] createServicePackage
- [x] updateServicePackage
- [x] deleteServicePackage

**job**
- [x] createBooking
- [x] acceptJob
- [x] declineJob
- [x] assignSitter
- [x] clockIn
- [x] clockOut
- [x] completeJob
- [x] cancelJob
- [x] addTip

**review**
- [x] leaveReview

**job (activity)**
- [x] postJobUpdate
- [x] submitReportCard

---

<!--
================================================================
  TEMPLATE — Copy this block when adding a new test entry
================================================================

## N. <Operation Name>

### Input

```graphql
mutation/query OperationName($input: InputType!) {
  fieldName(input: $input) {
    ...
  }
}
```

**Variables:**
```json
{
  "input": {}
}
```

### Response

```json
{
  "data": {}
}
```

### Key IDs

| Field | Value |
|-------|-------|
|       |       |

================================================================
-->

## 1. Register Owner

### Input

```graphql
mutation RegisterOwner($input: RegisterOwnerInput!) {
  registerOwner(input: $input) {
    token
    user {
      id
      email
      firstName
      lastName
      phone
      globalRole
      createdAt
    }
    business {
      id
      name
      description
      isActive
      isVerified
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "owner.test1@petsitterpro.dev",
    "password": "TestPass123!",
    "firstName": "Dylan",
    "lastName": "Owner",
    "phone": "+12065550100",
    "businessName": "Puget Sound Pet Care",
    "businessDescription": "A friendly neighborhood pet sitting business for testing."
  }
}
```

### Response

```json
{
  "data": {
    "registerOwner": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYmZhZmYwMS03ZTJmLTRiNjAtODExYi0wNGI5OTA5Mjg1YWUiLCJlbWFpbCI6Im93bmVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDQ3NzA4NiwiZXhwIjoxNzg0NTYzNDg2fQ.R4lb9LC9eAlIjY5LXCVjj6zk1Jpps4zeppjzhwm1a24",
      "user": {
        "id": "0bfaff01-7e2f-4b60-811b-04b9909285ae",
        "email": "owner.test1@petsitterpro.dev",
        "firstName": "Dylan",
        "lastName": "Owner",
        "phone": "+12065550100",
        "globalRole": "USER",
        "createdAt": "1784477086802"
      },
      "business": {
        "id": "eeed145f-246b-4c14-8b1a-246850d1ea8a",
        "name": "Puget Sound Pet Care",
        "description": "A friendly neighborhood pet sitting business for testing.",
        "isActive": true,
        "isVerified": false,
        "createdAt": "1784477086805"
      }
    }
  }
}
```

### Key IDs

| Field | Value |
|-------|-------|
| User ID (owner) | `0bfaff01-7e2f-4b60-811b-04b9909285ae` |
| Business ID | `eeed145f-246b-4c14-8b1a-246850d1ea8a` |
| Owner email | `owner.test1@petsitterpro.dev` |
| Owner password | `TestPass123!` |
| JWT (reuse via `Authorization: Bearer <token>`) | see `token` above — expires 24h from issue (`JWT_EXPIRES_IN` default) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Duplicate email (`owner.test1@petsitterpro.dev` reused) | `BAD_USER_INPUT` — "An account with this email already exists" |
| Weak password (`"weak"`) | `BAD_USER_INPUT` — "Password must be at least 8 characters, Password must contain at least one uppercase letter, Password must contain at least one number, Password must contain at least one special character" (confirms `formatZodError()` joins every failing rule at once, not just the first) |

### Notes
- Also seeds 6 inactive `ServiceOffering` rows for the business (Boarding, House Sitting, Drop-In Visits, Doggy Day Care, Dog Walking, Dog Training), plus 3 packages + 1 add-on on Dog Training and 3 packages on Dog Walking — all inactive until explicitly published via `updateServiceOffering`/`updateServicePackage`/`updateServiceAddOn`.

---

## 2. Login

### Input

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      email
      firstName
      lastName
      globalRole
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "owner.test1@petsitterpro.dev",
    "password": "TestPass123!"
  }
}
```

### Response

```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYmZhZmYwMS03ZTJmLTRiNjAtODExYi0wNGI5OTA5Mjg1YWUiLCJlbWFpbCI6Im93bmVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDQ3NzQzNCwiZXhwIjoxNzg0NTYzODM0fQ.FExiBSuqJiWnyu6xs4nkNRUxJYjOU1YJ6J3JdazHucg",
      "user": {
        "id": "0bfaff01-7e2f-4b60-811b-04b9909285ae",
        "email": "owner.test1@petsitterpro.dev",
        "firstName": "Dylan",
        "lastName": "Owner",
        "globalRole": "USER"
      }
    }
  }
}
```

### Key IDs

| Field | Value |
|-------|-------|
| User ID | `0bfaff01-7e2f-4b60-811b-04b9909285ae` (same account created in §1 Register Owner) |
| Login email | `owner.test1@petsitterpro.dev` |
| JWT (this login) | see `token` above — freshly signed on each login, expires 24h from issue |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Wrong password | `UNAUTHENTICATED` — "Invalid email or password" |
| Nonexistent email | `UNAUTHENTICATED` — "Invalid email or password" (identical message/code to wrong password — anti-enumeration behavior confirmed working) |

### Notes
- Fresh JWT each login (different `iat`/`exp`/signature from the `registerOwner` token, same `userId`), as expected.

---

## 3. Register Customer

### Input

```graphql
mutation RegisterCustomer($input: RegisterCustomerInput!) {
  registerCustomer(input: $input) {
    token
    user {
      id
      email
      firstName
      lastName
      phone
      globalRole
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "customer.test1@petsitterpro.dev",
    "password": "TestPass123!",
    "firstName": "Casey",
    "lastName": "Customer",
    "phone": "+12065550199"
  }
}
```

### Response

```json
{
  "data": {
    "registerCustomer": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDY1YTNmOS1hZWM2LTRkNjYtYTlmNS1lMDVjZjE4MzkyYWMiLCJlbWFpbCI6ImN1c3RvbWVyLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDQ3NzYwMywiZXhwIjoxNzg0NTY0MDAzfQ.WDLKWjVSBAn4_IdO7aFOiGIy0H0PFRoYUhbBiKsP1IY",
      "user": {
        "id": "7065a3f9-aec6-4d66-a9f5-e05cf18392ac",
        "email": "customer.test1@petsitterpro.dev",
        "firstName": "Casey",
        "lastName": "Customer",
        "phone": "+12065550199",
        "globalRole": "USER",
        "createdAt": "1784477603872"
      }
    }
  }
}
```

### Key IDs

| Field | Value |
|-------|-------|
| User ID (customer) | `7065a3f9-aec6-4d66-a9f5-e05cf18392ac` |
| Customer email | `customer.test1@petsitterpro.dev` |
| Customer password | `TestPass123!` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Duplicate email (`customer.test1@petsitterpro.dev` reused) | `BAD_USER_INPUT` — "An account with this email already exists" |
| Weak password (`"weak"`) | `BAD_USER_INPUT` — same four-rule Zod message as `registerOwner` (shared `passwordField` schema) |

### Notes
- Also creates an empty `CustomerProfile` row (no `address`/`city`/`location`) linked to this user — nothing bookable yet until pets/location are added via other mutations.

---

## 4. Invite Employee (& Manager)

Same mutation, called twice with different `role`/`email` to onboard one of each into Puget Sound
Pet Care. Both calls sent with `Authorization: Bearer <owner JWT>` (the `owner.test1@petsitterpro.dev`
account from §1 — `inviteEmployee` requires an active OWNER/MANAGER of the target business).

### Input

```graphql
mutation InviteEmployee($input: InviteInput!) {
  inviteEmployee(input: $input) {
    id
    email
    role
    expiresAt
    isAccepted
  }
}
```

**Variables (Employee):**
```json
{
  "input": {
    "email": "employee.test1@petsitterpro.dev",
    "role": "EMPLOYEE",
    "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a"
  }
}
```

**Variables (Manager):**
```json
{
  "input": {
    "email": "manager.test1@petsitterpro.dev",
    "role": "MANAGER",
    "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a"
  }
}
```

### Response

**Employee:**
```json
{
  "data": {
    "inviteEmployee": {
      "id": "ee5e3641-5154-4d07-a550-ddde2ff14a47",
      "email": "employee.test1@petsitterpro.dev",
      "role": "EMPLOYEE",
      "expiresAt": "1784650998905",
      "isAccepted": false
    }
  }
}
```

**Manager:**
```json
{
  "data": {
    "inviteEmployee": {
      "id": "1cc2dd09-76c0-43ee-b055-699de8783f55",
      "email": "manager.test1@petsitterpro.dev",
      "role": "MANAGER",
      "expiresAt": "1784650998971",
      "isAccepted": false
    }
  }
}
```

### Key IDs

| Field | Value |
|-------|-------|
| Employee invitation ID | `ee5e3641-5154-4d07-a550-ddde2ff14a47` |
| Employee invitee email | `employee.test1@petsitterpro.dev` |
| Manager invitation ID | `1cc2dd09-76c0-43ee-b055-699de8783f55` |
| Manager invitee email | `manager.test1@petsitterpro.dev` |
| Business | Puget Sound Pet Care (`eeed145f-246b-4c14-8b1a-246850d1ea8a`) |
| Invitation token | **not returned by this mutation** — `Invitation.token` isn't a GraphQL field on `Invitation`. Only reachable via the server's dev-mode console log or a direct DB read. Will need it for `acceptInvitation` later. |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Duplicate pending invitation (re-inviting `employee.test1@petsitterpro.dev` while still pending) | `BAD_USER_INPUT` — "A pending invitation already exists for this email address" |
| No `Authorization` header | `UNAUTHENTICATED` — "You must be logged in to send invitations" |
| Caller has no membership in the business (used the `customer.test1@petsitterpro.dev` JWT from §3) | `FORBIDDEN` — "You do not have permission to invite members to this business" |
| Invalid `role` (`"OWNER"`) | `BAD_USER_INPUT` — "Role must be MANAGER or EMPLOYEE" |

### Notes
- No real email was sent — `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS` are unset in `.env`, so `sendInvitationEmail` takes its dev fallback (console-logs the token + accept link instead of calling SMTP). Confirmed safe to use made-up test addresses here.
- Invitations expire in 48h (`INVITATION_EXPIRY_HOURS` in `inviteEmployee.ts`) — longer than the 24h default JWT lifetime, so an invite can outlive the token of whoever sent it.
- Untested here: a MANAGER attempting to invite another MANAGER (should be `FORBIDDEN` — "Managers can only invite Employees"). Requires an accepted MANAGER account first, so this is a good candidate to verify once `acceptInvitation` is tested.
- Also noticed in passing (not tested): `InviteInput.businessId` is validated by Zod as just a non-empty string (`z.string().min(1, ...)`), not `.uuid()` like other ID fields in this schema — a malformed but non-empty ID would pass Zod and only fail later at the Prisma lookup (business not found / no membership).

---

## 5. Accept Invitation

Accepting both invitations from §4. Both invitees were brand-new emails with no existing `User`
account, so both went through PATH A (new user) — token + password + firstName + lastName
required, phone optional.

### Input

```graphql
mutation AcceptInvitation($input: AcceptInvitationInput!) {
  acceptInvitation(input: $input) {
    token
    user {
      id
      email
      firstName
      lastName
      phone
      globalRole
    }
  }
}
```

**Variables (Employee):**
```json
{
  "input": {
    "token": "d3f0c57245a8a87af57d774847a051b394f8fde77f4ef04c1be05d25b5a790d5",
    "password": "TestPass123!",
    "firstName": "Erin",
    "lastName": "Employee",
    "phone": "+12065550111"
  }
}
```

**Variables (Manager):**
```json
{
  "input": {
    "token": "9f5e62ceccabd799fd01b50f60fa67c341a617a77da8c056aa8041bb17cc9df9",
    "password": "TestPass123!",
    "firstName": "Morgan",
    "lastName": "Manager",
    "phone": "+12065550122"
  }
}
```

### Response

**Employee:**
```json
{
  "data": {
    "acceptInvitation": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYTdhYTY4OC00NDI2LTQ1MWMtOGVkNy04YjE3YmFiZTAzNjMiLCJlbWFpbCI6ImVtcGxveWVlLnRlc3QxQHBldHNpdHRlcnByby5kZXYiLCJnbG9iYWxSb2xlIjoiVVNFUiIsImlhdCI6MTc4NDQ3ODgxNCwiZXhwIjoxNzg0NTY1MjE0fQ.IVIALMl_FuxBPswBMymV602yF-xUhKc53cUx6Iuix48",
      "user": {
        "id": "ca7aa688-4426-451c-8ed7-8b17babe0363",
        "email": "employee.test1@petsitterpro.dev",
        "firstName": "Erin",
        "lastName": "Employee",
        "phone": "+12065550111",
        "globalRole": "USER"
      }
    }
  }
}
```

**Manager:**
```json
{
  "data": {
    "acceptInvitation": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMGJlNjBmMC03ZDk5LTQ3MGMtYWQyNC1lOGRkZDEzMTQyNDEiLCJlbWFpbCI6Im1hbmFnZXIudGVzdDFAcGV0c2l0dGVycHJvLmRldiIsImdsb2JhbFJvbGUiOiJVU0VSIiwiaWF0IjoxNzg0NDc4ODE1LCJleHAiOjE3ODQ1NjUyMTV9.aQzRQqp8L43ffRITnSLqSAWZ-HneDpKCqKsWZfWq0vA",
      "user": {
        "id": "20be60f0-7d99-470c-ad24-e8ddd1314241",
        "email": "manager.test1@petsitterpro.dev",
        "firstName": "Morgan",
        "lastName": "Manager",
        "phone": "+12065550122",
        "globalRole": "USER"
      }
    }
  }
}
```

### Key IDs

| Field | Value |
|-------|-------|
| Employee User ID | `ca7aa688-4426-451c-8ed7-8b17babe0363` |
| Employee email / password | `employee.test1@petsitterpro.dev` / `TestPass123!` |
| Manager User ID | `20be60f0-7d99-470c-ad24-e8ddd1314241` |
| Manager email / password | `manager.test1@petsitterpro.dev` / `TestPass123!` |
| Business | Puget Sound Pet Care (`eeed145f-246b-4c14-8b1a-246850d1ea8a`) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Reusing the employee token after it was already accepted | `BAD_USER_INPUT` — "This invitation has already been used." |
| Nonexistent/invalid token | `BAD_USER_INPUT` — "Invalid invitation token." |

### Notes
- Both tokens came from the dev-mode console log (SMTP unconfigured, see §4) — pasted in directly rather than read via a DB script.
- Both invitees went through PATH A (new user) since neither email had an existing account. Two related paths are still untested and would need a fresh invitation + token to reach: PATH B (an *existing* user accepting an invite to a second business) and the "missing password/firstName/lastName for a new user" validation error.
- Puget Sound Pet Care now has 3 active members: `owner.test1@petsitterpro.dev` (OWNER), `manager.test1@petsitterpro.dev` (MANAGER), `employee.test1@petsitterpro.dev` (EMPLOYEE).

---

## 6. Get Me

### Input

```graphql
query GetMe {
  getMe {
    id
    email
    firstName
    lastName
    phone
    globalRole
    createdAt
  }
}
```

No variables — the caller is derived entirely from the `Authorization: Bearer <token>` header.
Run once per role, using each account's current JWT (see Quick Reference at the top of this file).

### Response

**Owner:**
```json
{"data":{"getMe":{"id":"0bfaff01-7e2f-4b60-811b-04b9909285ae","email":"owner.test1@petsitterpro.dev","firstName":"Dylan","lastName":"Owner","phone":"+12065550100","globalRole":"USER","createdAt":"1784477086802"}}}
```

**Manager:**
```json
{"data":{"getMe":{"id":"20be60f0-7d99-470c-ad24-e8ddd1314241","email":"manager.test1@petsitterpro.dev","firstName":"Morgan","lastName":"Manager","phone":"+12065550122","globalRole":"USER","createdAt":"1784478815051"}}}
```

**Employee:**
```json
{"data":{"getMe":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.test1@petsitterpro.dev","firstName":"Erin","lastName":"Employee","phone":"+12065550111","globalRole":"USER","createdAt":"1784478814758"}}}
```

**Customer:**
```json
{"data":{"getMe":{"id":"7065a3f9-aec6-4d66-a9f5-e05cf18392ac","email":"customer.test1@petsitterpro.dev","firstName":"Casey","lastName":"Customer","phone":"+12065550199","globalRole":"USER","createdAt":"1784477603872"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Owner ID | `0bfaff01-7e2f-4b60-811b-04b9909285ae` |
| Manager ID | `20be60f0-7d99-470c-ad24-e8ddd1314241` |
| Employee ID | `ca7aa688-4426-451c-8ed7-8b17babe0363` |
| Customer ID | `7065a3f9-aec6-4d66-a9f5-e05cf18392ac` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| No `Authorization` header | `UNAUTHENTICATED` — "You must be logged in." |

### Notes
- Each call correctly returned the caller's own profile only, keyed off `context.user.userId` from the decoded JWT — no cross-account leakage.

---

## 7. Get User By Id

### Input

```graphql
query GetUserById($userId: ID!) {
  getUserById(userId: $userId) {
    id
    email
    firstName
    lastName
    phone
    globalRole
    createdAt
  }
}
```

**Variables (looking up the employee):**
```json
{ "userId": "ca7aa688-4426-451c-8ed7-8b17babe0363" }
```

**Variables (looking up the customer):**
```json
{ "userId": "7065a3f9-aec6-4d66-a9f5-e05cf18392ac" }
```

Both sent with `Authorization: Bearer <manager JWT>` — caller is `manager.test1@petsitterpro.dev`.

### Response

**Employee:**
```json
{"data":{"getUserById":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.test1@petsitterpro.dev","firstName":"Erin","lastName":"Employee","phone":"+12065550111","globalRole":"USER","createdAt":"1784478814758"}}}
```

**Customer:**
```json
{"data":{"getUserById":{"id":"7065a3f9-aec6-4d66-a9f5-e05cf18392ac","email":"customer.test1@petsitterpro.dev","firstName":"Casey","lastName":"Customer","phone":"+12065550199","globalRole":"USER","createdAt":"1784477603872"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Caller | Manager — `manager.test1@petsitterpro.dev` (`20be60f0-7d99-470c-ad24-e8ddd1314241`) |
| Looked up: Employee | `ca7aa688-4426-451c-8ed7-8b17babe0363` |
| Looked up: Customer | `7065a3f9-aec6-4d66-a9f5-e05cf18392ac` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Nonexistent `userId` (`00000000-0000-0000-0000-000000000000`) | `NOT_FOUND` — "No user found with ID: 00000000-0000-0000-0000-000000000000" |
| No `Authorization` header | `UNAUTHENTICATED` — "You must be logged in." |

### Notes
- `getUserById` has no business-scoping or relationship check at all — the resolver (`resolvers/user/queries/getUserById.ts`) only checks `context.user != null`, then does a bare `user.findUnique({ where: { id } })`. The manager successfully looked up the customer's email/name/phone even though that customer has no relationship whatsoever to Puget Sound Pet Care. **Confirmed intentional** — any logged-in user can look up any other user's basic profile by ID, by design; left as-is.
- No `passwordHash` is exposed either way (`User` GraphQL type never includes it), so this is a PII-exposure concern (email/phone/name via UUID), not a credential leak.

---

## 8. Health Check

### Input

```graphql
query { healthCheck }
```

No variables, no auth required.

### Response

```json
{"data":{"healthCheck":"Server is up and running smoothly!"}}
```

### Key IDs

N/A — no entities involved.

### Negative cases tested

N/A — no auth and no input to violate.

### Notes
- Purely a liveness string, distinct from the REST `/health` route (which also checks DB connectivity). This GraphQL version doesn't touch the DB at all.

---

## 9. Get My Businesses

### Input

```graphql
query { getMyBusinesses { id name description isActive isVerified reviewCount createdAt } }
```

No variables. Called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"getMyBusinesses":[{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","description":"A friendly neighborhood pet sitting business for testing.","isActive":true,"isVerified":false,"reviewCount":0,"createdAt":"1784477086805"}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Business returned | Puget Sound Pet Care (`eeed145f-246b-4c14-8b1a-246850d1ea8a`) |

### Negative cases tested

Not run separately — no-auth `UNAUTHENTICATED` already exercised on `getMe`/`getUserById`/etc. via the identical auth-guard pattern.

### Notes
- Confirms the owner's one business shows up correctly. Worth re-checking list ordering once an account belongs to 2+ businesses.

---

## 10. Get Business Members

### Input

```graphql
query GetBusinessMembers($businessId: ID!) {
  getBusinessMembers(businessId: $businessId) {
    id
    role
    isActive
    joinedAt
    user {
      id
      email
      firstName
      lastName
    }
  }
}
```

**Variables:**
```json
{ "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a" }
```

Called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"getBusinessMembers":[{"id":"f6f86288-8cb4-4f08-a79d-7e1bdc2d9f6d","role":"OWNER","isActive":true,"joinedAt":"1784477086813","user":{"id":"0bfaff01-7e2f-4b60-811b-04b9909285ae","email":"owner.test1@petsitterpro.dev","firstName":"Dylan","lastName":"Owner"}},{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533","role":"EMPLOYEE","isActive":true,"joinedAt":"1784478814760","user":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.test1@petsitterpro.dev","firstName":"Erin","lastName":"Employee"}},{"id":"68081d4b-8bf9-4099-b6ec-2806cf8b1c5a","role":"MANAGER","isActive":true,"joinedAt":"1784478815052","user":{"id":"20be60f0-7d99-470c-ad24-e8ddd1314241","email":"manager.test1@petsitterpro.dev","firstName":"Morgan","lastName":"Manager"}}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Owner BusinessMember ID | `f6f86288-8cb4-4f08-a79d-7e1bdc2d9f6d` |
| Manager BusinessMember ID | `68081d4b-8bf9-4099-b6ec-2806cf8b1c5a` |
| Employee BusinessMember ID | `cc28c51f-3c59-4c44-9cea-cf881b468533` |

(Also now saved in the Quick Reference table at the top of this file.)

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Caller has no membership in the business (customer JWT) | `FORBIDDEN` — "You are not a member of this business." |

### Notes
- Ordered by `joinedAt` ascending as documented: owner (created with the business) first, then employee, then manager — matches invitation-acceptance order from §5.

---

## 11. Get My Pets

### Input

```graphql
query { getMyPets { id name } }
```

No variables. Called with `Authorization: Bearer <customer JWT>`.

### Response

```json
{"data":{"getMyPets":[]}}
```

### Key IDs

N/A — no pets exist for this customer yet.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Caller has no `CustomerProfile` (used the owner JWT) | `FORBIDDEN` — "Only customers can have pets." |

### Notes
- Empty array confirms the query works correctly before any pets exist. Will retest with real data once `addPet` runs in the customer-readiness phase.

---

## 12. Update User

### Input

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    id
    firstName
    lastName
    phone
    avatarUrl
  }
}
```

**Variables:**
```json
{ "input": { "phone": "+12065559999", "avatarUrl": "https://example.com/avatars/morgan.jpg" } }
```

Called with `Authorization: Bearer <manager JWT>`.

### Response

```json
{"data":{"updateUser":{"id":"20be60f0-7d99-470c-ad24-e8ddd1314241","firstName":"Morgan","lastName":"Manager","phone":"+12065559999","avatarUrl":"https://example.com/avatars/morgan.jpg"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Updated user | Manager — `20be60f0-7d99-470c-ad24-e8ddd1314241` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Empty input (`{}`) | `BAD_USER_INPUT` — "At least one field must be provided to update" |

### Notes
- Manager's phone is now permanently `+12065559999` (was `+12065550122`) for the rest of this test session.

---

## 13. Set Business Location

### Input

```graphql
mutation SetBusinessLocation($input: SetBusinessLocationInput!) {
  setBusinessLocation(input: $input) {
    id
    name
  }
}
```

**Variables:**
```json
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "latitude": 47.6062, "longitude": -122.3321 } }
```

Called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"setBusinessLocation":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Business | Puget Sound Pet Care — `eeed145f-246b-4c14-8b1a-246850d1ea8a` |
| Location set to | `47.6062, -122.3321` (downtown Seattle) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Caller has no membership in the business (customer JWT) | `FORBIDDEN` — "You do not have permission to update this business." |

### Notes
- First mutation in the app to ever touch `Business.location` for this business — it was `NULL` since `registerOwner` never sets it. Confirmed via the `getNearbyBusinesses` test in §19 below.

---

## 14. Update Business

### Input

```graphql
mutation UpdateBusiness($input: UpdateBusinessInput!) {
  updateBusiness(input: $input) {
    id
    name
    description
  }
}
```

**Variables:**
```json
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "description": "Trusted, insured pet care across Seattle. Walks, drop-ins, boarding, and more." } }
```

Called with `Authorization: Bearer <manager JWT>`.

### Response

```json
{"data":{"updateBusiness":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","description":"Trusted, insured pet care across Seattle. Walks, drop-ins, boarding, and more."}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Business updated | Puget Sound Pet Care — `eeed145f-246b-4c14-8b1a-246850d1ea8a` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Empty update (`{ businessId }` only, no `name`/`description`) | `BAD_USER_INPUT` — "At least one field (name or description) must be provided to update" |

### Notes
- Confirms a MANAGER (not just OWNER) can update the business, matching the documented OWNER-or-MANAGER rule.
- `UpdateBusinessInput` only exposes `name`/`description` — there's no mutation for `addressLine`/`city`/`neighborhood`/`heroPhotoUrl` yet, despite those being real `Business` columns exposed for reads. Not a bug, just a current gap (matches `AI_MANIFEST.md`, which never lists a way to set them either).

---

## 15. Activate Seeded Catalog Items (`updateServiceOffering` + `updateServicePackage`)

The 6 `ServiceOffering`s seeded by `registerOwner` (§1) are all inactive with inactive packages —
nothing was bookable. Activating "Dog Walking" and one of its packages here.

### Input

```graphql
mutation UpdateServiceOffering($input: UpdateServiceOfferingInput!) {
  updateServiceOffering(input: $input) {
    id
    title
    category
    isActive
    basePrice
    features
  }
}
```

```graphql
mutation UpdateServicePackage($input: UpdateServicePackageInput!) {
  updateServicePackage(input: $input) {
    id
    title
    isActive
    sessionsCount
    pricePerSession
  }
}
```

**Variables (offering):**
```json
{ "input": { "serviceOfferingId": "ee6d47cc-d0d7-4358-bb56-1a42fccc0cae", "isActive": true, "category": "WALKING", "basePrice": 25.00, "features": ["GPS tracked", "Photo updates", "Insured"] } }
```

**Variables (package):**
```json
{ "input": { "servicePackageId": "67660041-e84d-4bdb-a0e5-c1e0b6461b3e", "isActive": true } }
```

Both called with `Authorization: Bearer <manager JWT>`.

### Response

```json
{"data":{"updateServiceOffering":{"id":"ee6d47cc-d0d7-4358-bb56-1a42fccc0cae","title":"Dog Walking","category":"WALKING","isActive":true,"basePrice":25,"features":["GPS tracked","Photo updates","Insured"]}}}
```
```json
{"data":{"updateServicePackage":{"id":"67660041-e84d-4bdb-a0e5-c1e0b6461b3e","title":"Single (once a week)","isActive":true,"sessionsCount":1,"pricePerSession":30}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Dog Walking offering | `ee6d47cc-d0d7-4358-bb56-1a42fccc0cae` (now active, `basePrice: 25`) |
| "Single (once a week)" package | `67660041-e84d-4bdb-a0e5-c1e0b6461b3e` (now active, `pricePerSession: 30`) |
| Dog Walking's other packages (still inactive) | 2/3 Times a Week `cab01472-cccf-46ff-96f4-cbfe274ee871`, 4/5 Times a Week `abded84c-08fb-449f-94c4-1d56b8571b1f` |
| Still-inactive seeded offerings | Boarding `504b9af0-ef10-4751-b3cf-18f54cad3ad1`, House Sitting `a624be7e-cd13-4ddf-8326-bf0dae4aee1f`, Drop-In Visits `6d5adb85-0375-4648-be22-aa259752ddde`, Doggy Day Care `ca9703d7-51cf-48db-8807-102b9413ba0b`, Dog Training `9c61b300-d760-4969-bc89-efcef6cb8f91` (packages `ac943736-e3d7-4b32-822c-32240ffe49c7`, `3fdb26e3-41ac-462f-9757-e10b83c83041`, `32c5160d-cc44-4943-bd77-1add559c06ca`; add-on `f9df76ec-1630-4c98-ac33-183e54e468d8`) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `updateServiceOffering` called by customer JWT (not a member) | `FORBIDDEN` — "You do not have permission to manage services for this business." |

### Notes
- These IDs were discovered by calling `getServiceOfferings` as the owner (member view — returns every offering + nested packages/add-ons regardless of `isActive`) right after `registerOwner`, since the mutation response never surfaced them.
- Dog Walking's `pricePerSession: 30` on the now-active package is the seed default from `registerOwner` — untouched by this update, since only `isActive` was passed.

---

## 16. Create New Service Offering, Add-On & Package

Rather than only activating seeded rows, built one offering from scratch to exercise the full create
path for all three models.

### Input

```graphql
mutation CreateServiceOffering($input: CreateServiceOfferingInput!) {
  createServiceOffering(input: $input) { id title category isActive basePrice durationMinutes features }
}
mutation CreateServiceAddOn($input: CreateServiceAddOnInput!) {
  createServiceAddOn(input: $input) { id title pricePerSession perSession isActive }
}
mutation CreateServicePackage($input: CreateServicePackageInput!) {
  createServicePackage(input: $input) { id title sessionsCount pricePerSession isActive }
}
```

**Variables (offering):**
```json
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "title": "Cat Sitting Visits", "category": "DROP_IN", "description": "A caring visit for cats while you are away - feeding, litter, and playtime.", "durationMinutes": 20, "basePrice": 22.00, "features": ["Insured", "Photo updates"] } }
```

**Variables (add-on):**
```json
{ "input": { "serviceOfferingId": "fddafd5f-9e9a-49a4-aae3-82a0e6ee9820", "title": "Extra Cat", "pricePerSession": 10.00, "perSession": true } }
```

**Variables (package):**
```json
{ "input": { "serviceOfferingId": "fddafd5f-9e9a-49a4-aae3-82a0e6ee9820", "title": "5-Visit Pack", "sessionsCount": 5, "pricePerSession": 20.00 } }
```

All called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"createServiceOffering":{"id":"fddafd5f-9e9a-49a4-aae3-82a0e6ee9820","title":"Cat Sitting Visits","category":"DROP_IN","isActive":true,"basePrice":22,"durationMinutes":20,"features":["Insured","Photo updates"]}}}
```
```json
{"data":{"createServiceAddOn":{"id":"de4afa49-c3ea-4110-b808-e92aea416625","title":"Extra Cat","pricePerSession":10,"perSession":true,"isActive":true}}}
```
```json
{"data":{"createServicePackage":{"id":"df744c4d-5c85-47b8-9c9d-400c152be9a3","title":"5-Visit Pack","sessionsCount":5,"pricePerSession":20,"isActive":true}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Cat Sitting Visits offering | `fddafd5f-9e9a-49a4-aae3-82a0e6ee9820` (active by default, `basePrice: 22`) |
| Extra Cat add-on | `de4afa49-c3ea-4110-b808-e92aea416625` |
| 5-Visit Pack package | `df744c4d-5c85-47b8-9c9d-400c152be9a3` |

### Negative cases tested

Not repeated here — `FORBIDDEN`-for-non-member is already confirmed identically for `updateServiceOffering`/`deleteServiceOffering` (§15, §20), since all three go through the same `requireBusinessManager` helper.

### Notes
- Confirms `createServiceOffering` is **active by default** — the documented contrast with `registerOwner`'s seed offerings (created inactive).

---

## 17. Update Service Add-On

### Input

```graphql
mutation UpdateServiceAddOn($input: UpdateServiceAddOnInput!) {
  updateServiceAddOn(input: $input) {
    id
    title
    pricePerSession
    isActive
  }
}
```

**Variables:**
```json
{ "input": { "serviceAddOnId": "de4afa49-c3ea-4110-b808-e92aea416625", "pricePerSession": 12.00 } }
```

Called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"updateServiceAddOn":{"id":"de4afa49-c3ea-4110-b808-e92aea416625","title":"Extra Cat","pricePerSession":12,"isActive":true}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Add-on updated | Extra Cat — `de4afa49-c3ea-4110-b808-e92aea416625` (price now `12`, was `10`) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Empty update (`{ serviceAddOnId }` only) | `BAD_USER_INPUT` — "At least one field must be provided to update" |

### Notes
- Straightforward partial update; only `pricePerSession` changed, `title`/`perSession`/`isActive` untouched.

---

## 18. Service Catalog Reads — Member vs Public Visibility

Covers `getServiceOffering`, `getServiceOfferings`, `getServiceAddOn`, `getServiceAddOns`, and
`getServicePackages` together, since they all share the same `isActiveMember` visibility split and
are most meaningfully tested by comparing member vs. public results side by side.

### Input

```graphql
query GetServiceOffering($id: ID!) { getServiceOffering(serviceOfferingId: $id) { id title isActive addOns { id title isActive } packages { id title isActive } } }
query GetServiceOfferings($businessId: ID!) { getServiceOfferings(businessId: $businessId) { id title isActive } }
query GetServiceAddOn($id: ID!) { getServiceAddOn(serviceAddOnId: $id) { id title pricePerSession perSession isActive } }
query GetServiceAddOns($id: ID!) { getServiceAddOns(serviceOfferingId: $id) { id title } }
query GetServicePackages($id: ID!) { getServicePackages(serviceOfferingId: $id) { id title sessionsCount pricePerSession } }
```

**Variables used:** Cat Sitting Visits (`fddafd5f-9e9a-49a4-aae3-82a0e6ee9820`, active) for the
add-on/package list queries; Boarding (`504b9af0-ef10-4751-b3cf-18f54cad3ad1`, still inactive) to
prove the public-vs-member contrast on a single offering; the business ID for the full list query.

### Response

**`getServiceOffering` on Cat Sitting Visits — member (owner) and public, identical since it's active:**
```json
{"data":{"getServiceOffering":{"id":"fddafd5f-9e9a-49a4-aae3-82a0e6ee9820","title":"Cat Sitting Visits","isActive":true,"addOns":[{"id":"de4afa49-c3ea-4110-b808-e92aea416625","title":"Extra Cat","isActive":true}],"packages":[{"id":"df744c4d-5c85-47b8-9c9d-400c152be9a3","title":"5-Visit Pack","isActive":true}]}}}
```

**`getServiceOffering` on Boarding (inactive) — member (owner) sees it:**
```json
{"data":{"getServiceOffering":{"id":"504b9af0-ef10-4751-b3cf-18f54cad3ad1","title":"Boarding","isActive":false}}}
```

**`getServiceOffering` on Boarding (inactive) — public/unauthenticated:**
```json
{"errors":[{"message":"Service offering not found.","extensions":{"code":"NOT_FOUND"}}]}
```

**`getServiceOfferings` (list) — public/unauthenticated, hides all 5 still-inactive seeded offerings:**
```json
{"data":{"getServiceOfferings":[{"id":"fddafd5f-9e9a-49a4-aae3-82a0e6ee9820","title":"Cat Sitting Visits","isActive":true},{"id":"ee6d47cc-d0d7-4358-bb56-1a42fccc0cae","title":"Dog Walking","isActive":true}]}}
```

**`getServiceAddOn` (single, member):**
```json
{"data":{"getServiceAddOn":{"id":"de4afa49-c3ea-4110-b808-e92aea416625","title":"Extra Cat","pricePerSession":10,"perSession":true,"isActive":true}}}
```
(Ran before §17's price update — value shown is the pre-update `10`.)

**`getServiceAddOns` (list, public):**
```json
{"data":{"getServiceAddOns":[{"id":"de4afa49-c3ea-4110-b808-e92aea416625","title":"Extra Cat"}]}}
```

**`getServicePackages` (list, public):**
```json
{"data":{"getServicePackages":[{"id":"df744c4d-5c85-47b8-9c9d-400c152be9a3","title":"5-Visit Pack","sessionsCount":5,"pricePerSession":20}]}}
```

### Key IDs

See §16 for the Cat Sitting Visits offering/add-on/package IDs; Boarding is `504b9af0-ef10-4751-b3cf-18f54cad3ad1`.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `getServiceOffering` on an inactive offering, unauthenticated | `NOT_FOUND` — "Service offering not found." (not `FORBIDDEN` — matches the deliberate "don't confirm it exists" pattern used elsewhere, e.g. `updatePet`) |

### Notes
- **List-level visibility confirmed, not just single-item**: `getServiceOfferings` as public correctly returned only the 2 active offerings out of 6 total — the filter applies at the list level exactly like the single-item lookup.
- No dedicated `getServicePackage`/`getServiceAddOn`-by-parent-only-hides-inactive... — see §20 for a related discovery about how `getServicePackages` behaves once its *parent offering* (not the package itself) is deactivated.

---

## 19. Get Nearby Businesses

### Input

```graphql
query GetNearbyBusinesses($lat: Float!, $lng: Float!) {
  getNearbyBusinesses(latitude: $lat, longitude: $lng, radiusMiles: 25) {
    business { id name }
    distanceMiles
    fromPrice
  }
}
```

**Variables:**
```json
{ "lat": 47.6062, "lng": -122.3321 }
```

No auth — public query. Run after §13 (`setBusinessLocation`) and §16 (Cat Sitting Visits active
with `basePrice: 22`, cheaper than Dog Walking's `basePrice: 25`).

### Response

```json
{"data":{"getNearbyBusinesses":[{"business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care"},"distanceMiles":0,"fromPrice":22}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Business found | Puget Sound Pet Care — `eeed145f-246b-4c14-8b1a-246850d1ea8a` |
| `fromPrice` | `22` — correctly `MIN(basePrice)` across active offerings (Cat Sitting Visits `22` beats Dog Walking `25`) |
| `distanceMiles` | `0` — searched from the exact coordinates set in §13 |

### Negative cases tested

Not run this round — would need a second business with/without a location to meaningfully test the
`ST_DWithin`/radius boundary or the "business with `NULL` location never matches" behavior documented
in `AI_MANIFEST.md`. Worth a follow-up once a second test business exists.

### Notes
- Confirms the business was invisible before §13 (implied — it has no other way to appear) and is now discoverable with a correct, real-world-accurate price rollup.

---

## 20. Service Catalog Soft Deletes

Used throwaway records for all three deletes (a disposable offering + its own add-on + package),
so the real catalog built in §15/§16 stays intact for booking.

### Input

```graphql
mutation { createServiceOffering(input: $input) { id title isActive } }   # throwaway, then:
mutation { deleteServiceAddOn(serviceAddOnId: $id) { id isActive } }
mutation { deleteServiceOffering(serviceOfferingId: $id) { id isActive } }
mutation { deleteServicePackage(servicePackageId: $id) { id isActive } }
```

**Throwaway records created:** "ZZ Test Offering To Delete" (`237b35c7-8d95-41f0-a1f8-08b6416fa2ac`),
its add-on "ZZ Test AddOn To Delete" (`8d658d6e-2608-41c4-9e20-450682e0682c`), its package
"ZZ Test Package To Delete" (`1f38dc88-1d44-443f-8e26-9fa9c91ccf82`) — all created active via owner JWT.

### Response

**Delete the add-on:**
```json
{"data":{"deleteServiceAddOn":{"id":"8d658d6e-2608-41c4-9e20-450682e0682c","isActive":false}}}
```

**Delete the offering (package deliberately left alone first):**
```json
{"data":{"deleteServiceOffering":{"id":"237b35c7-8d95-41f0-a1f8-08b6416fa2ac","isActive":false}}}
```

**Immediately after, `getServiceOffering` (member view) on the now-inactive offering:**
```json
{"data":{"getServiceOffering":{"id":"237b35c7-8d95-41f0-a1f8-08b6416fa2ac","isActive":false,"packages":[{"id":"1f38dc88-1d44-443f-8e26-9fa9c91ccf82","title":"ZZ Test Package To Delete","isActive":true}],"addOns":[{"id":"8d658d6e-2608-41c4-9e20-450682e0682c","title":"ZZ Test AddOn To Delete","isActive":false}]}}}
```

**Delete the package (cleanup):**
```json
{"data":{"deleteServicePackage":{"id":"1f38dc88-1d44-443f-8e26-9fa9c91ccf82","isActive":false}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Deleted offering | `237b35c7-8d95-41f0-a1f8-08b6416fa2ac` |
| Deleted add-on | `8d658d6e-2608-41c4-9e20-450682e0682c` |
| Deleted package | `1f38dc88-1d44-443f-8e26-9fa9c91ccf82` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `deleteServiceOffering` called by customer JWT (not a member) | `FORBIDDEN` — "You do not have permission to manage services for this business." |
| Re-deleting the already-deactivated add-on | `BAD_USER_INPUT` — "This add-on is already deactivated." |

### Notes
- **Confirmed documented behavior**: `deleteServiceOffering` really does **not** cascade to its children — right after deleting the offering, its still-not-yet-deleted package showed `isActive: true` while nested under the now-`isActive: false` parent. Deleting each model is fully independent.
- **This orphaned-active state has no public exposure gap**, though: calling `getServicePackages(serviceOfferingId)` as public against that same (inactive-offering, still-active-package) combination 404s with "Service offering not found" — the resolver gates on the *parent offering's* visibility before it ever gets to filtering packages, so a hidden offering's still-technically-active child package isn't independently reachable through this query. (The package's own `isActive` flag matters for direct visibility once its parent is active; once the parent's hidden, the whole list 404s regardless.)

---

## 21. Add Pet

### Input

```graphql
mutation AddPet($input: AddPetInput!) {
  addPet(input: $input) {
    id
    name
    type
    breed
    age
    sex
    weightLb
    isNeutered
    isMicrochipped
    isActive
  }
}
```

**Variables (Biscuit):**
```json
{ "input": { "name": "Biscuit", "type": "DOG", "breed": "Golden Retriever", "age": 3, "sex": "MALE", "weightLb": 65, "isNeutered": true, "isMicrochipped": true, "careInstructions": "Loves belly rubs, walk twice daily", "homeAccessNotes": "Leash is on the hook by the front door", "vetName": "Dr. Chen", "vetClinic": "Ballard Vet Clinic", "vetPhone": "+12065551234" } }
```

**Variables (Whiskers):**
```json
{ "input": { "name": "Whiskers", "type": "CAT", "breed": "Tabby", "age": 5, "sex": "FEMALE", "weightLb": 9, "careInstructions": "Feed twice daily, litter box in laundry room" } }
```

**Variables (throwaway):**
```json
{ "input": { "name": "ZZ Test Pet To Delete", "type": "OTHER" } }
```

All called with `Authorization: Bearer <customer JWT>`.

### Response

```json
{"data":{"addPet":{"id":"edf9db53-9c4a-4e98-8bcb-7361ca856856","name":"Biscuit","type":"DOG","breed":"Golden Retriever","age":3,"sex":"MALE","weightLb":65,"isNeutered":true,"isMicrochipped":true,"isActive":true}}}
```
```json
{"data":{"addPet":{"id":"488d27df-dc69-4358-9b57-6ad14640a398","name":"Whiskers","type":"CAT","breed":"Tabby","age":5,"sex":"FEMALE","weightLb":9,"isActive":true}}}
```
```json
{"data":{"addPet":{"id":"aad37fea-3fa2-4f8e-8a18-ada2c0465996","name":"ZZ Test Pet To Delete","type":"OTHER","isActive":true}}}
```

**`getMyPets` right after, confirming all 3 (ordered by name ascending):**
```json
{"data":{"getMyPets":[{"id":"edf9db53-9c4a-4e98-8bcb-7361ca856856","name":"Biscuit","type":"DOG","isActive":true},{"id":"488d27df-dc69-4358-9b57-6ad14640a398","name":"Whiskers","type":"CAT","isActive":true},{"id":"aad37fea-3fa2-4f8e-8a18-ada2c0465996","name":"ZZ Test Pet To Delete","type":"OTHER","isActive":true}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Biscuit (DOG) | `edf9db53-9c4a-4e98-8bcb-7361ca856856` |
| Whiskers (CAT) | `488d27df-dc69-4358-9b57-6ad14640a398` |
| ZZ Test Pet To Delete (throwaway) | `aad37fea-3fa2-4f8e-8a18-ada2c0465996` |
| Owning customer | `customer.test1@petsitterpro.dev` (`7065a3f9-aec6-4d66-a9f5-e05cf18392ac`) |

### Negative cases tested

Not run separately for `addPet` itself — required-field (`name`/`type`) validation is the same Zod-driven `BAD_USER_INPUT` pattern already exercised elsewhere (e.g. §1/§3 registration).

### Notes
- `getMyPets` correctly ordered by `name` ascending (Biscuit, Whiskers, ZZ Test Pet To Delete) — matches the documented ordering (`Pet` has no `createdAt` field to sort by instead).

---

## 22. Update Pet

### Input

```graphql
mutation UpdatePet($input: UpdatePetInput!) {
  updatePet(input: $input) {
    id
    name
    age
    medicalNotes
    homeAccessNotes
  }
}
```

**Variables (real update — partial + clear a field):**
```json
{ "input": { "petId": "edf9db53-9c4a-4e98-8bcb-7361ca856856", "age": 4, "medicalNotes": "Mild seasonal allergies, no medication needed", "homeAccessNotes": "" } }
```

Called with `Authorization: Bearer <customer JWT>`.

### Response

```json
{"data":{"updatePet":{"id":"edf9db53-9c4a-4e98-8bcb-7361ca856856","name":"Biscuit","age":4,"medicalNotes":"Mild seasonal allergies, no medication needed","homeAccessNotes":null}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Pet updated | Biscuit — `edf9db53-9c4a-4e98-8bcb-7361ca856856` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Empty input (`{ petId }` only) | `BAD_USER_INPUT` — "At least one field must be provided to update" |
| Caller has no `CustomerProfile` (owner JWT) | `FORBIDDEN` — "Only customers can update pets." |
| Cross-account: a second customer (`customer.test2.throwaway@petsitterpro.dev`, registered just for this check) targeting Biscuit (not theirs) | `NOT_FOUND` — "Pet not found." (confirms the documented "don't reveal a pet exists on another account" pattern) |
| Same-owner but already-soft-deleted pet | `BAD_USER_INPUT` — "This pet has already been deleted." |

### Notes
- Empty string on `homeAccessNotes` correctly cleared it to `null`, confirming the empty-string-as-clear-sentinel behavior for clearable text fields.
- The second customer account used for the cross-account check (`b600c3a9-d35e-4740-80c8-0fb72733b54d`) is a disposable one-off, not part of the main test cast — just an ordinary registered account with no pets/bookings.

---

## 23. Delete Pet

### Input

```graphql
mutation DeletePet($id: ID!) {
  deletePet(petId: $id) {
    id
    isActive
  }
}
```

**Variables:**
```json
{ "id": "aad37fea-3fa2-4f8e-8a18-ada2c0465996" }
```

Called with `Authorization: Bearer <customer JWT>` (the throwaway "ZZ Test Pet To Delete" from §21).

### Response

```json
{"data":{"deletePet":{"id":"aad37fea-3fa2-4f8e-8a18-ada2c0465996","isActive":false}}}
```

**`getMyPets` right after, confirming the deleted pet is filtered out:**
```json
{"data":{"getMyPets":[{"id":"edf9db53-9c4a-4e98-8bcb-7361ca856856","name":"Biscuit","isActive":true},{"id":"488d27df-dc69-4358-9b57-6ad14640a398","name":"Whiskers","isActive":true}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Pet deleted | ZZ Test Pet To Delete — `aad37fea-3fa2-4f8e-8a18-ada2c0465996` |
| Remaining active pets | Biscuit `edf9db53-9c4a-4e98-8bcb-7361ca856856`, Whiskers `488d27df-dc69-4358-9b57-6ad14640a398` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Re-deleting the same pet (already inactive, same owner) | `BAD_USER_INPUT` — "This pet has already been deleted." |
| Cross-account: the throwaway second customer targeting Biscuit (not theirs, still active) | `NOT_FOUND` — "Pet not found." |

### Notes
- `updatePet` and `deletePet` now give matching results for every case: `NOT_FOUND` for another customer's pet, and a specific `BAD_USER_INPUT` ("This pet has already been deleted") for an already-deleted pet the caller owns.

---

## 24. Set Availability

### Input

```graphql
mutation SetAvailability($input: SetAvailabilityInput!) {
  setAvailability(input: $input) {
    dayOfWeek
    startTime
    endTime
    isAvailable
  }
}
```

**Variables (employee sets own full week — self-service path):**
```json
{ "input": { "memberId": "cc28c51f-3c59-4c44-9cea-cf881b468533", "slots": [
  {"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},
  {"dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},
  {"dayOfWeek":"WEDNESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},
  {"dayOfWeek":"THURSDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},
  {"dayOfWeek":"FRIDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},
  {"dayOfWeek":"SATURDAY","isAvailable":false},
  {"dayOfWeek":"SUNDAY","isAvailable":false}
] } }
```

**Variables (MANAGER edits the same employee's Monday only — business-managed path, partial-by-day):**
```json
{ "input": { "memberId": "cc28c51f-3c59-4c44-9cea-cf881b468533", "slots": [ {"dayOfWeek":"MONDAY","startTime":"10:00","endTime":"16:00","isAvailable":true} ] } }
```

### Response

**Full week, self-service (called with `Authorization: Bearer <employee JWT>`):**
```json
{"data":{"setAvailability":[{"id":"5d19b062-6710-46ab-a217-477ad5350ba5","dayOfWeek":"MONDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"id":"567747dd-5303-43bb-b2ae-a51c6bc29ce6","dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"id":"6b651ab0-d233-49b3-a42b-f208e31eeb78","dayOfWeek":"WEDNESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"id":"45ad2e63-ea12-4e0f-8a08-194d128bab32","dayOfWeek":"THURSDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"id":"f22bd285-b7a7-4008-a16b-574cb8381bc2","dayOfWeek":"FRIDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"id":"ef291d03-4276-4854-b563-fedc98c6d4ed","dayOfWeek":"SATURDAY","startTime":"00:00","endTime":"00:00","isAvailable":false},{"id":"fb3ea498-1522-4550-b468-bbf1a9253fa3","dayOfWeek":"SUNDAY","startTime":"00:00","endTime":"00:00","isAvailable":false}]}}
```

**Manager's partial edit (called with `Authorization: Bearer <manager JWT>`) — only Monday changed, rest of the week untouched:**
```json
{"data":{"setAvailability":[{"dayOfWeek":"MONDAY","startTime":"10:00","endTime":"16:00","isAvailable":true},{"dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"dayOfWeek":"WEDNESDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"dayOfWeek":"THURSDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"dayOfWeek":"FRIDAY","startTime":"09:00","endTime":"18:00","isAvailable":true},{"dayOfWeek":"SATURDAY","startTime":"00:00","endTime":"00:00","isAvailable":false},{"dayOfWeek":"SUNDAY","startTime":"00:00","endTime":"00:00","isAvailable":false}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Member scheduled | Employee — `cc28c51f-3c59-4c44-9cea-cf881b468533` (`employee.test1@petsitterpro.dev`) |
| Final schedule | Mon `10:00–16:00` (manager-edited), Tue–Fri `09:00–18:00`, Sat/Sun off |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Duplicate day in one payload (`MONDAY` twice) | `BAD_USER_INPUT` — "Each day can appear at most once" |
| Available day (`isAvailable` not `false`) with no `startTime`/`endTime` | `BAD_USER_INPUT` — "startTime and endTime are required unless the day is marked unavailable" |
| `endTime` before `startTime` (`18:00`→`09:00`) | `BAD_USER_INPUT` — "endTime must be after startTime" |
| Unrelated caller (customer JWT, not a member of this business) | `FORBIDDEN` — "You do not have permission to set this member's availability." |
| Nonexistent `memberId` | `NOT_FOUND` — "Member not found." |

### Notes
- **Confirmed bug: "toggle a day back on without resending times" is dead code, unreachable through the API.** The resolver's own comment (`setAvailability.ts` lines ~78-83) says toggling a day off with no times preserves the stored hours "so switching it back on restores them" without needing to resend times. I tested exactly that: toggled Tuesday off with `{"dayOfWeek":"TUESDAY","isAvailable":false}` (worked, preserved `09:00–18:00` underneath) — but toggling it back on with `{"dayOfWeek":"TUESDAY","isAvailable":true}` (or even `{"dayOfWeek":"TUESDAY"}`, omitting `isAvailable` and letting it default to `true`) both failed with `BAD_USER_INPUT`. Root cause: the Zod refine in `availabilitySlotSchema` (`validate.ts`) requires `startTime`/`endTime` whenever `slot.isAvailable !== false` — which includes `true` *and* `undefined` — so the resolver code path that restores preserved hours on re-activation can never actually be reached; Zod rejects the request before the resolver ever runs. A client following the documented UX ("just flip the toggle back on") gets a validation error instead. Had to resend the known `09:00–18:00` explicitly to actually restore Tuesday.
- The toggle-off case (the one that *is* reachable) worked correctly: `{"dayOfWeek":"TUESDAY","isAvailable":false}` preserved the `09:00–18:00` window underneath while `isAvailable` flipped to `false` — confirmed by reading the row back in the very next call before restoring it.
- Confirms partial-by-day behavior: the manager's single-day edit to Monday left Tuesday–Sunday completely untouched in the same response.
- Confirms the self-vs-business-managed permission split: the employee could set their own schedule, and the manager could separately set it for them; an unrelated customer could not.
- Did **not** set availability for the owner or manager — leaving them with no `EmployeeAvailability` rows at all is actually useful for Phase E: `getAvailableEmployees` should report them as "No availability set for this day" (the documented third state), giving a natural example of all three states in one place once that query runs.
- **Follow-up**: found the resolver's own comment overpromised what the code (and Zod) actually allow — "switching a day back on restores the stored hours" is unreachable, since `availabilitySlotSchema`'s refine requires `startTime`/`endTime` whenever `isAvailable` isn't `false`. Fixed the comment in `setAvailability.ts` to describe the real (safe, just asymmetric) behavior rather than change validation — turning a day off never needs times, turning it back on always does.

---

## 25. Create Booking

### Input

```graphql
mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    id
    totalPrice
    serviceOfferingId
    servicePackageId
    jobs { id jobNumber status price scheduledStartTime respondBy }
    addOns { id priceAtBooking }
  }
}
```

**Variables (Booking #1 — ad-hoc single session, Cat Sitting Visits + its add-on):**
```json
{ "input": {
  "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a",
  "serviceOfferingId": "fddafd5f-9e9a-49a4-aae3-82a0e6ee9820",
  "addOnIds": ["de4afa49-c3ea-4110-b808-e92aea416625"],
  "petIds": ["488d27df-dc69-4358-9b57-6ad14640a398"],
  "sessions": [ { "scheduledStartTime": "2026-07-22T15:00:00.000Z", "scheduledEndTime": "2026-07-22T15:20:00.000Z" } ],
  "specialInstructions": "Please use the back door, front lock sticks.",
  "accessCode": "4821"
} }
```

Called with `Authorization: Bearer <customer JWT>`. No `servicePackageId` (ad-hoc), so priced off the offering's `basePrice`.

### Response

```json
{"data":{"createBooking":{"id":"0ab6296a-e906-43a9-ae16-fb1b11dd93dc","totalPrice":34,"serviceOfferingId":"fddafd5f-9e9a-49a4-aae3-82a0e6ee9820","servicePackageId":null,"jobs":[{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","jobNumber":1,"status":"PENDING","price":22,"scheduledStartTime":"1784732400000","respondBy":"1784569380106"}],"addOns":[{"id":"9556ea46-2495-439a-9b99-f093071dad69","priceAtBooking":12}]}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Booking | `0ab6296a-e906-43a9-ae16-fb1b11dd93dc` |
| Job (jobNumber 1 — the very first job in the system) | `47117252-c172-4f2b-bc08-c73b5cc74a1f` |
| BookingAddOn | `9556ea46-2495-439a-9b99-f093071dad69` |

### Negative cases tested

Not run separately here — the DB-level validation checks (business/offering/package/add-on/pet existence and ownership) are covered contextually in later bookings where they're easier to trigger meaningfully (e.g. wrong session count for a package).

### Notes
- **Pricing confirmed exactly**: `totalPrice: 34` = `22` (Cat Sitting Visits `basePrice`) × 1 session + `12` (Extra Cat add-on, `perSession: true` × 1 session) + `0` (business has no `serviceFeeAmount` set — there's no mutation that can set it yet). `Job.price` correctly shows just the per-session rate (`22`), not the add-on/fee-inclusive total.
- **`respondBy` confirmed as the capped-at-+24h case**: the session is scheduled ~3 days out, so `respondBy` (`1784569380106`) is `now + 24h`, not the session's start time — matches the documented `min(now+24h, earliestStart)` rule landing on the 24h side when the session is far enough in the future.
- `jobNumber: 1` confirms the autoincrement starts fresh and correctly on this reset database.

---

## 26. Booking/Job Reads — `getMyBookings`, `getBusinessJobs`, `getJob` (+ `accessCode` gating)

### Input

```graphql
query { getMyBookings { id totalPrice jobs { id status } } }
query GetBusinessJobs($businessId: ID!, $statuses: [String!]) { getBusinessJobs(businessId: $businessId, statuses: $statuses) { id jobNumber status scheduledStartTime accessCode } }
query GetJob($jobId: ID!) { getJob(jobId: $jobId) { id status accessCode } }
```

**Variables:** `{ "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "statuses": ["PENDING"] }` for `getBusinessJobs`; `{ "jobId": "47117252-c172-4f2b-bc08-c73b5cc74a1f" }` for `getJob`.

### Response

**`getMyBookings` (customer):**
```json
{"data":{"getMyBookings":[{"id":"0ab6296a-e906-43a9-ae16-fb1b11dd93dc","totalPrice":34,"jobs":[{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","status":"PENDING"}]}]}}
```

**`getBusinessJobs` (owner, `statuses: ["PENDING"]`):**
```json
{"data":{"getBusinessJobs":[{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","jobNumber":1,"status":"PENDING","scheduledStartTime":"1784732400000","accessCode":"4821"}]}}
```

**`getJob` as the customer who created it:**
```json
{"data":{"getJob":{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","status":"PENDING","accessCode":null}}}
```

**`getJob` as owner:**
```json
{"data":{"getJob":{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","status":"PENDING","accessCode":"4821"}}}
```

**`getJob` as an unrelated employee (not assigned, not OWNER/MANAGER):**
```json
{"errors":[{"message":"You do not have permission to view this job.","extensions":{"code":"FORBIDDEN"}}]}
```

### Key IDs

Same booking/job as §25.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `getJob` by an employee who is neither the customer, the assigned sitter, nor an OWNER/MANAGER | `FORBIDDEN` — "You do not have permission to view this job." (`assertJobViewAccess`) |

### Notes
- **Notable, correct behavior**: the customer who *set* the access code (`"4821"`) gets `accessCode: null` back from `getJob` — they're not in the allowed group (assigned sitter or active OWNER/MANAGER) even though they created it. Confirms the field-level gate in `jobResolvers.ts` really does apply universally, including to the booking customer themselves.
- `accessCode` also came through correctly on the **nested** field inside `getBusinessJobs`' list results (not just single-item `getJob`), confirming the type-level resolver applies regardless of which query surfaced the `Job`.
- No employee/sitter is assigned to this job yet, so the "assigned sitter can view" branch of `assertJobViewAccess` isn't exercised here — will be in §27+ once `assignSitter` runs.

---

## 27. Decline Job

### Input

```graphql
mutation DeclineJob($id: ID!) { declineJob(jobId: $id) { id status declinedAt } }
```

**Variables:**
```json
{ "id": "47117252-c172-4f2b-bc08-c73b5cc74a1f" }
```

### Response

```json
{"data":{"declineJob":{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","status":"DECLINED","declinedAt":"1784483046348"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Job declined | jobNumber 1 — `47117252-c172-4f2b-bc08-c73b5cc74a1f` (now terminal, `DECLINED`) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Customer (not OWNER/MANAGER) tries to decline | `FORBIDDEN` — "You do not have permission to manage requests for this business." |
| Re-declining the same job after it's already `DECLINED` | `BAD_USER_INPUT` — "This job cannot be declined from its current status (DECLINED)." |

### Notes
- First job in the system is now intentionally terminal (`DECLINED`) — Booking #1 exists purely to exercise the cold-decline path and won't be touched again.

---

## 28. Create Booking #2 (5-Session Package) — The Full Happy Path

Booking #2 exists to walk one job all the way from `PENDING` through `COMPLETED`, a report card,
and a review — exercising `acceptJob`, `getAvailableEmployees`, `assignSitter`, `getMyJobs`,
`clockIn`, `postJobUpdate`, `getJobUpdates`, `clockOut`, `submitReportCard`, `leaveReview`, and
`getBusinessReviews` against **one consistent job** (the package's first session).

### Input

```graphql
mutation CreateBooking($input: CreateBookingInput!) {
  createBooking(input: $input) {
    id totalPrice
    jobs { id jobNumber status sessionNumber totalSessions price scheduledStartTime respondBy }
  }
}
```

**Variables:**
```json
{ "input": {
  "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a",
  "serviceOfferingId": "fddafd5f-9e9a-49a4-aae3-82a0e6ee9820",
  "servicePackageId": "df744c4d-5c85-47b8-9c9d-400c152be9a3",
  "addOnIds": ["de4afa49-c3ea-4110-b808-e92aea416625"],
  "petIds": ["488d27df-dc69-4358-9b57-6ad14640a398"],
  "sessions": [
    { "scheduledStartTime": "2026-07-20T02:00:00.000Z", "scheduledEndTime": "2026-07-20T02:20:00.000Z" },
    { "scheduledStartTime": "2026-07-21T02:00:00.000Z", "scheduledEndTime": "2026-07-21T02:20:00.000Z" },
    { "scheduledStartTime": "2026-07-22T02:00:00.000Z", "scheduledEndTime": "2026-07-22T02:20:00.000Z" },
    { "scheduledStartTime": "2026-07-23T02:00:00.000Z", "scheduledEndTime": "2026-07-23T02:20:00.000Z" },
    { "scheduledStartTime": "2026-07-24T02:00:00.000Z", "scheduledEndTime": "2026-07-24T02:20:00.000Z" }
  ],
  "specialInstructions": "Whiskers is a bit shy - give her a minute to warm up.",
  "accessCode": "9032"
} }
```

Called with `Authorization: Bearer <customer JWT>`, using the Cat Sitting Visits "5-Visit Pack" (§16).

### Response

```json
{"data":{"createBooking":{"id":"4b69571c-af1e-4786-a08d-9ac40872e8e3","totalPrice":160,"jobs":[{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","jobNumber":2,"status":"PENDING","sessionNumber":1,"totalSessions":5,"price":20,"scheduledStartTime":"1784512800000","respondBy":"1784512800000"},{"id":"0cca260f-0f92-4e94-aec1-72435aac7cba","jobNumber":3,"status":"PENDING","sessionNumber":2,"totalSessions":5,"price":20,"scheduledStartTime":"1784599200000","respondBy":"1784512800000"},{"id":"94525a0d-7639-4fa6-991d-ad98423ce1c6","jobNumber":4,"status":"PENDING","sessionNumber":3,"totalSessions":5,"price":20,"scheduledStartTime":"1784685600000","respondBy":"1784512800000"},{"id":"2353ce52-98e4-4c7b-b241-9fed51db5fcc","jobNumber":5,"status":"PENDING","sessionNumber":4,"totalSessions":5,"price":20,"scheduledStartTime":"1784772000000","respondBy":"1784512800000"},{"id":"27badf2b-5500-428c-be0d-b657b0fb7cae","jobNumber":6,"status":"PENDING","sessionNumber":5,"totalSessions":5,"price":20,"scheduledStartTime":"1784858400000","respondBy":"1784512800000"}]}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Booking | `4b69571c-af1e-4786-a08d-9ac40872e8e3` |
| Session 1 (jobNumber 2 — the one taken through the full lifecycle below) | `43fcc471-e464-42ef-9646-ccad64104d1b` |
| Sessions 2–5 (jobNumbers 3–6, left `PENDING` — used later for the `cancelJob` matrix) | `0cca260f-0f92-4e94-aec1-72435aac7cba`, `94525a0d-7639-4fa6-991d-ad98423ce1c6`, `2353ce52-98e4-4c7b-b241-9fed51db5fcc`, `27badf2b-5500-428c-be0d-b657b0fb7cae` |

### Negative cases tested

Not run here — see §29 for the wrong-status `assignSitter` case, which doubles as coverage of `createBooking`'s downstream state-machine guards.

### Notes
- **Pricing confirmed**: `totalPrice: 160` = `20` × 5 sessions (`100`) + `12` (Extra Cat add-on, `perSession: true`) × 5 sessions (`60`) + `0` fee.
- **`respondBy` confirmed as the *other* branch this time**: all 5 jobs share the identical `respondBy` (`1784512800000`), which exactly equals session 1's `scheduledStartTime` — since session 1 is scheduled less than 24h out, `min(now+24h, earliestStart)` resolves to `earliestStart` here, the opposite branch from §25's booking (which landed on `now+24h`). Both branches of the cap are now empirically confirmed.
- `jobNumber` continues the global autoincrement (2–6, following #1 from §25) — confirms it's sequential across bookings, not reset per-booking.

---

## 29. Accept Job + Get Available Employees

### Input

```graphql
mutation AcceptJob($id: ID!) { acceptJob(jobId: $id) { id status acceptedAt } }
query GetAvailableEmployees($jobId: ID!) { getAvailableEmployees(jobId: $jobId) { isAvailable conflictReason member { id role user { firstName lastName } } } }
```

**Variables:** `{ "id": "43fcc471-e464-42ef-9646-ccad64104d1b" }`

### Response

**`acceptJob` (owner):**
```json
{"data":{"acceptJob":{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","status":"ACCEPTED","acceptedAt":"1784483214625"}}}
```

**`getAvailableEmployees` (owner), run right after:**
```json
{"data":{"getAvailableEmployees":[{"isAvailable":false,"conflictReason":"No availability set for this day","member":{"id":"f6f86288-8cb4-4f08-a79d-7e1bdc2d9f6d","role":"OWNER","user":{"firstName":"Dylan","lastName":"Owner"}}},{"isAvailable":false,"conflictReason":"Only available 10:00–16:00","member":{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533","role":"EMPLOYEE","user":{"firstName":"Erin","lastName":"Employee"}}},{"isAvailable":false,"conflictReason":"No availability set for this day","member":{"id":"68081d4b-8bf9-4099-b6ec-2806cf8b1c5a","role":"MANAGER","user":{"firstName":"Morgan","lastName":"Manager"}}}]}}
```

### Key IDs

Same job as §28 (session 1, jobNumber 2).

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Re-`acceptJob` on the same job after it's already `ACCEPTED` | `BAD_USER_INPUT` — "This job cannot be accepted from its current status (ACCEPTED)." |

### Notes
- **All three documented availability states showed up in one call, exactly as hoped for by deliberately not configuring owner/manager availability in §24**: owner and manager both show `"No availability set for this day"` (no `EmployeeAvailability` row exists for them at all); the employee shows a *different* reason, `"Only available 10:00–16:00"` — they do have a row for this day, but the job's scheduled time (`02:00 UTC`) falls outside their configured window. That's the third, previously-unseen variant: "has availability, but this job's time doesn't fit."
- This confirms `getAvailableEmployees` is a real, correct, and purely advisory check — see §30 for confirmation that `assignSitter` doesn't enforce it.

---

## 30. Assign Sitter + Get My Jobs

### Input

```graphql
mutation AssignSitter($input: AssignSitterInput!) { assignSitter(input: $input) { id status assigneeId assignedAt } }
query { getMyJobs { id jobNumber status scheduledStartTime } }
```

**Variables:**
```json
{ "input": { "jobId": "43fcc471-e464-42ef-9646-ccad64104d1b", "assigneeId": "cc28c51f-3c59-4c44-9cea-cf881b468533" } }
```

### Response

**`assignSitter` (owner):**
```json
{"data":{"assignSitter":{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","status":"ASSIGNED","assigneeId":"cc28c51f-3c59-4c44-9cea-cf881b468533","assignedAt":"1784483256838"}}}
```

**`getMyJobs` (employee, run right after):**
```json
{"data":{"getMyJobs":[{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","jobNumber":2,"status":"ASSIGNED","scheduledStartTime":"1784512800000"}]}}
```

### Key IDs

Assignee: Employee — `cc28c51f-3c59-4c44-9cea-cf881b468533` (`employee.test1@petsitterpro.dev`).

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `assignSitter` on a still-`PENDING` job (session 2 of the same booking, `0cca260f-0f92-4e94-aec1-72435aac7cba`) | `BAD_USER_INPUT` — "Only accepted jobs can be assigned a sitter (current status: PENDING)." |

### Notes
- **Confirms `getAvailableEmployees` is advisory-only, by direct code read**: `assignSitter`'s resolver only checks the assignee is an active `BusinessMember` of the same business — no `EmployeeAvailability` lookup at all. The assignment above succeeded even though §29 reported this exact employee `isAvailable: false` for this job's time slot. The business can knowingly override the schedule; nothing stops it at the API layer.
- `getMyJobs` correctly picked up the newly-assigned job for the employee with no extra step needed.

---

## 31. Clock In, Post Job Update, Get Job Updates

### Input

```graphql
mutation ClockIn($id: ID!) { clockIn(jobId: $id) { id status actualStartTime } }
mutation PostJobUpdate($input: PostJobUpdateInput!) { postJobUpdate(input: $input) { id note photoUrl createdAt } }
query GetJobUpdates($id: ID!) { getJobUpdates(jobId: $id) { id note photoUrl createdAt } }
```

**Variables (postJobUpdate):**
```json
{ "input": { "jobId": "43fcc471-e464-42ef-9646-ccad64104d1b", "note": "Whiskers greeted me at the door, all good!", "photoUrl": "https://example.com/photos/whiskers1.jpg" } }
```

### Response

**`clockIn` (assigned employee):**
```json
{"data":{"clockIn":{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","status":"IN_PROGRESS","actualStartTime":"1784483284672"}}}
```

**`postJobUpdate`:**
```json
{"data":{"postJobUpdate":{"id":"bc0114dc-c3f9-491a-9111-f08a7a22da27","note":"Whiskers greeted me at the door, all good!","photoUrl":"https://example.com/photos/whiskers1.jpg","createdAt":"1784483284736"}}}
```

**`getJobUpdates`:**
```json
{"data":{"getJobUpdates":[{"id":"bc0114dc-c3f9-491a-9111-f08a7a22da27","note":"Whiskers greeted me at the door, all good!","photoUrl":"https://example.com/photos/whiskers1.jpg","createdAt":"1784483284736"}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| JobUpdate posted | `bc0114dc-c3f9-491a-9111-f08a7a22da27` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `clockIn` by the manager (not the assigned sitter) | `FORBIDDEN` — "Only the assigned sitter can clock in to this job." |
| `postJobUpdate` with neither `note` nor `photoUrl` | `BAD_USER_INPUT` — "Provide a note, a photo, or both" |

### Notes
- Clean round-trip: posted update shows up immediately and correctly in `getJobUpdates`.

---

## 32. Clock Out, Submit Report Card

### Input

```graphql
mutation ClockOut($id: ID!) { clockOut(jobId: $id) { id status actualEndTime } }
mutation SubmitReportCard($input: SubmitReportCardInput!) { submitReportCard(input: $input) { id mood peeCount poopCount ateFood drankWater gaveTreat summary } }
```

**Variables (submitReportCard):**
```json
{ "input": { "jobId": "43fcc471-e464-42ef-9646-ccad64104d1b", "mood": "HAPPY", "peeCount": 1, "ateFood": true, "gaveTreat": true, "summary": "Whiskers was playful and ate her full meal. No issues." } }
```

### Response

**`clockOut` (assigned employee):**
```json
{"data":{"clockOut":{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","status":"COMPLETED","actualEndTime":"1784483322252"}}}
```

**`submitReportCard`:**
```json
{"data":{"submitReportCard":{"id":"507c2b5d-40c7-42f9-89ad-fae19fbf1e5c","mood":"HAPPY","peeCount":1,"poopCount":0,"ateFood":true,"drankWater":false,"gaveTreat":true,"summary":"Whiskers was playful and ate her full meal. No issues."}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| ReportCard | `507c2b5d-40c7-42f9-89ad-fae19fbf1e5c` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Re-`submitReportCard` on the same job (already has one) | `BAD_USER_INPUT` — "A report card has already been submitted for this job." |

### Notes
- `clockOut` correctly transitioned the job straight to `COMPLETED` in one step (no separate `completeJob` call needed for the clock-in/out path — that mutation is the *manual override* for when clock-in/out wasn't used, tested separately later).
- Omitted fields (`poopCount`, `drankWater`) correctly fell back to their Prisma defaults (`0`, `false`) rather than erroring.

---

## 33. Leave Review + Get Business Reviews

### Input

```graphql
mutation LeaveReview($input: LeaveReviewInput!) { leaveReview(input: $input) { id rating comment tags isPublic } }
query GetBusinessReviews($id: ID!) { getBusinessReviews(businessId: $id) { id rating comment tags } }
```

**Variables (leaveReview):**
```json
{ "input": { "jobId": "43fcc471-e464-42ef-9646-ccad64104d1b", "rating": 5, "comment": "Erin was wonderful with Whiskers - great communication and photos!", "tags": ["On time", "Great photos"] } }
```

### Response

**`leaveReview` (customer):**
```json
{"data":{"leaveReview":{"id":"35488d76-ac68-465d-ab2f-83545d8b7f78","rating":5,"comment":"Erin was wonderful with Whiskers - great communication and photos!","tags":["On time","Great photos"],"isPublic":true}}}
```

**`getBusinessReviews` (public):**
```json
{"data":{"getBusinessReviews":[{"id":"35488d76-ac68-465d-ab2f-83545d8b7f78","rating":5,"comment":"Erin was wonderful with Whiskers - great communication and photos!","tags":["On time","Great photos"]}]}}
```

**`getMyBusinesses` (owner), run right after, to confirm the aggregate synced:**
```json
{"data":{"getMyBusinesses":[{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","avgRating":5,"reviewCount":1}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Review | `35488d76-ac68-465d-ab2f-83545d8b7f78` |

### Negative cases tested

Not run separately here — `leaveReview`'s guards (job ownership, `COMPLETED` status required, one-review-per-job) will be exercised more meaningfully once a second review is attempted later; nothing to trigger yet with only one completed job in the system.

### Notes
- **Confirmed the denormalized aggregate sync works end-to-end**: `Business.avgRating`/`reviewCount` were `null`/`0` before this (no reviews existed anywhere in the system), and correctly became `5`/`1` immediately after this single review — recomputed via `review.aggregate()` in the same transaction as the review insert, exactly as documented.
- This closes out the full happy-path job lifecycle for jobNumber 2: `PENDING → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED`, with a report card and a public review on top.

---

## 34. Complete Job (Manual Override)

### Input

```graphql
mutation CompleteJob($id: ID!) { completeJob(jobId: $id) { id status actualStartTime actualEndTime } }
```

**Variables:** `{ "id": "0cca260f-0f92-4e94-aec1-72435aac7cba" }` — Booking #2's session 2, accepted and assigned but never clocked in.

### Response

```json
{"data":{"completeJob":{"id":"0cca260f-0f92-4e94-aec1-72435aac7cba","status":"COMPLETED","actualStartTime":"1784483446672","actualEndTime":"1784483446672"}}}
```

### Key IDs

Job — jobNumber 3, session 2 of Booking #2 (§28) — `0cca260f-0f92-4e94-aec1-72435aac7cba`.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Called while still `PENDING` (before `acceptJob`/`assignSitter`) | `BAD_USER_INPUT` — "Cannot complete a job from its current status (PENDING)." |
| Re-`completeJob` after it's already `COMPLETED` | `BAD_USER_INPUT` — "Cannot complete a job from its current status (COMPLETED)." |

### Notes
- **Confirmed the backfill behavior**: since `clockIn` was never called, `completeJob` set **both** `actualStartTime` and `actualEndTime` to the same timestamp (`1784483446672`) rather than leaving `actualStartTime` null — matches the documented "backfills `actualStartTime` if it was never set, so reporting never sees a completed job with no start time."
- Confirmed allowed from `ASSIGNED` directly (didn't need `IN_PROGRESS` first) — matches "allowed from either `ASSIGNED` or `IN_PROGRESS`."

---

## 35. Cancel Job — Full Role × State Matrix

Covered every legal `(caller role, source status)` pair, plus every documented rejection path.
Used the 3 remaining sessions of Booking #2 (§28) for the customer-initiated cases, and three fresh
ad-hoc Dog Walking bookings for the business-initiated cases (each needing to reach a different
status first).

### Input

```graphql
mutation CancelJob($input: CancelJobInput!) { cancelJob(input: $input) { id status cancelledAt cancellationReason } }
```

### Cases run

| # | Caller | From status | Job | Result |
|---|--------|-------------|-----|--------|
| 1 | Customer | `PENDING` | jobNumber 4 — `94525a0d-7639-4fa6-991d-ad98423ce1c6` | ✅ `CANCELLED` |
| 2 | Customer | `ACCEPTED` | jobNumber 5 — `2353ce52-98e4-4c7b-b241-9fed51db5fcc` | ✅ `CANCELLED` |
| 3 | Customer | `ASSIGNED` | jobNumber 6 — `27badf2b-5500-428c-be0d-b657b0fb7cae` | ✅ `CANCELLED` |
| 4 | Owner | `ACCEPTED` | `f2e4b152-5e9d-4a5d-87f5-6c7a1c1b7ce8` (new ad-hoc Dog Walking booking) | ✅ `CANCELLED` |
| 5 | Owner | `ASSIGNED` | `d5a148fc-bd21-4ba1-81f7-8ece33fc50e0` (new ad-hoc Dog Walking booking) | ✅ `CANCELLED` |
| 6 | Owner | `IN_PROGRESS` | `d171c52a-9faf-464e-a565-d4d0696c0038` (new ad-hoc Dog Walking booking) | ✅ `CANCELLED` |

**Case 1 response (customer cancels PENDING, with a reason):**
```json
{"data":{"cancelJob":{"id":"94525a0d-7639-4fa6-991d-ad98423ce1c6","status":"CANCELLED","cancelledAt":"1784483499034","cancellationReason":"Schedule changed, no longer need this visit."}}}
```

**Case 6 response (owner cancels IN_PROGRESS, with a reason):**
```json
{"data":{"cancelJob":{"id":"d171c52a-9faf-464e-a565-d4d0696c0038","status":"CANCELLED","cancelledAt":"1784483699032","cancellationReason":"Sitter had to leave early, business cancelling remainder."}}}
```

(Cases 2–5 returned the analogous `{ id, status: "CANCELLED" }` shape — omitted here for brevity, all confirmed.)

### Key IDs

See the table above — 6 distinct jobs, one per matrix cell.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Owner/manager tries to cancel a `PENDING` job (wrong role for that state) | `BAD_USER_INPUT` — "A pending request is declined rather than cancelled — use declineJob." |
| Customer tries to cancel an `IN_PROGRESS` job (wrong role for that state) | `BAD_USER_INPUT` — "This job is already in progress. Contact the business to stop it." |
| Assigned sitter (employee) tries to cancel their own assigned job | `FORBIDDEN` — "You do not have permission to cancel this job." (sitters have **zero** cancel permission, confirmed — not even from a state they'd have via another role) |
| Re-cancelling an already-`CANCELLED` job | `BAD_USER_INPUT` — "This job is already cancelled and cannot be cancelled." |

### Notes
- **All 6 legal `(role, status)` cells confirmed working, plus both asymmetric wrong-role rejections and the terminal-reuse guard** — this is full coverage of the documented matrix in `AI_MANIFEST.md` / `cancelJob.ts`.
- `cancellationReason` round-tripped correctly when provided (case 1, case 6) and `assigneeId` was left in place after cancelling assigned/in-progress jobs (not spot-checked via a query here, but confirmed by code — cancelJob never touches `assigneeId`).
- **Not yet tested**: the "union of roles" scenario — one person who is *both* the job's customer *and* an active OWNER/MANAGER, who should get the combined permission set (e.g. able to cancel `IN_PROGRESS` via their staff role even though as "just a customer" they couldn't). Requires making an existing customer also a business member first — in progress as a follow-up.

---

## 36. Resend Invitation

Used the throwaway `employee.test2.throwaway@petsitterpro.dev` invite for this — pending, never
accepted yet at this point.

### Input

```graphql
mutation ResendInvitation($input: InviteInput!) { resendInvitation(input: $input) { id email role expiresAt isAccepted } }
```

**Variables:**
```json
{ "input": { "email": "employee.test2.throwaway@petsitterpro.dev", "role": "EMPLOYEE", "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a" } }
```

Called with `Authorization: Bearer <owner JWT>`.

### Response

```json
{"data":{"resendInvitation":{"id":"f7b95852-3ae1-4348-951c-1c305316500e","email":"employee.test2.throwaway@petsitterpro.dev","role":"EMPLOYEE","expiresAt":"1784656667603","isAccepted":false}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Invitation | `f7b95852-3ae1-4348-951c-1c305316500e` (same row as the original invite — resend regenerates its token/expiry, doesn't create a new row) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Resending for an email with no pending invitation | `NOT_FOUND` — "No pending invitation found for this email address. Use inviteEmployee to send a new one." |

### Notes
- **Confirmed the old token was actually invalidated, not just superseded in name**: tried `acceptInvitation` with the *original* (pre-resend) token afterward and got `BAD_USER_INPUT` — "Invalid invitation token." — then the *new* (post-resend) token accepted successfully. Confirms `resendInvitation` overwrites the same `Invitation` row's token rather than leaving the old one usable alongside a new one.

---

## 37. Remove Member + Get Inactive Business Members

### Input

```graphql
mutation RemoveMember($input: RemoveMemberInput!) { removeMember(input: $input) { id role isActive } }
query GetInactiveBusinessMembers($id: ID!) { getInactiveBusinessMembers(businessId: $id) { id role isActive user { email } } }
```

**Variables (removeMember):**
```json
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "memberId": "9c871f6a-adbb-4c0d-b13b-a84f79ae0e17" } }
```

### Response

**`removeMember`, owner removes the throwaway employee ("Zack Throwaway", from §36's invite):**
```json
{"data":{"removeMember":{"id":"9c871f6a-adbb-4c0d-b13b-a84f79ae0e17","role":"EMPLOYEE","isActive":false}}}
```

**`getInactiveBusinessMembers`, run right after:**
```json
{"data":{"getInactiveBusinessMembers":[{"id":"9c871f6a-adbb-4c0d-b13b-a84f79ae0e17","role":"EMPLOYEE","isActive":false,"user":{"email":"employee.test2.throwaway@petsitterpro.dev"}}]}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Removed member | Zack Throwaway (EMPLOYEE) — `9c871f6a-adbb-4c0d-b13b-a84f79ae0e17` |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| A MANAGER tries to remove another MANAGER (the dual-role customer from §36 setup — MANAGERs may only remove EMPLOYEEs) | `FORBIDDEN` — "Managers can only remove Employees." |
| OWNER tries to remove themselves | `BAD_USER_INPUT` — "You cannot remove yourself from the business." |
| Re-removing the same member after they're already inactive | `BAD_USER_INPUT` — "This member has already been removed." |

### Notes
- `getInactiveBusinessMembers` correctly returned exactly the one just-removed member, with their `user` relation intact.

---

## 38. Cancel Job — Bonus: Union of Roles

Follow-up to §35. One person — `customer.test1@petsitterpro.dev` — is now **both** the job's customer
**and** an active MANAGER of the business (accepted a second invitation as an existing user, PATH B
of `acceptInvitation`). Confirms the documented "both roles resolved independently, caller gets the
union" behavior with a real dual-role account rather than just reading the code.

### Input

Same `createBooking` → `acceptJob` → `assignSitter` → `clockIn` → `cancelJob` sequence as before,
but `createBooking`, `acceptJob`, `assignSitter`, and `cancelJob` were **all four** called with the
same dual-role account's JWT.

### Response

```json
{"data":{"acceptJob":{"id":"15300171-2cc5-42f5-94c9-3b8fb880105a","status":"ACCEPTED"}}}
{"data":{"assignSitter":{"id":"15300171-2cc5-42f5-94c9-3b8fb880105a","status":"ASSIGNED"}}}
{"data":{"clockIn":{"id":"15300171-2cc5-42f5-94c9-3b8fb880105a","status":"IN_PROGRESS"}}}
{"data":{"cancelJob":{"id":"15300171-2cc5-42f5-94c9-3b8fb880105a","status":"CANCELLED"}}}
```

### Key IDs

| Field | Value |
|-------|-------|
| Job | `15300171-2cc5-42f5-94c9-3b8fb880105a` |
| Dual-role account | `customer.test1@petsitterpro.dev` — `CustomerProfile` owner **and** `BusinessMember` (MANAGER, `8f024572-3ff9-4651-b4b8-d2979ab2f40a`) |

### Negative cases tested

None new — this section is specifically about confirming a *positive* case that §35 couldn't reach with single-role accounts.

### Notes
- **The interesting part isn't just the final cancel — it's that `acceptJob` and `assignSitter` (both OWNER/MANAGER-only) succeeded when called with this account's JWT too**, purely because that same account now also holds an active MANAGER membership. A pure customer calling either would get `FORBIDDEN`.
- The final `cancelJob` call succeeded from `IN_PROGRESS` — a state a plain customer can never cancel from (confirmed as a hard rejection in §35) — because the resolver resolves the customer-role and business-role checks independently and take the union, exactly as documented. This is the one cancelJob scenario that specifically needed a dual-role account to reach, and it now has direct empirical confirmation rather than just a code read.

---

## 39. Change Password

### Input

```graphql
mutation ChangePassword($input: ChangePasswordInput!) { changePassword(input: $input) { id email } }
```

**Variables:**
```json
{ "input": { "currentPassword": "TestPass123!", "newPassword": "NewTestPass456!" } }
```

Called with `Authorization: Bearer <employee JWT>`.

### Response

```json
{"data":{"changePassword":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.test1@petsitterpro.dev"}}}
```

### Key IDs

Account changed: Employee — `ca7aa688-4426-451c-8ed7-8b17babe0363`. Password is now `NewTestPass456!` (was `TestPass123!`).

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Wrong `currentPassword` | `UNAUTHENTICATED` — "Current password is incorrect." |
| `newPassword` identical to `currentPassword` | `BAD_USER_INPUT` — "New password must be different from your current password" |

### Notes
- Confirmed via `login`: the **new** password works immediately, and the **old** password now fails with the same generic "Invalid email or password" `UNAUTHENTICATED` used everywhere else — no special-casing that would hint a password was recently changed.

---

## 40. Change Email

### Input

```graphql
mutation ChangeEmail($input: ChangeEmailInput!) { changeEmail(input: $input) { id email } }
```

**Variables:**
```json
{ "input": { "newEmail": "employee.newemail@petsitterpro.dev", "password": "NewTestPass456!" } }
```

Called with `Authorization: Bearer <employee JWT>` (post-§39 password).

### Response

```json
{"data":{"changeEmail":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.newemail@petsitterpro.dev"}}}
```

### Key IDs

Account changed: Employee — `ca7aa688-4426-451c-8ed7-8b17babe0363`. Email is now `employee.newemail@petsitterpro.dev` (was `employee.test1@petsitterpro.dev`); password unchanged (`NewTestPass456!`).

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Wrong password | `UNAUTHENTICATED` — "Password is incorrect." |
| `newEmail` already in use (tried the manager's email) | `BAD_USER_INPUT` — "An account with this email address already exists." |

### Notes
- Confirmed via `login`: the new email works immediately, the old one now fails with the generic "Invalid email or password" — same non-enumeration behavior as everywhere else.
- **Employee's test credentials have changed for the rest of this file** — see the updated Quick Reference table at the top: `employee.newemail@petsitterpro.dev` / `NewTestPass456!`.

---

## 41. Deactivate Business

The final mutation in this pass — deliberately run last since it soft-deletes the whole business.

### Input

```graphql
mutation DeactivateBusiness($id: ID!) { deactivateBusiness(businessId: $id) { id name isActive } }
```

**Variables:** `{ "id": "eeed145f-246b-4c14-8b1a-246850d1ea8a" }`

### Response

```json
{"data":{"deactivateBusiness":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","isActive":false}}}
```

### Key IDs

Business deactivated: Puget Sound Pet Care — `eeed145f-246b-4c14-8b1a-246850d1ea8a`.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| MANAGER (not OWNER) tries to deactivate | `FORBIDDEN` — "Only the business owner can deactivate a business." |
| Nonexistent `businessId` | `FORBIDDEN` — same message as above, **not** `NOT_FOUND` |
| Re-deactivating the same business after it's already inactive | `BAD_USER_INPUT` — "This business is already deactivated." |

### Notes
- **Worth knowing**: a nonexistent `businessId` gives the exact same `FORBIDDEN` "Only the business owner can deactivate a business." as a real business you're not the owner of — the resolver checks "is the caller an active OWNER of this businessId" first, and a made-up ID simply never matches any membership row, so it falls into the same bucket rather than a distinct `NOT_FOUND`. Consistent with the "don't confirm whether something exists" pattern used elsewhere in this codebase, just via `FORBIDDEN` instead of `NOT_FOUND` this time.
- **This closed out every query and mutation that existed at the time** — 57 (20 queries + 37 mutations). The finance domain added below is new work from a later session.

---

## 42. Employee Pay & Payouts — Finance Domain

A new session's worth of testing, covering the 8 operations added by the finance feature (5
queries, 3 mutations): `getBusinessLedger`, `getBusinessFinancialSummary`,
`getUnpaidEarningsByMember`, `getBusinessEarnings`, `getMyEarnings`, `setMemberPayRate`, `addTip`,
`recordPayout`. Run against the same business (`eeed145f-246b-4c14-8b1a-246850d1ea8a`, reactivated
since §41) and the same four accounts, re-logged-in for fresh tokens. One new throwaway account,
**Outsider** (`outsider.test1@petsitterpro.dev` / `TestPass123!`, `User.id`
`471565e6-4fb7-464a-9845-6cfc9715ffe9`), was registered specifically for non-member negative tests
— `customer.test1` turned out to already be a dual-role active **MANAGER** of this business from an
earlier test (§ around the `cancelJob` union-of-roles coverage), so it doesn't exercise a true
"outsider" path.

Two pre-existing jobs from the original test pass, `43fcc471-e464-42ef-9646-ccad64104d1b` and
`0cca260f-0f92-4e94-aec1-72435aac7cba`, were already `COMPLETED` (with an assignee, price `20`)
**before this feature existed**, so they have no `JOB_PAY` earning — these are exactly what
`jobsMissingPayCount` is supposed to catch, and are referred to below as "the two legacy jobs."

### 42.1 Baseline reads (before any pay rate configured)

**Queries:** `getBusinessFinancialSummary`, `getBusinessLedger`, `getUnpaidEarningsByMember`,
`getBusinessEarnings`, `getMyEarnings` — all called once against the business in its
pre-feature state.

```json
{"data":{"getBusinessFinancialSummary":{"currentBalance":0,"unpaidEarningsTotal":0,"availableBalance":0,"jobsMissingPayCount":2}}}
{"data":{"getBusinessLedger":[]}}
{"data":{"getUnpaidEarningsByMember":[]}}
{"data":{"getBusinessEarnings":[]}}
{"data":{"getMyEarnings":[]}}
```

`jobsMissingPayCount: 2` on the very first call, with zero other finance data existing yet,
confirms it's really counting the two legacy jobs and not something that only appears after other
data is written.

### Negative cases tested (access control, all 5 queries)

| Scenario | Result |
|----------|--------|
| `getBusinessFinancialSummary` as active EMPLOYEE | `FORBIDDEN` — "You do not have permission to view this business's finances." |
| `getBusinessEarnings` unauthenticated (no token) | `UNAUTHENTICATED` — "You must be logged in." |
| `getBusinessLedger` as true Outsider (no membership at all) | `FORBIDDEN` — same message as above |
| `getUnpaidEarningsByMember` as true Outsider | `FORBIDDEN` — same message |
| `getMyEarnings` as true Outsider | `FORBIDDEN` — "You are not a member of this business." (distinct message — `requireActiveMembership`, not `requireFinanceManager`) |
| `getMyEarnings` as active MANAGER (any role allowed) | **Not an error** — `[]`. Confirms the "any active member" rule isn't accidentally OWNER/MANAGER-gated |
| `getBusinessLedger` with a non-UUID `businessId` | `BAD_USER_INPUT` — "Invalid business ID" |
| `getBusinessLedger` with cursor `before: 0` | `BAD_USER_INPUT` — "Cursor must be greater than 0" (Zod `.positive()`) |

### Notes
- First attempt at the "non-member" negative tests used `customer.test1`'s token and got `[]`
  instead of `FORBIDDEN` on both `getBusinessLedger` and `getMyEarnings` — looked like a bug at
  first glance. Checked `getBusinessMembers` before concluding anything: `customer.test1` is
  genuinely an active `MANAGER` of this business (`8f024572-3ff9-4651-b4b8-d2979ab2f40a`), set up in
  an earlier session for the `cancelJob` dual-role test. Not a bug — a bad test account choice.
  Registered the Outsider account and re-ran; both correctly returned `FORBIDDEN`.

---

### 42.2 Configuring Pay Rates — `updateBusiness.defaultSitterPayPercent`, `setMemberPayRate`

### Input

```graphql
mutation($input: UpdateBusinessInput!) { updateBusiness(input: $input) { id defaultSitterPayPercent } }
mutation($input: SetMemberPayRateInput!) { setMemberPayRate(input: $input) { id payRatePercent } }
```

**Variables:**
```json
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "defaultSitterPayPercent": 50 } }
{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "memberId": "cc28c51f-3c59-4c44-9cea-cf881b468533", "payRatePercent": 70 } }
```

### Response

```json
{"data":{"updateBusiness":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","defaultSitterPayPercent":50}}}
{"data":{"setMemberPayRate":{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533","payRatePercent":70}}}
```

Business-wide default set to 50%; the employee's own override (70%) was then confirmed to win over
it for every job completion below.

### Key IDs
Business default: 50%. Employee (`cc28c51f-3c59-4c44-9cea-cf881b468533`) override: 70%.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `updateBusiness` with `defaultSitterPayPercent: 150` | `BAD_USER_INPUT` — "Pay percent cannot exceed 100" |
| `updateBusiness` with `defaultSitterPayPercent: 33.333` (3 decimals) | `BAD_USER_INPUT` — "Pay percent supports at most 2 decimal places" |
| `setMemberPayRate` as active MANAGER | `FORBIDDEN` — "Only the business owner can set pay rates." |
| `setMemberPayRate` as the EMPLOYEE themselves (self-service) | `FORBIDDEN` — same message; **OWNER only, no self-exception** |

### `BusinessMember.payRatePercent` / `Business.defaultSitterPayPercent` visibility gate

| Scenario | Result |
|----------|--------|
| Employee views their own `payRatePercent` (via `getBusinessMembers`) | `70` — self-view works |
| MANAGER views the employee's `payRatePercent` | `70` — MANAGER can read pay, even though only OWNER can write it |
| `defaultSitterPayPercent` via public `getNearbyBusinesses` (unauthenticated) | `null` — confirms the raw-SQL storefront path never leaks it, even for this business's own owner browsing anonymously |

### Notes
- Didn't have a second employee to test the actual leak scenario (sitter reading a *colleague's*
  rate) — the coverage here is self-view + manager-view + the public-path null, which confirms the
  gate discriminates correctly on the paths available, but isn't exhaustive.

---

### 42.3 Job Completion Financials — both paths to `COMPLETED`

Two fresh bookings (Jobs A and B, Dog Walking @ $25) were driven through the two different routes to
`COMPLETED` specifically because `recordJobCompletionFinancials` is called from both and has to stay
in step:

- **Job A** (`5fbb35bc-2f21-4e46-864a-5e72358e312c`): `acceptJob` → `assignSitter` → `clockIn` →
  **`clockOut`**
- **Job B** (`a5e42fa2-5892-4bce-808c-26cc9f0ef27f`): `acceptJob` → `assignSitter` →
  **`completeJob`** (manual override, clock-in skipped entirely)

### Response (clockOut on Job A)

```json
{"data":{"clockOut":{"id":"5fbb35bc-2f21-4e46-864a-5e72358e312c","status":"COMPLETED","actualEndTime":"2026-07-19T23:15:37.407Z"}}}
```

```json
{"data":{"getBusinessEarnings":[{"id":"ee81ec80-d2ea-41e7-98f8-ea74f53051a9","type":"JOB_PAY","amount":17.5,"ratePercent":70,"basisAmount":25,"isPaid":false,"job":{"id":"5fbb35bc-2f21-4e46-864a-5e72358e312c"},"member":{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533"}}]}}
{"data":{"getBusinessLedger":[{"seq":1,"entryType":"CREDIT","amount":25,"balanceAfter":25,"referenceType":"JOB_PAYMENT","job":{"id":"5fbb35bc-2f21-4e46-864a-5e72358e312c"}}]}}
```

$25 × 70% = $17.50, exactly as designed — the employee's override rate, not the business's 50%
default, and `Job.price` ($25) alone as the basis (no service fee or add-ons in this booking to
confirm the exclusion against, but none were added to the total either).

### Response (completeJob on Job B, clock-in skipped)

```json
{"data":{"completeJob":{"id":"a5e42fa2-5892-4bce-808c-26cc9f0ef27f","status":"COMPLETED","actualStartTime":"2026-07-19T23:15:49.282Z","actualEndTime":"2026-07-19T23:15:49.282Z"}}}
```

`actualStartTime` backfilled to the same instant as `actualEndTime` (clock-in never happened, as
expected). Produced an identical second `JOB_PAY` earning (`17.5`, `ratePercent: 70`) — confirming
both completion paths book financials identically.

### Key IDs
Job A: `5fbb35bc-2f21-4e46-864a-5e72358e312c`. Job B: `a5e42fa2-5892-4bce-808c-26cc9f0ef27f`.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `clockOut` on Job A again (already `COMPLETED`) | `BAD_USER_INPUT` — "Cannot clock out from this job's current status (COMPLETED)." |
| `completeJob` on Job B again (already `COMPLETED`) | `BAD_USER_INPUT` — "Cannot complete a job from its current status (COMPLETED)." |

### Notes
- After both completions, `getBusinessFinancialSummary` read `currentBalance: 50, unpaidEarningsTotal: 35, availableBalance: 15, jobsMissingPayCount: 2` — the two new jobs correctly did **not** add to `jobsMissingPayCount` (they got paid), and the count stayed pinned to the two legacy jobs, not incremented by every completed job in the system.
- The re-completion negative tests hit the **outer** status check (run before the transaction opens) rather than the in-transaction re-check — expected, since there's no concurrent request racing them here. The in-transaction re-check exists for the race window specifically; see 42.4 for a test that actually exercises it.

---

### 42.4 Tips — `addTip`

### Input

```graphql
mutation($input: AddTipInput!) { addTip(input: $input) { id tipAmount } }
```

**Variables:** `{ "input": { "jobId": "5fbb35bc-2f21-4e46-864a-5e72358e312c", "amount": 5.50 } }`

### Response

```json
{"data":{"addTip":{"id":"5fbb35bc-2f21-4e46-864a-5e72358e312c","tipAmount":5.5}}}
```

Also tipped Job B ($3.00) and one of the two **legacy** completed jobs, `43fcc471-...` ($2.25) — the
legacy-job tip specifically confirms `recordTipFinancials` works independent of
`recordJobCompletionFinancials` (that job was completed in an earlier session, long before this
feature existed, and had no `JOB_PAY` earning at all).

### Key IDs
Tipped: Job A ($5.50), Job B ($3.00), legacy job `43fcc471-...` ($2.25).

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Tipping Job A again | `BAD_USER_INPUT` — "This job has already been tipped." |
| OWNER attempts to tip (no `CustomerProfile` at all) | `FORBIDDEN` — "Only customers can leave tips." |
| Tipping a `CANCELLED` job | `BAD_USER_INPUT` — "Only completed jobs can be tipped (current status: CANCELLED)." |
| `amount: 1.999` (3 decimals) | `BAD_USER_INPUT` — "Tip must have at most 2 decimal places" |
| `amount: -5` | `BAD_USER_INPUT` — "Tip must be greater than 0" |
| `amount: 5000` (over the $1000 cap) | `BAD_USER_INPUT` — "Tip cannot exceed $1000" |

### Concurrency test: two simultaneous tips on the same job

Fired two `addTip` requests at the same untipped legacy job (`0cca260f-...`) at the same instant
(backgrounded shell processes, no artificial delay). This specifically targets the claim in
`addTip.ts` that the ledger has **no unique constraint** backing the duplicate-tip guard the way
`EmployeeEarning`'s `(jobId, type)` constraint backs `JOB_PAY`/`TIP` earnings — so the in-transaction
re-read of `tipAmount` is the *only* thing preventing a double-credit here.

**Result:** one request succeeded (`tipAmount: 4`), the other cleanly failed with `BAD_USER_INPUT` —
"This job has already been tipped." Confirmed exactly **one** `TIP` ledger entry exists for that job
afterward (not zero, not two). The Serializable transaction plus the in-transaction re-check held up
under real concurrency, not just in theory.

---

### 42.5 Earnings & Ledger Reads (with real data)

Re-ran all five finance queries once meaningful data existed, to check the filters/pagination
against real rows rather than just empty-array baselines.

```json
{"data":{"getUnpaidEarningsByMember":[{"unpaidTotal":49.75,"unpaidCount":6,"member":{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533","role":"EMPLOYEE"}}]}}
```
`49.75` = `4 + 2.25 + 3 + 5.5` (four tips) `+ 17.5 + 17.5` (two JOB_PAYs) across 6 rows — matches.

- `getBusinessEarnings(memberId: <employee>)` — returned the same 6 rows, none from any other member (there is only one sitter in this test business, so this doesn't prove cross-tenant isolation, just that the filter doesn't accidentally exclude everything).
- `getBusinessEarnings(unpaidOnly: true)` — same 6 rows, all `isPaid: false`.
- `getMyEarnings` as the employee — same 6 rows, self-service view matches the OWNER's cross-sitter view exactly.
- `getBusinessEarnings(limit: 2)` — returned exactly 2, newest `createdAt` first.
- `getBusinessLedger` (no args) — 6 entries, `seq` 1→6, running `balanceAfter` 25 → 50 → 55.5 → 58.5 → 60.75 → 64.75 (strictly increasing, matches the sum of all credits so far).
- `getBusinessLedger(limit: 2)` then `getBusinessLedger(limit: 2, before: 5)` — page 1 returned `seq` 6,5; page 2 (cursor `before: 5`) returned `seq` 4,3 — no gap, no overlap. Confirms `seq` is a safe pagination cursor even though several entries share the same `createdAt` (this business had two separate completions land within the same second).

---

### 42.6 Payouts — `recordPayout`

### Input

```graphql
mutation($input: RecordPayoutInput!) { recordPayout(input: $input) { id amount status method paidAt earnings { type amount } } }
```

**Variables:** `{ "input": { "businessId": "eeed145f-246b-4c14-8b1a-246850d1ea8a", "memberId": "cc28c51f-3c59-4c44-9cea-cf881b468533", "method": "Venmo", "note": "Weekly payout - test" } }`

### Response

```json
{"data":{"recordPayout":{"id":"13827b93-e7f1-4cdd-96bb-ce0ab79998a6","amount":49.75,"status":"PAID","method":"Venmo","paidAt":"2026-07-19T23:17:12.634Z","earnings":[{"type":"TIP","amount":4},{"type":"TIP","amount":2.25},{"type":"TIP","amount":3},{"type":"TIP","amount":5.5},{"type":"JOB_PAY","amount":17.5},{"type":"JOB_PAY","amount":17.5}]}}}
```

`amount: 49.75` matches the `unpaidTotal` read in 42.5 exactly — confirming it really is summed from
the claimed earnings and not a separately-entered figure. All 6 outstanding earnings were claimed in
one call (no `throughDate` given, so "everything outstanding" is the correct scope).

**After the payout:** `getBusinessFinancialSummary` → `currentBalance: 15, unpaidEarningsTotal: 0,
availableBalance: 15` (was `currentBalance: 64.75` pre-payout — the $49.75 debit landed exactly).
`getMyEarnings(unpaidOnly: true)` as the employee → `[]`. `getBusinessLedger` → new `seq: 7` `DEBIT`
`PAYOUT` entry, `balanceAfter: 15`, linked `payout { status: "PAID" }`.

### Key IDs
Payout: `13827b93-e7f1-4cdd-96bb-ce0ab79998a6`, amount `$49.75`.

### Negative cases tested

| Scenario | Result |
|----------|--------|
| `recordPayout` as active MANAGER | `FORBIDDEN` — "Only the business owner can record payouts." |
| `recordPayout` for a `memberId` belonging to no `BusinessMember` row in this business (used the Outsider's raw `User.id`, which isn't a `BusinessMember.id` at all) | `NOT_FOUND` — "Member not found in this business." |
| `recordPayout` again immediately (nothing outstanding) | `BAD_USER_INPUT` — "This sitter has no outstanding earnings to pay out." |

### `throughDate` cutoff

Completed a third job (Job C, `f6c4074d-4266-4e03-a4e0-1c3952f6b0d1`) via `clockOut` after the payout
above, producing one new outstanding `JOB_PAY` earning ($17.50). Called `recordPayout` with
`throughDate: "2026-07-18T00:00:00.000Z"` (before that earning existed) → `BAD_USER_INPUT` — "This
sitter has no outstanding earnings to pay out." (correctly excluded by the date bound). Then called
`recordPayout` with no `throughDate` → succeeded, `amount: 17.5`, settling exactly Job C's earning
and nothing else.

### Concurrency test: two simultaneous payouts against one outstanding earning

Tipped Job C ($6) to create exactly one fresh outstanding earning, then fired two `recordPayout`
requests for the same member at the same instant. This targets the claim that the conditional
`updateMany` (filtered on `payoutId: null`) is what actually prevents two payouts from both claiming
the same earning, independent of Serializable isolation.

**Result:** one request succeeded (`amount: 6`), the other failed with the same "no outstanding
earnings" `BAD_USER_INPUT` — meaning the second request's own read (inside its own transaction) saw
nothing left to claim. Only one `Payout` row was created for that $6; `getBusinessFinancialSummary`
afterward showed `unpaidEarningsTotal: 0`, not a negative or double-deducted balance.

### Notes
- Final ledger after all of §42 (11 entries, `seq` 1→11): three `JOB_PAYMENT` credits ($25 each),
  five `TIP` credits ($5.50, $3, $2.25, $4, $6), three `PAYOUT` debits ($49.75, $17.50, $6). Running
  balance stayed internally consistent at every step (verified by re-deriving each `balanceAfter`
  from the previous one plus/minus the new entry) and the final `currentBalance` from
  `getBusinessFinancialSummary` ($22.50) matched the last ledger row's `balanceAfter` exactly.
- **No mutation exists yet to create a `BONUS` or `ADJUSTMENT` earning directly** — both enum values
  are schema-only for now, consistent with `AI_MANIFEST.md`. Not tested here because there's nothing
  to call; if a manual-adjustment mutation is added later, this is the gap it fills.
- Every one of the 8 new operations has now been exercised with a happy path, its documented negative
  cases, and (for the two mutations where the codebase explicitly claims race-safety) a real
  concurrent-request test — not just a single-threaded call.

---

## 43. Get Session — Sign-In Bootstrap

`getSession` was written, then sat unwired (not exported from `userResolvers.ts`, not declared in
`typeDefs.ts`) for a while before this pass. It's now wired, and this is its first exercise against a
running server. It's also the first thing to read `BusinessMember.business`, a brand-new type-level
field resolver added in the same pass — so this section covers both at once.

The entire point of this resolver is reporting "staff?" and "customer?" as two independent facts
instead of one role string, specifically because a user can be both, either, or neither. The test
matrix below was chosen to hit all three reachable combinations with the existing accounts (see
Notes for the one combination — *neither* — that existing accounts can't reach).

### Input

```graphql
query {
  getSession {
    user { id email firstName lastName }
    memberships { id role isActive joinedAt business { id name isActive } }
    customerProfile { id address city }
  }
}
```

### Response

**Owner** — staff only, no customer profile:
```json
{"data":{"getSession":{"user":{"id":"0bfaff01-7e2f-4b60-811b-04b9909285ae","email":"owner.test1@petsitterpro.dev","firstName":"Dylan","lastName":"Owner"},"memberships":[{"id":"f6f86288-8cb4-4f08-a79d-7e1bdc2d9f6d","role":"OWNER","isActive":true,"joinedAt":"2026-07-19T16:04:46.813Z","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","isActive":true}}],"customerProfile":null}}}
```

**Manager** — staff only, no customer profile:
```json
{"data":{"getSession":{"user":{"id":"20be60f0-7d99-470c-ad24-e8ddd1314241","email":"manager.test1@petsitterpro.dev","firstName":"Morgan","lastName":"Manager"},"memberships":[{"id":"68081d4b-8bf9-4099-b6ec-2806cf8b1c5a","role":"MANAGER","isActive":true,"joinedAt":"2026-07-19T16:33:35.052Z","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","isActive":true}}],"customerProfile":null}}}
```

**Employee** — staff only, no customer profile:
```json
{"data":{"getSession":{"user":{"id":"ca7aa688-4426-451c-8ed7-8b17babe0363","email":"employee.newemail@petsitterpro.dev","firstName":"Erin","lastName":"Employee"},"memberships":[{"id":"cc28c51f-3c59-4c44-9cea-cf881b468533","role":"EMPLOYEE","isActive":true,"joinedAt":"2026-07-19T16:33:34.760Z","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","isActive":true}}],"customerProfile":null}}}
```

**Customer** (`customer.test1`, the dual-role account) — **both facts true at once, neither
clobbering the other**:
```json
{"data":{"getSession":{"user":{"id":"7065a3f9-aec6-4d66-a9f5-e05cf18392ac","email":"customer.test1@petsitterpro.dev","firstName":"Casey","lastName":"Customer"},"memberships":[{"id":"8f024572-3ff9-4651-b4b8-d2979ab2f40a","role":"MANAGER","isActive":true,"joinedAt":"2026-07-19T17:57:47.533Z","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","name":"Puget Sound Pet Care","isActive":true}}],"customerProfile":{"id":"36ac885f-1dee-441a-ac52-077d2e4cd910","address":null,"city":null}}}}
```
This is the case the whole `Session` type exists for: the old single-`role` design (`membership?.role
?? 'CUSTOMER'`) would have reported this user as a plain `MANAGER` and silently dropped that they're
also a customer. Here both survive.

**Outsider** — turns out to be a pure customer with zero business affiliation, not a "neither" case
(see Notes — it was registered via `registerCustomer`, which is why it has a profile):
```json
{"data":{"getSession":{"user":{"id":"471565e6-4fb7-464a-9845-6cfc9715ffe9","email":"outsider.test1@petsitterpro.dev","firstName":"Olive","lastName":"Outsider"},"memberships":[],"customerProfile":{"id":"ef164348-31e2-4f41-b125-d985bc9dfecf","address":null,"city":null}}}}
```

### `BusinessMember.business` field resolver — sensitivity gate carries through

Re-ran with `memberships { role business { id defaultSitterPayPercent avgRating serviceFeeAmount } }`
to confirm the brand-new `business` field doesn't bypass the existing SENSITIVE gate on
`defaultSitterPayPercent` (§42.2) now that `Business` is reachable through a second path:

```json
// Owner — sees the real value
{"data":{"getSession":{"memberships":[{"role":"OWNER","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","defaultSitterPayPercent":50,"avgRating":5,"serviceFeeAmount":null}}]}}}
// Employee — same field, correctly null (not OWNER/MANAGER)
{"data":{"getSession":{"memberships":[{"role":"EMPLOYEE","business":{"id":"eeed145f-246b-4c14-8b1a-246850d1ea8a","defaultSitterPayPercent":null}}]}}}
```
`avgRating: 5` also confirms the Decimal→Number conversion still fires when `Business` is reached via
`BusinessMember.business` rather than `getMyBusinesses`/`updateBusiness`/`getNearbyBusinesses` — this
is a genuinely new code path to the same type, not just a new query wrapping old ones.

### Key IDs

| Field | Value |
|-------|-------|
| `customer.test1`'s `CustomerProfile.id` | `36ac885f-1dee-441a-ac52-077d2e4cd910` (newly observed — not previously logged in this file) |
| Outsider's `CustomerProfile.id` | `ef164348-31e2-4f41-b125-d985bc9dfecf` (newly observed) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| No `Authorization` header | `UNAUTHENTICATED` — "You must be logged in." |
| `Authorization: Bearer not-a-real-token` (garbage, not just expired) | `UNAUTHENTICATED` — same message. Confirms `verifyToken()`'s "never throws, just returns null" contract holds for garbage input, not only for a well-formed-but-expired token, and that `getSession`'s own `context.user == null` check catches it identically to the no-token case. |

### Notes
- **One combination — no active membership *and* no `CustomerProfile` — was not reachable this
  round.** That's the "removed owner" case both manifests describe: `registerOwner` creates no
  profile, and `removeMember` only soft-deletes, so a removed owner ends up with neither. Testing it
  needs a fresh `BusinessMember` that can then be removed (unlike an OWNER's, which `removeMember`
  can never touch), which means going through `inviteEmployee` → `acceptInvitation`. The invitation
  token isn't emailed in this environment (no SMTP configured) — it's only `console.log`'d by
  `sendInvitationEmail`, straight to the server process's own stdout. That process was started
  directly by the developer in a terminal this session has no read access to, so there was no way to
  retrieve a token to complete the accept step. §37's already-removed member ("Zack Throwaway") can't
  substitute either — their invitation token was single-use and already consumed, and was never
  written to this log (correctly, since it's a bearer secret). Closing this gap just needs someone
  with console access to run `inviteEmployee`, paste the logged token back, and let `acceptInvitation`
  → `removeMember` → `getSession` run from there.
- The `memberships` filter (`isActive: true`) was exercised the same way §9's `getMyBusinesses` test
  was — none of the five accounts above currently has an inactive membership, so this confirms the
  active ones all come through correctly but doesn't independently prove the exclusion. Not re-proven
  here since it's the identical `where` clause already covered there, and the gap above is the same
  gap that would let it be proven properly.
- Every account's `memberships[].business` resolved to real, correct data (not `null`, not an error),
  confirming the field resolver's `parent.business ?? <query>` short-circuit is at minimum
  functionally correct. Whether it actually *skipped* the fallback query (rather than firing it and
  getting the same answer) isn't independently confirmed here — that would need query-count
  visibility (e.g., Prisma query logging) into the same terminal session mentioned above.

---

## 44. Get My Upcoming Jobs — Customer's Flattened Job List

New query: the customer-facing equivalent of `getMyJobs`/`getBusinessJobs`, added specifically to
answer "what's coming up" for a Home screen. Same `statuses`/`from`/`to` filter shape as its two
siblings, but scoped by `Job.customerId` and returning `[Job!]!` flattened across every booking
instead of nested under one — a 5-session package's jobs come back as 5 peers, not buried under a
`Booking`. First exercise was blocked by a stale dev server (schema introspection showed 26 Query
fields when 27 were declared); resolved by restarting.

### Input

```graphql
query { getMyUpcomingJobs(statuses: [String!], from: String, to: String) { id status scheduledStartTime } }
```

### Cross-check against `getMyBookings` (consistency, not just "no error")

Ran `getMyBookings { jobs { id status scheduledStartTime } }` first, then `getMyUpcomingJobs` with no
args, as `customer.test1`. Flattening the 9 bookings' nested jobs from the first call produced **the
exact same 13 job IDs** as the second call's flat list — same set, just correctly re-ordered by
`scheduledStartTime` ascending instead of grouped by booking (`getMyBookings`' own order is
`createdAt` desc, so its nested dates appear jumbled: `08-03, 08-02, 08-01, 07-28, ...`). This is
stronger evidence than a shape check — it confirms the new resolver's `where: { customerId }`
produces the identical dataset the already-tested nested path does, not just *a* plausible-looking
one.

### Response

**No args — full history, 13 jobs, correctly sorted ascending (only the sort order differs from the
cross-check above):**
```json
{"data":{"getMyUpcomingJobs":[{"id":"43fcc471-e464-42ef-9646-ccad64104d1b","status":"COMPLETED","scheduledStartTime":"2026-07-20T02:00:00.000Z"},{"id":"0cca260f-0f92-4e94-aec1-72435aac7cba","status":"COMPLETED","scheduledStartTime":"2026-07-21T02:00:00.000Z"},{"id":"94525a0d-7639-4fa6-991d-ad98423ce1c6","status":"CANCELLED","scheduledStartTime":"2026-07-22T02:00:00.000Z"},{"id":"47117252-c172-4f2b-bc08-c73b5cc74a1f","status":"DECLINED","scheduledStartTime":"2026-07-22T15:00:00.000Z"},{"id":"2353ce52-98e4-4c7b-b241-9fed51db5fcc","status":"CANCELLED","scheduledStartTime":"2026-07-23T02:00:00.000Z"},{"id":"27badf2b-5500-428c-be0d-b657b0fb7cae","status":"CANCELLED","scheduledStartTime":"2026-07-24T02:00:00.000Z"},{"id":"f2e4b152-5e9d-4a5d-87f5-6c7a1c1b7ce8","status":"CANCELLED","scheduledStartTime":"2026-07-25T12:00:00.000Z"},{"id":"d5a148fc-bd21-4ba1-81f7-8ece33fc50e0","status":"CANCELLED","scheduledStartTime":"2026-07-26T12:00:00.000Z"},{"id":"d171c52a-9faf-464e-a565-d4d0696c0038","status":"CANCELLED","scheduledStartTime":"2026-07-27T12:00:00.000Z"},{"id":"15300171-2cc5-42f5-94c9-3b8fb880105a","status":"CANCELLED","scheduledStartTime":"2026-07-28T12:00:00.000Z"},{"id":"5fbb35bc-2f21-4e46-864a-5e72358e312c","status":"COMPLETED","scheduledStartTime":"2026-08-01T10:00:00.000Z"},{"id":"a5e42fa2-5892-4bce-808c-26cc9f0ef27f","status":"COMPLETED","scheduledStartTime":"2026-08-02T10:00:00.000Z"},{"id":"f6c4074d-4266-4e03-a4e0-1c3952f6b0d1","status":"COMPLETED","scheduledStartTime":"2026-08-03T10:00:00.000Z"}]}}
```

**`from: "2026-07-21T00:00:00.000Z"` (today, per the server's own clock) — "current date and
forward," the literal feature request:** returned 12 of the 13 jobs, excluding exactly the one dated
`2026-07-20T02:00:00.000Z` (`43fcc471`) — the only job before the cutoff. Everything from
`0cca260f` (today, `07-21T02:00`) onward came through.

**`to: "2026-07-22T23:59:59.000Z"` — the other bound, for symmetry with `getMyJobs`/`getBusinessJobs`:**
returned exactly the 4 earliest jobs (`43fcc471` 07-20, `0cca260f` 07-21, `94525a0d` 07-22T02:00,
`47117252` 07-22T15:00) — confirms same-day jobs at different times both correctly fall inside the
bound, not just whole-day granularity.

**`statuses: ["CANCELLED"]`:** returned exactly the 7 `CANCELLED` jobs in the dataset, none of the
5 `COMPLETED` or 1 `DECLINED` — filter composes correctly alongside the date bounds (not tested
together in the same call here, but each filter clause is independent in the resolver, same as its
siblings).

### Key IDs

| Field | Value |
|-------|-------|
| Customer | `customer.test1` — `7065a3f9-aec6-4d66-a9f5-e05cf18392ac` |
| Full job set (13) | `43fcc471…`, `0cca260f…`, `94525a0d…`, `47117252…`, `2353ce52…`, `27badf2b…`, `f2e4b152…`, `d5a148fc…`, `d171c52a…`, `15300171…`, `5fbb35bc…`, `a5e42fa2…`, `f6c4074d…` (full UUIDs in the responses above) |

### Negative cases tested

| Scenario | Result |
|----------|--------|
| Caller with no `CustomerProfile` (`owner.test1`) | `FORBIDDEN` — "Only customers have jobs." |
| No `Authorization` header | `UNAUTHENTICATED` — "You must be logged in." |
| `from: "not-a-date"` | `BAD_USER_INPUT` — "Invalid from date" (Zod's `z.coerce.date()` message, same as `getMyJobs`/`getBusinessJobs` use for the same bad input) |

### Notes
- The first attempt at testing this (previous session) failed entirely: GraphQL validation rejected
  the field with "Cannot query field \"getMyUpcomingJobs\" on type \"Query\"", and introspection
  confirmed the running server still had the pre-change 26-field schema. The dev server hadn't
  reloaded despite the file changes being on disk and statically verified as correctly wired — most
  likely explained by `tsx watch`'s file-watcher not reliably crossing the WSL↔Windows filesystem
  boundary (the server runs from a WSL shell against `/mnt/c/...`; edits were written through the
  Windows-side path). A manual restart resolved it; introspection afterward showed 27 fields with
  `getMyUpcomingJobs` present. Worth remembering for any future backend change tested from this
  session: a stale/unresponsive schema after an edit doesn't necessarily mean the code is wrong.
- Did not test `statuses` combined with `from`/`to` in the same call, or pagination/`limit` (this
  query has none, same as `getMyJobs`/`getBusinessJobs` — unbounded by design, matching its
  siblings). Both are low-risk gaps: the `where` clause builds each condition independently and
  identically to the two already-proven siblings, so compounding them is very unlikely to interact
  in a surprising way.

