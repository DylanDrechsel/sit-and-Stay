# PetSitterPro — API Testing Summary

## Overview

The GraphQL API declares **27 queries and 40 mutations, 67 total**, and **all 67 have been exercised**
against a running local server and verified to work correctly. This file is a quick orientation
summary of what exists and what was covered. Full request/response pairs, every key ID, and all
negative-case results live in `TEST_DATA_AND_RESPONSES.md`.

> **Correction:** an earlier version of this file claimed the 8 finance/payment operations
> (`getBusinessLedger`, `getBusinessFinancialSummary`, `getUnpaidEarningsByMember`,
> `getBusinessEarnings`, `getMyEarnings`, `setMemberPayRate`, `addTip`, `recordPayout`) were
> untested. That was wrong — it was based on this file's own "What Was Tested" prose never
> mentioning them, without actually checking `TEST_DATA_AND_RESPONSES.md` §42, which covers all 8 in
> depth (happy paths, every documented negative case, and concurrency tests for the two mutations
> that claim race-safety). Confirmed by reading §42 directly on 2026-07-21.

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Owner | `owner.test1@petsitterpro.dev` | `TestPass123!` | Owns Puget Sound Pet Care |
| Manager | `manager.test1@petsitterpro.dev` | `TestPass123!` | Phone/avatar updated during testing |
| Employee | `employee.newemail@petsitterpro.dev` | `NewTestPass456!` | Both email and password were changed partway through (originally `employee.test1@petsitterpro.dev` / `TestPass123!`) |
| Customer | `customer.test1@petsitterpro.dev` | `TestPass123!` | Also holds a MANAGER membership on Puget Sound Pet Care (used to test a dual-role account) |

JWTs expire ~24h after issue. Fresh tokens for each account are kept in the "Quick Reference" table
at the top of `TEST_DATA_AND_RESPONSES.md` — re-run `login` if they've gone stale.

## Business

**Puget Sound Pet Care** (`eeed145f-246b-4c14-8b1a-246850d1ea8a`) — active, located in downtown
Seattle (`47.6062, -122.3321`). Members: the Owner, Manager, and Employee above, plus the Customer
in their dual role. `avgRating: 5`, `reviewCount: 1`.

### Service Catalog

| Offering | Status | Price | Notes |
|----------|--------|-------|-------|
| Dog Walking | Active | `basePrice: $25` | Category `WALKING`; one active package ("Single (once a week)", $30/session) |
| Cat Sitting Visits | Active | `basePrice: $22` | Category `DROP_IN`; created from scratch during testing. Has the "Extra Cat" add-on ($12/session) and the "5-Visit Pack" package ($20/session) |
| Boarding, House Sitting, Drop-In Visits, Doggy Day Care, Dog Training | Inactive | — | Seeded defaults, never published |

## Customer Data

- **Pets**: Biscuit (dog, owned by `customer.test1`) and Whiskers (cat, owned by `customer.test1`) — both active.
- **Bookings/Jobs**: several test bookings created, collectively covering every job status (`PENDING`, `ACCEPTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DECLINED`).
- **Reviews**: one 5-star review on Puget Sound Pet Care.

## What Was Tested

- Registration & auth — owner and customer registration, login
- Employee invitations — invite, resend, accept (both new-user and existing-user paths), removal
- User self-service — profile update, password change, email change
- Business management — location, description, deactivation/reactivation
- Service catalog CRUD — offerings, add-ons, and packages (create/update/delete), including public-vs-member visibility rules
- Pet management — add/update/delete
- Employee availability scheduling
- Full job lifecycle — booking → accept/decline → assign → clock in/out → report card → review
- Job cancellation — every legal combination of caller role (customer, owner/manager) and source job status, including a dual-role account
- Business membership management — removing a member, viewing inactive members
- Employee pay & payouts — pay rate configuration, job-completion financials on both paths to
  `COMPLETED`, tips (including a real concurrent-request race test), earnings/ledger reads with
  pagination, and payouts (including `throughDate` cutoff and a concurrent-payout race test)
- `getSession` — the sign-in bootstrap query. Tested across all three reachable staff/customer
  combinations: staff-only (owner, manager, employee — each correctly gets a null
  `customerProfile`), customer-only (the Outsider account), and **both at once** (`customer.test1`,
  the dual-role account — confirming the two independent fields don't clobber each other). Also
  confirmed the new `BusinessMember.business` field resolver carries through the existing
  `defaultSitterPayPercent` sensitivity gate and `Decimal`→`Number` conversion correctly.
- `getMyUpcomingJobs` — the customer's flattened "what's coming up" list. Cross-checked against
  `getMyBookings`' nested jobs (identical 13-job set, just re-sorted), then verified the `from`
  cutoff excludes exactly the one past-dated job, the `to` bound and `statuses` filter both land
  precisely, and all three negative cases (`FORBIDDEN` for a non-customer, `UNAUTHENTICATED`,
  `BAD_USER_INPUT` for a bad date) behave correctly.

## What Was *Not* Tested

- **`getSession`'s fourth combination — no active membership *and* no `CustomerProfile`.** This is
  the "removed owner" case: `registerOwner` creates no profile, `removeMember` only soft-deletes, so
  a removed owner has neither. Reaching it needs a fresh `BusinessMember` that can actually be
  removed (an OWNER's can't), which means `inviteEmployee` → `acceptInvitation` — and the invitation
  token is only `console.log`'d (no SMTP configured), landing in the server process's own stdout
  rather than anywhere this testing pass could read it. See `TEST_DATA_AND_RESPONSES.md` §43 Notes.
- **Creating a `BONUS` or `ADJUSTMENT` `EmployeeEarning` directly** — both enum values are
  schema-only; no mutation creates one, so there's nothing to call yet.
- **`getMyUpcomingJobs` with `statuses` combined with `from`/`to` in the same call, or pagination.**
  Each filter was tested independently; the query has no `limit`/cursor at all, by design, matching
  its two siblings. Low-risk gap — see `TEST_DATA_AND_RESPONSES.md` §44 Notes.

## Where to Look for More

- **`TEST_DATA_AND_RESPONSES.md`** — the full log: every request, response, ID, and negative test
  case, in the order they were run, plus the Quick Reference token table.
- **`AI_MANIFEST.md`** — the architecture and schema reference this testing was checked against.
