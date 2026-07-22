# PetSitterPro Mobile — AI Manifest (Frontend)

> **Purpose of this document**: Gives an AI assistant (or new developer) a complete, fast
> understanding of the React Native app's architecture, conventions, and its contract with the
> GraphQL backend — without reading every source file.
>
> **Companion document**: `AI_MANIFEST.md` covers the backend (data model, GraphQL API surface,
> resolver behavior). This file covers only `phone_app/`. When the two disagree about the API,
> the backend manifest wins — but check the actual `typeDefs.ts`, since both drift.
>
> **Keep this file up to date** as the app grows. Every section marked **PLANNED** is a decision
> that has been made but not yet written in code; move it to the implemented sections as you build.

---

## 1. Current Status — Read This First

**Email/password auth works end to end: Welcome → Login → a role-specific app.** With a token,
`RootNavigator` hands off to `AppContainer`, which loads `getSession` once and routes to one of three
apps — Owner/Manager, Employee, or Customer — each with its own stack and home screen (§8.1).

Only the **Owner/Manager** home is real: the "2A" Today view on a light background — today's date,
the business name, three headline counts (jobs today / unassigned / cancelled today), and today's job
list, from `getBusinessJobs`. The Employee and Customer homes are deliberate **placeholders**: they
render identity and say what isn't built, rather than faking data. No tabs yet.

What exists today:

| Path | State |
|------|-------|
| `App.tsx` | Provider stack (`ApolloProvider` → `AuthProvider` → `SafeAreaProvider`), loads the six Sora/Manrope weights, then renders `RootNavigator`. |
| `index.ts` | `registerRootComponent(App)` — standard, don't edit |
| `app.json` | Expo config; `expo-font` registered under `plugins` |
| `tsconfig.json` | Extends `expo/tsconfig.base`, `strict: true` |
| `.env` | **Gitignored** (repo-root `.gitignore`, bare `.env` entry). No `.env.example` is checked in — see §4. |
| `src/lib/env.ts` | Reads + validates `EXPO_PUBLIC_API_URL`, throwing a useful message if unset. |
| `src/lib/datetime.ts` | `formatToday()` / `formatTime()` — device-local date/time formatters shared by the home dashboard and job rows. |
| `src/lib/tokenStorage.ts` | JWT get/set/clear. Branches on `Platform.OS` — SecureStore native, `localStorage` on web (§6). |
| `src/lib/apolloClient.ts` | Apollo Client 4: auth link (reads token fresh per request) + error link (UNAUTHENTICATED → sign out). |
| `src/context/AuthContext.tsx` | `token` / `isRestoring` / `signIn` / `signOut`. Restores the token on cold start and clears the Apollo store on sign-out. |
| `src/context/SessionContext.tsx` | Holds the loaded `getSession` result below `AppContainer`. `useSession()` (throws outside the provider, like `useAuth`) and `useActiveMembership()` — the latter is where the **one-business-per-user** assumption lives. |
| `src/navigation/RootNavigator.tsx` | Swaps the auth stack ↔ `AppContainer` on `token`. Knows nothing about roles. Exports `AuthStackParamList` only — the signed-in side has one param list per role app. |
| `src/navigation/AppContainer.tsx` | The signed-in entry point: loads `getSession` once (with loading/error/retry), resolves which app to render via the exported `resolveAppKind()`, and provides the session. Also renders the `none` state (no membership, no customer profile — reachable for a soft-removed owner). |
| `src/navigation/OwnerManagerApp.tsx` | **Bottom tab bar** (`@react-navigation/bottom-tabs`): Today · Requests · Schedule · Team · Business · Account, with Ionicons. Route→icon lives in one `ICONS` map keyed off the param list, so a missing icon is a type error. Height and the bottom safe-area inset are left to React Navigation on purpose. |
| `src/navigation/EmployeeApp.tsx`, `CustomerApp.tsx` | One stack each with its home screen and a typed param list. Still stacks; these become their own tab bars per §9. |
| `src/graphql/auth.ts`, `src/graphql/session.ts`, `src/graphql/job.ts` | `LOGIN` mutation, `GET_SESSION` query, `GET_BUSINESS_JOBS` query — all `TypedDocumentNode`. |
| `src/types/session.ts`, `src/types/job.ts` | Hand-written mirrors of the schema types (`session.ts` = User/Business/membership/profile; `job.ts` = the `BusinessJob` slice `GET_BUSINESS_JOBS` selects). |
| `src/validation/auth.ts` | `loginSchema`, mirroring the backend field-for-field. |
| `src/screens/auth/WelcomeScreen.tsx` | Landing screen. Apple/Google buttons are **deliberately inert `View`s** — the API has no OAuth mutation, and `login` rejects null-`passwordHash` accounts. "Continue with email" now navigates to Login. |
| `src/screens/auth/LoginScreen.tsx` | Email/password form (React Hook Form + Zod). |
| `src/screens/owner/OwnerHomeScreen.tsx` | The `Today` tab, and the only real owner screen. Owns the `getBusinessJobs` query (device local-day `from`/`to`), loading/error/retry, and pull-to-refresh; hands the jobs to `<BusinessTodayDashboard>`. Gets its business from `useActiveMembership()`. |
| `src/screens/owner/AccountScreen.tsx` | Real but read-only: name, email, business, role, and sign-out — all from the session already in context, so it makes no query. Editing (`updateUser`/`changeEmail`/`changePassword`) isn't built. |
| `src/screens/owner/{Requests,Schedule,Team,Business}Screen.tsx` | Placeholders via `<PlaceholderScreen>`, each naming the query that will back it. |
| `src/screens/employee/EmployeeHomeScreen.tsx` | **Placeholder.** Name + which business they sit for, and a note that the sitter's job list (`getMyJobs`) isn't wired yet. Deliberately does not fall back to `getBusinessJobs`, which the API refuses an EMPLOYEE. |
| `src/screens/customer/CustomerHomeScreen.tsx` | **Placeholder.** Name + address, and a note that upcoming bookings (`getMyUpcomingJobs`) aren't wired yet. |
| `src/components/BusinessTodayDashboard.tsx` | The "2A" Today dashboard: date + business name header, three `StatBox` counts, today's job list. **Presentational** — the screen fetches and owns the jobs; this derives the three counts from them. |
| `src/components/StatBox.tsx` | Presentational headline count. `variant` sets the whole box: `filled` (solid dark green, light text), `outline` (white, honey border), `danger` (white, red border + red number). |
| `src/components/SignOutButton.tsx` | Shared by the owner Account tab, the employee/customer homes, and the `none` state. |
| `src/components/PlaceholderScreen.tsx` | Standard "this tab isn't built yet" screen — a title and a note naming the query behind it. Deliberately not an empty list, which would be indistinguishable from a real query returning nothing. |
| `src/components/JobListItem.tsx` | Presentational single job row (number + service, status pill, time window, customer, sitter). Takes a `BusinessJob`, no fetching — reusable by any future job list. |
| `src/theme/`, `src/components/PawMark.tsx` | Palette, font constants, logo mark. |

Still **PLANNED**: `src/components/` beyond the logo mark, and every non-auth screen.

> **Sequencing note:** the backend was finished and verified first (all 67 operations tested); the
> app is now being built against it. Auth is the first slice.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 57 (`expo ~57.0.7`) |
| Runtime | React Native 0.86.0 |
| UI Library | React 19.2.3 |
| Language | TypeScript 6 (`strict: true`) |
| API Client | Apollo Client 4 (`@apollo/client ^4.2.7`) + `graphql 16` |
| Navigation | React Navigation 7 (`native-stack` + `bottom-tabs`), on `react-native-screens` |
| Safe areas | `react-native-safe-area-context` — `SafeAreaProvider` wraps the tree in `App.tsx` |
| Forms | React Hook Form 7 + `@hookform/resolvers` |
| Validation | Zod 4 (mirrors the backend's `utils/validate.ts`) |
| Secure Storage | `expo-secure-store` (JWT) — **native only, see §6** |
| Geolocation | `expo-location` (feeds `getNearbyBusinesses`) |
| Fonts | `expo-font` + `@expo-google-fonts/sora` + `@expo-google-fonts/manrope` |
| Icons | `@expo/vector-icons` |
| Vector graphics | `react-native-svg` |
| Date/time input | `@react-native-community/datetimepicker` |

`react-dom` and `react-native-web` are installed **only** so `npx expo start --web` works as a fast
dev preview. Web is not a shipping target — see §6 for what breaks there.

### Installing new packages

Always use `npx expo install <pkg>`, never `npm install <pkg>`. Expo pins each package to the
version compatible with SDK 57; plain `npm install` resolves to npm-latest and will mismatch the
native runtime. (`npm install` with **no arguments** is fine — it only installs what's already
listed.)

---

## 3. Project Structure

Current (real):

```
phone_app/
├── App.tsx                      # provider stack + useFonts + RootNavigator
├── index.ts                     # registerRootComponent, do not edit
├── app.json                     # Expo config (plugins: expo-font)
├── tsconfig.json                # extends expo/tsconfig.base, strict
├── AGENTS.md                    # read the SDK 57 docs before writing Expo code
├── .env                         # gitignored — your local config; no .env.example checked in (§4)
└── src/
    ├── components/
    │   ├── PawMark.tsx
    │   ├── BusinessTodayDashboard.tsx  # the "2A" Today dashboard (presentational)
    │   ├── StatBox.tsx          # one headline count (filled | outline | danger)
    │   ├── JobListItem.tsx      # one job row (presentational)
    │   ├── PlaceholderScreen.tsx # "not built yet" tab body
    │   └── SignOutButton.tsx    # shared by every home screen
    ├── context/
    │   ├── AuthContext.tsx      # token state, signIn/signOut, cold-start restore
    │   └── SessionContext.tsx   # getSession result; useSession / useActiveMembership
    ├── graphql/
    │   ├── auth.ts              # LOGIN
    │   ├── session.ts           # GET_SESSION
    │   └── job.ts               # GET_BUSINESS_JOBS
    ├── lib/
    │   ├── apolloClient.ts      # links: error -> auth -> http
    │   ├── datetime.ts          # formatToday / formatTime (device-local)
    │   ├── env.ts               # validated EXPO_PUBLIC_* access
    │   └── tokenStorage.ts      # SecureStore, localStorage on web
    ├── navigation/
    │   ├── RootNavigator.tsx    # auth stack <-> AppContainer, on token
    │   ├── AppContainer.tsx     # loads getSession, picks the role app
    │   ├── OwnerManagerApp.tsx  # bottom tab bar, 6 tabs
    │   ├── EmployeeApp.tsx      # stack; tab bar later (§9)
    │   └── CustomerApp.tsx      # stack; tab bar later (§9)
    ├── screens/
    │   ├── owner/
    │   │   ├── OwnerHomeScreen.tsx     # the "2A" Today tab (owns getBusinessJobs)
    │   │   ├── AccountScreen.tsx       # real, read-only
    │   │   ├── RequestsScreen.tsx      # placeholder
    │   │   ├── ScheduleScreen.tsx      # placeholder
    │   │   ├── TeamScreen.tsx          # placeholder
    │   │   └── BusinessScreen.tsx      # placeholder
    │   ├── employee/
    │   │   └── EmployeeHomeScreen.tsx  # placeholder
    │   ├── customer/
    │   │   └── CustomerHomeScreen.tsx  # placeholder
    │   └── auth/
    │       ├── LoginScreen.tsx
    │       └── WelcomeScreen.tsx
    ├── theme/
    │   ├── colors.ts
    │   └── typography.ts
    ├── types/
    │   ├── session.ts
    │   └── job.ts
    └── validation/
        └── auth.ts
```

### ⚠️ Apollo Client 4 import paths differ from v3

Most Apollo examples online are v3 and **will not resolve** here. Verified against the installed
`@apollo/client@4.2.7`:

| Symbol | v4 import path |
|--------|----------------|
| `ApolloClient`, `ApolloLink`, `HttpLink`, `InMemoryCache`, `gql`, `TypedDocumentNode`, `NetworkStatus` | `@apollo/client` |
| `ApolloProvider`, `useQuery`, `useMutation`, `useLazyQuery`, `useSuspenseQuery` | `@apollo/client/react` — **not** the root |
| `SetContextLink` | `@apollo/client/link/context` |
| `ErrorLink` | `@apollo/client/link/error` |
| `CombinedGraphQLErrors` | `@apollo/client` (also `@apollo/client/errors`) |

Two further v4 changes that bite:

- **`SetContextLink` takes `(prevContext, operation)`** — v3's `setContext` took them the other way
  round. Both still exist; `setContext`/`onError` are deprecated aliases.
- **Errors are typed classes, not one `ApolloError`.** Check with `CombinedGraphQLErrors.is(error)`
  before reading `error.errors[].extensions.code`.
- `rxjs` is a required peer dependency (present transitively at 7.8.2). Don't remove it.

The directory conventions above hold as the app grows: one folder per concern, `screens/` gets a
subfolder per feature area, `graphql/` is grouped by domain.

---

## 4. Environment Variables

**`.env` is gitignored** (by the repo-root `.gitignore`, which has a bare `.env` entry).
**There is no `.env.example` checked in** — on a fresh clone, create `.env` yourself with the
variable below, or the app throws a descriptive error from `src/lib/env.ts` on first load instead
of failing with an opaque `undefined` URL. (A tracked `.env.example` would remove this manual step
— worth adding.)

```
EXPO_PUBLIC_API_URL=http://localhost:4000/graphql
```

**`EXPO_PUBLIC_*` variables are inlined into the JS bundle at build time.** They are readable by
anyone with the app binary — they exist for per-environment *config*, not secrecy. Never put a
secret, API key, or credential in one. That's fine for everything this app needs: the API URL is
public by definition, and the only credential it holds is the user's JWT, issued at runtime by
`login` and kept in the device keychain (`src/lib/tokenStorage.ts`) — never in a build-time variable.

Two consequences worth knowing:

- **Metro only inlines statically-analysable references.** `process.env.EXPO_PUBLIC_API_URL` written
  out literally works; a dynamic `process.env[name]` compiles and then resolves to `undefined` at
  runtime. `src/lib/env.ts` is the single place that reads it.
- **Env vars are read when the bundle is built**, so a Metro server that's already running won't pick
  up an edited `.env`. Restart with `npx expo start -c`.

Host resolution differs per platform — this is the single most common "it works on web but not my
phone" cause:

| Target | Correct host |
|--------|--------------|
| Expo web preview | `localhost` |
| iOS simulator | `localhost` |
| Android emulator | `10.0.2.2` |
| **Physical device (Expo Go)** | Your machine's **LAN IP**, e.g. `http://192.168.1.23:4000/graphql` |

On a physical device `localhost` resolves to *the phone*, not your dev machine. Override in a
git-ignored `.env.local` rather than editing the committed `.env`.

---

## 5. Running the App

From `phone_app/`:

```bash
npx expo start           # QR code for Expo Go on a physical device
npx expo start --web     # browser preview (fastest iteration, least fidelity)
npx expo start -c        # same, clearing the Metro bundler cache
```

The backend must be running separately (`npm run dev` from `backend/`, plus
`docker compose up -d` from the repo root for Postgres).

**Known gotchas:**

- **WSL networking.** If you run Metro from WSL, a physical device often cannot reach it — WSL2 is
  NAT'd separately from Windows. Use `npx expo start --tunnel`, or run from a Windows terminal
  instead. The project lives on the Windows filesystem either way.
- **CORS on web only.** The browser enforces CORS; native `fetch` does not. The backend whitelist
  in `backend/src/server.ts` must contain the Expo web origin (`http://localhost:8081`) or every
  request fails as a bare `TypeError: Failed to fetch` with no status code — which looks nothing
  like an auth error. `localhost:8081` **is** in that whitelist as of `server.ts:33`. If you ever
  serve Metro on a different port, add that origin too.
- After adding a package, restart with `-c`. Most "module not found" weirdness is a stale cache.

---

## 6. Platform Differences That Bite

**`expo-secure-store` has no web implementation.** It wraps iOS Keychain / Android Keystore;
`SecureStore.isAvailableAsync()` only ever resolves `true` on those two platforms. Calling
`getItemAsync` in a browser throws `ExpoSecureStore.default.getValueWithKeyAsync is not a function`.

Any token-storage helper must branch on `Platform.OS === 'web'` and fall back to `localStorage`.
That fallback is acceptable **only** because web is a dev preview target; it is not secure storage
and nothing sensitive should rely on it.

The same class of problem applies to `react-native-maps`, `expo-notifications`, and most native
modules. When a feature misbehaves only in the browser, suspect the platform before the logic.

---

## 7. Backend API Contract

Base URL: `EXPO_PUBLIC_API_URL` → `POST /graphql`. Single endpoint, Apollo Server 5.

### Authentication

- `login`, `registerCustomer`, and `acceptInvitation` return `AuthPayload { token, user }`.
  `registerOwner` returns `OwnerAuthPayload { token, user, business }`.
- Send the JWT as `Authorization: Bearer <token>` on every authenticated request.
- The backend decodes it in `server.ts` on **every** request into `context.user`. `verifyToken()`
  never throws — an absent, malformed, or expired token simply yields `context.user === null`.
- Resolvers requiring auth throw a `GraphQLError` with `extensions.code === 'UNAUTHENTICATED'`.
  **The client must treat that code as "session over" and sign the user out**, otherwise an expired
  token leaves every screen silently broken with no recovery path.

### Scalars

- **`DateTime` serializes to an ISO 8601 string** (`2026-07-21T12:00:00.000Z`) via the custom
  scalar in `backend/src/graphQL/scalars.ts`. It accepts an ISO string *or* epoch-ms number as
  input.
  > Note: some recorded responses in `TEST_DATA_AND_RESPONSES.md` show epoch-ms strings like
  > `"1784477086805"`. Those predate the `DateTime` scalar, which was introduced specifically to
  > fix that. Trust `scalars.ts`, not the older recorded examples.
- `Float` fields backed by Postgres `Decimal` (`Job.price`, `Booking.totalPrice`,
  `Business.avgRating`, …) are converted to `Number` by type-level resolvers server-side. They
  arrive as plain JSON numbers — no client-side decimal handling needed.
- `JSON` is `graphql-type-json`.

### Error handling

All mutation inputs are Zod-validated server-side; failures come back as a **single
comma-separated message** in `extensions.code === 'BAD_USER_INPUT'` — not a per-field structure.
Mirroring the backend's Zod rules client-side (§10) is what gives users per-field errors.

Common codes: `UNAUTHENTICATED`, `BAD_USER_INPUT`, `FORBIDDEN`, `NOT_FOUND`.

---

## 8. Role Model — The Core Architectural Constraint

**A user is not "a customer" or "a sitter". Roles are per-business and simultaneous.**

- `User` is the identity. `globalRole` is `USER` for essentially everyone — it is **not** the app
  role and must not drive UI.
- Being a customer means having a `CustomerProfile`.
- Being staff means having one or more `BusinessMember` rows, each with its own
  `role` (`OWNER` | `MANAGER` | `EMPLOYEE`) scoped to one business, and its own `isActive` flag.
- The same person can be a customer *and* an OWNER of one business *and* an EMPLOYEE of another,
  all at once. The backend explicitly supports this: `cancelJob` resolves the caller's customer role
  and business role independently and grants the union of what either allows.

Consequences for the app:

1. Session state must model **a set of roles**, never a single `role` string.
2. The UI needs an explicit **active context switcher** (Personal / each business), because "which
   UI do I render" is a user choice when someone holds multiple roles — it cannot be derived.
3. Authorization is always re-checked server-side. Client-side role logic is for *presentation
   only*; never treat a hidden button as a security boundary.

### 8.1 How the app routes on role — and the two simplifications it makes

`RootNavigator` → (token) → `AppContainer` → one of `OwnerManagerApp` / `EmployeeApp` /
`CustomerApp` → that role's home screen. `AppContainer` is the only place that queries `getSession`;
everything below reads it synchronously via `useSession()`.

`resolveAppKind(session)` (exported from `AppContainer.tsx`) is the whole decision:

| Session shape | App |
|---|---|
| First membership is `OWNER` or `MANAGER` | Owner/Manager |
| First membership is `EMPLOYEE` | Employee |
| No membership, has a `CustomerProfile` | Customer |
| Neither | `none` — an explanatory screen + sign out |

**Two deliberate simplifications live here, and both contradict the role model above.** They are
product choices, not facts about the API — write new code against the API's shape, not these:

1. **One business per user.** `useActiveMembership()` returns `memberships[0]` and ignores the rest.
   The API does not enforce this: `BusinessMember` is a junction table keyed `(userId, businessId)`
   and `getSession` returns an array. A second membership is silently invisible in the UI.
2. **Staff beats customer.** A user who is both lands in the staff app and cannot reach the customer
   app at all. The `customer.test1` test account is exactly this case — an active MANAGER *and* a
   customer — so it will open the Owner/Manager app, not the Customer one.

Both are the same missing feature: the **active context switcher** in point 2 of the list above.
Building it means replacing `resolveAppKind`'s automatic choice with a user-chosen context (and
letting `useActiveMembership` take an id), not adding a role field to the API.

### ✅ Resolved: use `getSession` to build the session context

**This is the query the session context should be built on.** One call after login returns
everything needed to decide what to render:

```graphql
query GetSession {
  getSession {
    user { id firstName lastName email avatarUrl }
    memberships {
      id
      role                 # OWNER | MANAGER | EMPLOYEE
      joinedAt
      business { id name heroPhotoUrl city }
    }
    customerProfile { id address city }
  }
}
```

Read it as **two independent facts**, never one:

- **Staff?** → `memberships.length > 0`, and each entry carries its own `role`, so a user who is a
  MANAGER at one business and an EMPLOYEE at another is represented correctly.
- **Customer?** → `customerProfile != null`.

**`memberships` being empty does not mean the user is a customer.** An owner created by
`registerOwner` (which makes no `CustomerProfile`) and later soft-removed by `removeMember` has
neither — check `customerProfile` on its own. A `User.isBusinessMember` boolean was considered for
this and rejected precisely because it collapses the two facts into one and gets that case wrong.

Which context to land in is a **client** decision — the API deliberately doesn't pick for you, so
the context switcher in point 2 above is where that logic belongs. Re-run `getSession` after
anything that changes a role.

> `getMyBusinesses` still returns `[Business!]!` and still discards the role. It was left alone
> rather than broken, since `getSession` covers the role-aware case. Use `getSession` whenever the
> role matters.

**Job lists are fetched per-screen, never bundled into `getSession`.** `getSession` is identity +
roles only; each screen pulls its own filtered slice through `getBusinessJobs` (OWNER/MANAGER),
`getMyJobs` (sitter), or `getMyBookings`/`getMyUpcomingJobs` (customer). The Home dashboard
(`src/components/BusinessTodayDashboard.tsx`) is the first instance: it takes the `business.id`
from a `getSession` membership and calls `getBusinessJobs` with `from`/`to` set to the **device's
local** midnight-to-midnight, then derives its three headline counts client-side from that one
result set (Jobs today / Unassigned / Cancelled today — see the component for the exact predicates).
Compute the day window client-side, not server-side — the backend has
no per-business timezone, so a server "current date" would be UTC and land wrong at the day's edges.
Backend `AI_MANIFEST.md` §10 has the full rationale for why this deliberately stayed out of
`getSession`.

---

## 9. Design System

From `first_draft_screens.html` (the visual prototype at the root of `phone_app/`, not the git repo
root — open it in a browser; it is a self-contained bundle and cannot be usefully grepped).

| Token | Value |
|-------|-------|
| Background | `#F7F8F6` (near-white green) |
| Primary | `#0F1D1B` (Phthalo green) |
| Accent | `#C08B2E` (warm honey — ratings, highlights) |
| Card radius | 18px |
| Headings | Sora |
| Body | Manrope |

Tab bars differ per role context:

- **Customer:** Home · Bookings · Inbox · Pets · Account — **planned**
- **Owner/Manager:** Today · Requests · Schedule · Team · Business · Account — **built**
  (`OwnerManagerApp.tsx`; `Business` was added to the prototype's five). Only `Today` has a real
  screen; the other four are `PlaceholderScreen`s naming the query behind them, and `Account` is
  real but read-only.
- **Employee/Sitter:** Today · Schedule · Earnings · Profile — **planned**

All photos in the prototype are placeholders. See §11 — there is no upload mechanism behind any
photo field.

---

## 10. Conventions

- **Mirror backend Zod rules client-side.** `src/validation/` should reproduce
  `backend/src/utils/validate.ts` field-for-field so users get per-field errors before a round trip.
  The backend remains the authority; the client copy is UX, not enforcement. Keep them in sync —
  password rules in particular (min 8, one uppercase, one number, one special character).
- **Types mirror the GraphQL schema.** Hand-written types in `src/types/` must match
  `backend/src/graphQL/typeDefs.ts`. They *will* drift; consider GraphQL Code Generator once the
  surface grows.
- **Read tokens fresh per request** in the Apollo auth link rather than caching in a module
  variable, so sign-out/sign-in is picked up without recreating the client.
- **`Platform.OS` guards** around every native-only module (§6).
- Follow the existing file's style — this codebase comments the *why*, not the *what*.

---

## 11. Not Yet Built / Blocked on Backend

Do not build UI against these. Each needs a backend decision first.

| Feature | Status |
|---------|--------|
| **Photo upload** | `Pet.photoUrl`, `Business.heroPhotoUrl`, `User.avatarUrl`, `JobUpdate.photoUrl` are plain nullable `String` columns. **Nothing in the app accepts a file, stores an image, or serves one** — no `/uploads` route, no object storage, no processing. A client must supply an already-hosted URL. Blocks the pet profile, business hero, avatar, and the sitter's "Add photo" on a live job. Decide the strategy (e.g. S3/Cloudinary + a signed-upload mutation) before any of those screens. |
| **Payments** | No payment processor is integrated. The `finance` domain is *internal ledger accounting only* — `LedgerEntry`, `EmployeeEarning`, `Payout`. The booking checkout and receipt/tip screens show card entry and charges that cannot actually happen. |
| **Messaging** | `Conversation` and `Message` **Prisma models exist**, but there is no messaging resolver domain, no GraphQL types, and no mutations — same "groundwork without an API" situation as the admin models. Every "Message Maya" button and the whole Inbox tab have no endpoint. |
| **Push notifications** | `expo-notifications` is not installed and there is no column anywhere to store a device push token. The owner Requests inbox implies push ("respond by 7 PM", "18 min ago"). |
| **Maps** | `react-native-maps` is not installed. `expo-location` (installed) only *gets* coordinates; it cannot render a map. Needed for map discovery, job tracking, and the sitter's live route. |
| **Admin API** | Planned, not built — see `AI_MANIFEST.md` §11. No `/admin/graphql` endpoint exists. Irrelevant to this app unless an admin client is added. |
| **Scheduler / expiry** | There is no background job runner. `Job.respondBy` is advisory: nothing auto-expires a `PENDING` request. Do not build UI implying automatic expiry. |

---

## 12. Adding a New Screen — Checklist

1. Confirm the backend operation exists in `backend/src/graphQL/typeDefs.ts` (not just in
   `AI_MANIFEST.md` — it drifts) and is spread into `resolvers/index.ts`.
2. Add the `gql` document under `src/graphql/<domain>.ts`.
3. Add/extend the matching TS types in `src/types/`.
4. If it takes user input, add a Zod schema in `src/validation/` mirroring the backend's rule.
5. Build the screen; guard native-only modules with `Platform.OS`.
6. Register it in the relevant navigator and add its params to the stack's param list.
7. Verify the role gating matches what the resolver actually enforces — the server is the authority;
   the UI only reflects it.
8. Update this file.
