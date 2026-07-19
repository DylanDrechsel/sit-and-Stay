# PetSitterPro — API Testing Summary

## Overview

Every operation in the GraphQL API — 20 queries and 37 mutations, 57 total — has been exercised
against a running local server and verified to work correctly. This file is a quick orientation
summary of what exists and what was covered. Full request/response pairs, every key ID, and all
negative-case results live in `TEST_DATA_AND_RESPONSES.md`.

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

## Where to Look for More

- **`TEST_DATA_AND_RESPONSES.md`** — the full log: every request, response, ID, and negative test
  case, in the order they were run, plus the Quick Reference token table.
- **`AI_MANIFEST.md`** — the architecture and schema reference this testing was checked against.
