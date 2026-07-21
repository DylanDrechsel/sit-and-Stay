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

**One static screen exists. There is no networking, navigation, auth, or state management yet.**

What exists today:

| Path | State |
|------|-------|
| `App.tsx` | Loads the six Sora/Manrope weights via `useFonts`, then renders `WelcomeScreen` directly. Holds on a brand-coloured `View` while fonts load rather than flashing white. |
| `index.ts` | `registerRootComponent(App)` — standard, don't edit |
| `app.json` | Expo config; `expo-font` registered under `plugins` |
| `tsconfig.json` | Extends `expo/tsconfig.base`, `strict: true` |
| `assets/` | Default icons/splash from the template |
| `src/theme/colors.ts` | Design-system palette (§9) |
| `src/theme/typography.ts` | Font-family constants. Every family here must also be registered in `App.tsx`'s `useFonts` call or `Text` silently falls back to the system font. |
| `src/components/PawMark.tsx` | Logo mark |
| `src/screens/auth/WelcomeScreen.tsx` | Sign-in landing screen. The Apple and Google buttons are **deliberately inert `View`s, not `Pressable`s** — the API has no OAuth mutation, and `login` rejects accounts with a null `passwordHash`, which is exactly what a social account would be. "Continue with email" takes an optional `onContinueWithEmail` prop that nothing passes yet. |

Everything else below is **PLANNED**. There is no `src/lib/`, `src/graphql/`, `src/context/`,
`src/navigation/`, `src/types/`, or `src/validation/` — no Apollo client, no token storage, no
navigator. Check the filesystem before assuming any provider or helper exists.

> **Sequencing decision (2026-07-21):** the backend is being finished and verified first; the app is
> deliberately not being built out against it yet. Do not add screens, providers, or GraphQL
> documents to `phone_app/` until that changes — see §8 for the one backend fix this depends on.

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
├── App.tsx                      # useFonts + renders WelcomeScreen
├── index.ts                     # registerRootComponent, do not edit
├── app.json                     # Expo config (plugins: expo-font)
├── tsconfig.json                # extends expo/tsconfig.base, strict
├── AGENTS.md                    # read the SDK 57 docs before writing Expo code
├── assets/                      # icons + splash
└── src/
    ├── components/
    │   └── PawMark.tsx
    ├── screens/
    │   └── auth/
    │       └── WelcomeScreen.tsx
    └── theme/
        ├── colors.ts
        └── typography.ts
```

**PLANNED** layout under `src/` — create these as you need them, not upfront:

```
src/
├── components/                  # Shared presentational components
├── context/                     # AuthContext, SessionContext (§8)
├── graphql/                     # gql documents, grouped by domain
├── lib/                         # apolloClient.ts, secureStore.ts
├── navigation/                  # RootNavigator, per-role stacks, param lists
├── screens/                     # One folder per feature area
├── theme/                       # colors.ts, typography.ts
├── types/                       # TS types mirroring GraphQL schema types
└── validation/                  # Zod schemas mirroring backend validate.ts
```

---

## 4. Environment Variables

`phone_app/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:4000/graphql
```

**`EXPO_PUBLIC_*` variables are inlined into the JS bundle at build time.** They are readable by
anyone with the app binary. Never put a secret, API key, or credential in one.

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

---

## 9. Design System

From `first_draft_screens.html` (the visual prototype at the repo root — open it in a browser; it
is a self-contained bundle and cannot be usefully grepped).

| Token | Value |
|-------|-------|
| Background | `#F7F8F6` (near-white green) |
| Primary | `#123524` (Phthalo green) |
| Accent | `#C08B2E` (warm honey — ratings, highlights) |
| Card radius | 18px |
| Headings | Sora |
| Body | Manrope |

Tab bars differ per role context:

- **Customer:** Home · Bookings · Inbox · Pets · Account
- **Owner/Manager:** Today · Requests · Schedule · Team · Account
- **Employee/Sitter:** Today · Schedule · Earnings · Profile

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
