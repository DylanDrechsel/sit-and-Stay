# PetSitterPro — UI Style Guide & Build Spec

Hand this file to any AI/developer building PetSitterPro screens. It captures the exact visual
language of the approved prototype (Customer, Sitter, and Owner/Manager experiences in one app).
Values are literal — hex codes, radii, paddings and weights are not suggestions. When in doubt,
copy the recipe strings verbatim.

**Stack-agnostic.** Everything is plain CSS (written here as inline-style strings, the same form
used in the prototype). Adapt syntax to your framework; keep the numbers.

---

## 0. Ground rules (read first)

- ONE app. After auth, `account.role` (`OWNER` | `MANAGER` | `EMPLOYEE` | `null`) picks which
  experience renders (§8). All roles share every token and component below.
- Layout is always flex/grid with `gap` — never margins between siblings, never inline flow.
- Styling is per-element (inline styles / utility equivalents). No global class themes.
- All borders/shadows are tinted with the primary (`rgba(15,29,27,α)`) — never neutral gray.
- `box-sizing:border-box` on anything with `width:100%` + padding (inputs, full-width buttons).
- Interactive elements: `cursor:pointer` and hit target ≥ 36px (44px preferred).

## 1. Brand snapshot

- Product: PetSitterPro — B2B2C pet-care marketplace (customers ↔ pet-care businesses ↔ sitters).
- Personality: calm, trustworthy, neighborhood-professional. Deep green + honey accents,
  generous white cards, soft shadows. Never corporate-blue, never playful-startup-purple.
- Signup asks one question — pet owner or pet-care business. `EMPLOYEE` accounts are never
  self-created; they exist only through a business's emailed invitation (`acceptInvitation`).
- The paw mark is the brand glyph (§10.1): logo tile, back button, rating stamps — always the
  same 5 shapes, never redrawn.

## 2. Color system

### Core

| Token | Value | Use |
|---|---|---|
| `primary` | `#0F1D1B` | THE brand dark green. Filled buttons, active tab/chip fills, dark stat cards, toggle-on, selected borders, auth background |
| `primary-hover` | `#0A1412` | Hover/pressed on primary, link hover |
| `ink` | `#122B1C` | Default body/heading text |
| `text-secondary` | `#5C6F62` | Subtitles, meta lines, labels |
| `text-muted` | `#8AA08F` | Timestamps, inactive tab icons, tertiary info, chevrons |
| `text-soft` | `#3C5244` | Chip text on white, secondary-button text |
| `on-primary` | `#F2F6F1` | Text/icons on primary backgrounds (never pure white) |

### Surfaces

| Token | Value | Use |
|---|---|---|
| `bg-app` | `#F7F8F6` | Phone screen background |
| `bg-canvas` | `#E9EBE6` | Page/desktop behind the phone |
| `surface` | `#FFFFFF` | Cards, sheets, bars |
| `bg-inset` | `#F0F4EF` / `#F0F2EF` | Inset panels inside cards, confirm panels, input pills |
| `bg-control` | `#EBEFEA` | Segmented-control track, neutral chips |

### Borders & shadows (primary-tinted alphas)

| α | Use |
|---|---|
| `rgba(15,29,27,.06)` | List-row dividers |
| `rgba(15,29,27,.07)` | In-card dividers (`height:1px`) |
| `rgba(15,29,27,.08)` | Card hairline: `border:1px solid rgba(15,29,27,.08)` |
| `rgba(15,29,27,.10–.12)` | Stat tiles, avatar rings, chips |
| `rgba(15,29,27,.15)` | Inputs & outline buttons: `border:1.5px solid rgba(15,29,27,.15)` |
| `rgba(15,29,27,.2–.3)` | Radio/checkbox resting borders |
| `rgba(15,29,27,.25)` | Dashed "add new": `border:1.5px dashed rgba(15,29,27,.25)` |

Shadows: resting card `0 2px 10px rgba(15,29,27,.04)` · pill/search `0 2px 8px rgba(15,29,27,.05)`
· selected/elevated `0 4px 14px rgba(15,29,27,.1)` · floating map chip `0 2px 8px rgba(15,29,27,.15)`
· bottom sheet `0 -8px 30px rgba(15,29,27,.18)`.

### Accents

| Token | Value | Use |
|---|---|---|
| `honey` | `#C08B2E` | Paw rating stamps, attention dots, ledger debit dots, chart highlight |
| `honey-text` | `#8A6A1F` | Text on honey chips, "owed" figures |
| `honey-deep` | `#7A6027` / `#8A4B00` | Amber-notice body / negative money & refunds |
| `bg-warn` | `#FBF6EA` (notices) · `#FBF0E0` (chips/badges); border `rgba(192,139,46,.3)`; strong border `rgba(192,139,46,.45)` | Amber notices, PENDING badges, unassigned tiles |
| `success` | `#2FA45E` | Live dots, done timeline fill, availability accent |
| `success-strong` | `#1E7A43` | "In progress" text, positive money, ✓ marks |
| `success-deep` | `#175C33` | Text on success-tinted cards |
| `bg-success` | `#E2F2E7`; border `rgba(47,164,94,.3)` | Success/live chips & banners |
| `sage` | `#2E6B45` on `#E7EFE7` | Verified chips, tertiary link-actions ("See all", "Change") |
| `danger` | `#C2452D` | Destructive CTA (clock out), notification badge, map end-pin |
| `danger-soft` | `#8A3C3C` | "Log out"/destructive list rows |
| `bg-danger` | `#F8E9E9`, text `#7A3C3C` | DECLINED badges |
| `live-dot-on-dark` | `#7FD6A0` | Green dot on primary-colored cards |

Rule: pick from this palette only. If a new tint is unavoidable, derive it in oklch from
`primary` or `honey` (same chroma/lightness, shifted hue). Never blue/purple/gray-blue. Never
`#123524` (the old primary) — borders/shadows always use `rgba(15,29,27,α)`.

## 3. Status system (Job lifecycle)

One badge per `JobStatus`, identical everywhere. Badge recipe:
`font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px` (small variant:
`font-size:10px;padding:2px 8px` inside dense rows). Text is UPPERCASE.

| Status | Text | Background | Extras |
|---|---|---|---|
| `PENDING` | `#8A6A1F` | `#FBF0E0` | |
| `ACCEPTED` | `#2E6B45` | `#E7EFE7` | |
| `ASSIGNED` | `#2E6B45` | `#E7EFE7` | |
| `IN_PROGRESS` | `#1E7A43` | `#E2F2E7` | `●` live-dot prefix when active now |
| `COMPLETED` | `#175C33` | `#E2F2E7` | |
| `CANCELLED` | `#5C6F62` | `#EBEFEA` | host card `opacity:.75` |
| `DECLINED` | `#7A3C3C` | `#F8E9E9` | host card `opacity:.65–.75` |

Status is one-way: `PENDING → ACCEPTED (or DECLINED) → ASSIGNED → IN_PROGRESS → COMPLETED`,
cancellable from several points. The UI never offers a backwards transition.

**Status timeline** (vertical): each step = dot column + text.
- Dot: `width:12px;height:12px;border-radius:50%`; done → `background:#2FA45E`; current adds
  `box-shadow:0 0 0 4px rgba(47,164,94,.2)`; upcoming → transparent +
  `border:2px solid rgba(15,29,27,.2)` (`box-sizing:border-box`).
- Connector under dot: `width:2px;height:22–24px`; filled `#2FA45E` between done steps, else
  `rgba(15,29,27,.12)`; last step height 0.
- Text: `font-size:13px`; done `font-weight:800` `#122B1C` (current `#1E7A43`); upcoming
  `font-weight:700` `#8AA08F`; timestamps appended as
  `<span style="color:#8AA08F;font-weight:600">· Sun 6:12 PM</span>`; `margin-top:-1px`.

## 4. Typography

- Display/headings: **Sora** 600/700/800. Body/UI: **Manrope** 400–800. Codes & placeholder
  labels: `ui-monospace, monospace`.
- Import: `https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap`
- `letter-spacing:-0.01em` on Sora ≥17px. `font-variant-numeric:tabular-nums` on money columns.

| Role | Spec |
|---|---|
| Screen title (root tabs) | Sora 24/700 |
| Greeting above title | Manrope 13/600 `#5C6F62` |
| Detail-screen title | Sora 17/700 + sub Manrope 12/600 `#5C6F62` |
| Auth wordmark | Sora 24–27/800 |
| Card/section heading | Sora 14–16/700 |
| Big stat | Sora 17–30/800 |
| Card item title | Manrope 13.5–14.5/800 |
| Body | Manrope 13–13.5/500–600, line-height 1.45–1.55 |
| Meta/sub line | Manrope 11.5–12/600 `#5C6F62` |
| Micro meta | Manrope 11/600–700 `#8AA08F` |
| Chip/badge | Manrope 10–11/800 |
| Section eyebrow | 10–11px/800, UPPERCASE, `letter-spacing:.04–.1em`, `#8AA08F` or `#5C6F62` |
| Tab label | Manrope 10/700 |

Sentence case everywhere; UPPERCASE only badges + eyebrows.

## 5. Layout & geometry

- Device: iOS frame 402×874 (bezel radius 48, status bar "9:41"); pass `dark` to the frame on
  green (auth) screens so the status bar is white. Screen root:
  `display:flex;flex-direction:column;height:100%;background:#F7F8F6;color:#122B1C;overflow:hidden;position:relative`.
- Root-tab screens: scroll area `flex:1;overflow:auto;padding:70px 20px 12px` +
  `display:flex;flex-direction:column;gap:12–18px`.
- Detail screens: header row `padding:66px 20px 12px;display:flex;align-items:center;gap:12px;flex:none`
  (paw-back + title block), then scroll area `padding:8px 20px 12px`.
- Auth screens: `padding:84–96px 24–26px 32px`.
- Rhythm: 12–16px gap between cards; 8–10px between rows of a group; 10px between tiles.
- Radii: cards 18 (featured 20); inner panels/inputs 12–14; small tiles 11–12; buttons/pills/
  badges 999; photo thumbs 14; logo tiles 11–19; avatars = circle.
- Bottom action bar: `background:#fff;border-top:1px solid rgba(15,29,27,.08);padding:12–14px 20px 32–34px;flex:none`.
- Tab bar: `display:flex;background:#fff;border-top:1px solid rgba(15,29,27,.08);padding:10px 8px 30px;flex:none`;
  each item `flex:1;display:flex;flex-direction:column;align-items:center;gap:3px`; icon 22px
  stroke 1.8 `currentColor`; label 10/700; active `#0F1D1B`, inactive `#8AA08F`. Count badge:
  absolute `top:-4px;right:-8px;min-width:16px;height:16px;border-radius:999px;background:#C2452D`
  white 9.5/800.

## 6. Component recipes (copy verbatim)

- **Primary button**:
  `text-align:center;background:#0F1D1B;color:#F2F6F1;border-radius:999px;padding:15px;font-size:15px;font-weight:800;cursor:pointer`
  (13–14px padding / 13–14px text in cards). Include money when confirming a charge
  ("Confirm booking · $120.00"). On dark screens invert: `background:#F2F6F1;color:#0F1D1B`.
- **Secondary/outline button**:
  `text-align:center;padding:13px;border-radius:999px;border:1.5px solid rgba(15,29,27,.15);font-size:13.5px;font-weight:800;color:#3C5244;cursor:pointer`
  (or `#122B1C` text). Paired Cancel/Confirm: outline `flex:1`, primary `flex:1.5–1.6`.
- **Destructive button**: primary recipe with `background:#C2452D;color:#fff` — clock-out/final
  only. Destructive text rows/links: bare `#8A3C3C` 13–14/800.
- **Tertiary link-action**: bare text `#2E6B45` 12–13/800.
- **Segmented control**: track `display:flex;background:#EBEFEA;border-radius:12px;padding:4px`;
  segment `flex:1;text-align:center;padding:9px;border-radius:9px;cursor:pointer;font-size:13px`;
  active adds `background:#fff;box-shadow:0 2px 8px rgba(15,29,27,.08);font-weight:800;color:#0F1D1B`;
  inactive `font-weight:700;color:#5C6F62;background:transparent`.
- **Text input**:
  `width:100%;box-sizing:border-box;background:#fff;border:1.5px solid rgba(15,29,27,.15);border-radius:14px;padding:14px 16px;font-family:Manrope,sans-serif;font-size:14px;font-weight:600;color:#122B1C;outline:none`.
  Textarea: same + `min-height:76–88px;resize:none;padding:13px 16px;font-size:13.5px`.
  On dark auth screens: `background:rgba(242,246,241,.12);border:1.5px solid rgba(242,246,241,.25);color:#F2F6F1`
  and `::placeholder{color:rgba(242,246,241,.55)}`.
- **Number-in-tile input** (fee/pay%/price): white tile + eyebrow label, then
  `$`/`%` affix 14/800 `#5C6F62` beside a bare input
  `border:none;background:transparent;font-family:Sora;font-size:19px;font-weight:800;color:#122B1C;outline:none;padding:0`.
- **Radio**: 20px circle; selected `border:6px solid #0F1D1B`; rest `2px solid rgba(15,29,27,.3)`
  (`box-sizing:border-box`). Selected option card: `border:2px solid #0F1D1B` + elevated shadow,
  padding reduced 0.5px each side to keep size.
- **Checkbox**: 20–22px, `border-radius:6–7px`; checked `background:#0F1D1B` + white polyline
  check (stroke 2); rest transparent + `border:2px solid rgba(15,29,27,.3)`.
- **Toggle**: track `width:46px;height:28px;border-radius:999px;position:relative;flex:none;transition:background .15s`,
  on `#0F1D1B` / off `rgba(15,29,27,.15)`; knob absolute
  `top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(15,29,27,.2);transition:left .15s`,
  `left:21px` on / `left:3px` off. Card at `opacity:.6` + INACTIVE chip when off.
- **Stepper**: − `width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(15,29,27,.15);color:#3C5244`;
  + same but `background:#0F1D1B;color:#F2F6F1`; count 16/800 `min-width:18px;text-align:center`;
  gap 14. Count never below 0.
- **Card**: `background:#fff;border:1px solid rgba(15,29,27,.08);border-radius:18px;padding:16px`
  (+ resting shadow when featured). In-card divider `height:1px;background:rgba(15,29,27,.07)`.
- **List row (settings)**: rows `display:flex;align-items:center;gap:12px;padding:15px 16px` with
  `border-bottom:1px solid rgba(15,29,27,.06)` (none on last), inside a card with
  `overflow:hidden;padding:0`. 18px stroke icon, title 13.5–14/700–800, right meta 12/700
  `#8AA08F`, chevron 13–14px `#8AA08F` (`points="6,3 11,8 6,13"`).
- **Stat tile**: `background:#fff;border:1px solid rgba(15,29,27,.1);border-radius:16px;padding:13–14px`;
  value Sora 17–22/800; label 10–11/700 `#5C6F62`. Variants: dark (`background:#0F1D1B`, value
  `#F2F6F1`, label `rgba(242,246,241,.65)`), amber-attention (`border:1.5px solid rgba(192,139,46,.45)`,
  value+label `#8A6A1F`), success-tinted values `#1E7A43`.
- **Dark hero card**: `background:#0F1D1B;border-radius:18–20px;padding:16–18px`; eyebrow
  11/700 `rgba(242,246,241,.6)` UPPERCASE; value Sora 26–30/800 `#F2F6F1`; sub 11–12.5
  `rgba(242,246,241,.55–.7)`; chips on it `background:rgba(242,246,241,.14)`.
- **Amber notice**: `background:#FBF6EA;border:1px solid rgba(192,139,46,.3);border-radius:14px;padding:11px 14px;font-size:12px;font-weight:600;color:#7A6027`.
- **Success banner**: `background:#E2F2E7;border:1px solid rgba(47,164,94,.3);border-radius:16px;padding:13px 15px`,
  leading 8px `#2FA45E` dot or white-circled ✓, text 12.5/700 `#175C33`.
- **Confirm-in-place**: swap the button for an inset panel
  `background:#F0F4EF;border-radius:14–16px;padding:12–13px 14px;text-align:center` (question
  13/800 + sub 11.5/600 `#5C6F62`) + Cancel/Confirm pair. No modals.
- **Bottom sheet** (only overlay allowed; secondary feeds like Finance recent activity):
  collapsed bar `background:#fff;border-top:1px solid rgba(15,29,27,.08);padding:13px 20px;display:flex;align-items:center;gap:10px`
  with green dot + 13.5/800 title + count + up-chevron. Expanded: absolute
  `left:0;right:0;bottom:0;max-height:72%;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -8px 30px rgba(15,29,27,.18);padding:10px 20px 34px;z-index:21`,
  40×5 drag handle (`rgba(15,29,27,.15)`), ✕ close (30px circle `#F0F2EF`), internally scrolling
  list; scrim `position:absolute;inset:0;background:rgba(15,29,27,.4);z-index:20`. Motion:
  `transform: translateY(105%) → translateY(0)` at `.3s cubic-bezier(.32,.72,.33,1)`; scrim
  opacity `.25s`. Requires `position:relative` on the screen root.
- **Chat bubbles**: mine `background:#0F1D1B;color:#F2F6F1;border-radius:18px 18px 6px 18px`;
  theirs `background:#fff;border:1px solid rgba(15,29,27,.08);border-radius:18px 18px 18px 6px`;
  both `padding:11px 14px;font-size:13.5px;font-weight:500;line-height:1.45;max-width:78%`.
  Quick replies: pills `background:#E7EFE7;color:#2E6B45;font-size:12px;font-weight:700;padding:7px 13px`.
- **Image placeholder** (until real photos): striped
  `background:repeating-linear-gradient(45deg,#E9EFE8,#E9EFE8 8px,#E2EAE1 8px,#E2EAE1 16px)`
  (10–12px stripes for areas ≥100px) + centered label `font:600 7–11px ui-monospace,monospace;color:#7A8B7D`
  naming the content ("dog photo", "live map"). Map surface variant:
  `repeating-linear-gradient(45deg,#E6EDE5,#E6EDE5 14px,#DFE8DE 14px,#DFE8DE 28px)`. Never draw
  illustrative SVG art.
- **Access-code chip**:
  `font:700 15px ui-monospace,monospace;background:#0F1D1B;color:#F2F6F1;border-radius:10px;padding:7px 13px;letter-spacing:.12em`
  — always with its visibility note (§9).
- **Avatar**: circle, striped placeholder fill, ring `border:1px solid rgba(15,29,27,.1)` when on
  white. Initials variant (admin): honey square/circle, initials Sora 800.

## 7. Shared screen patterns

- **Root screens** (tabs): Sora 24 title (or greeting line above), cards below, tab bar visible.
- **Detail/flow screens**: paw-back (§10.1) + Sora 17 title + 12px sub; actions pinned in a
  bottom bar. Tab bar hidden on customer/sitter detail screens; KEPT on business sub-screens
  (hub model — parent tab stays lit).
- **Multi-step flows**: "Step X of Y" right-aligned 12/700; progress = equal bars
  `height:4px;border-radius:99px`, done/current `#0F1D1B`, rest `rgba(15,29,27,.12)`, gap 5.
- **Auth screens** (the ONE colorful moment): full-bleed `#0F1D1B`, `#F2F6F1` text, dark status
  bar. Cream logo tile (62px, radius 19, dark paw, shadow `0 8px 24px rgba(0,0,0,.25)`), Sora
  27/800 wordmark, tagline `rgba(242,246,241,.65)`. Dark inputs (§6). Inverted primary button.
  "OR" divider: 1px lines `rgba(242,246,241,.18)`. Outline SSO buttons
  `border:1.5px solid rgba(242,246,241,.25)`. Footer legal 11/600 `rgba(242,246,241,.45)`.
  "Create account" → account-type question on the same green: Sora 24/800 two-line title, two
  cream option cards (`background:#F2F6F1;border-radius:20px;padding:18px`, icon tile 46px in
  `#E7EFE7`/`#FBF0E0`, title 15.5/800 ink) for pet owner (`role: null`) and business (`OWNER`),
  plus a translucent sitter note `background:rgba(242,246,241,.1);border:1px solid rgba(242,246,241,.18)`
  (sitters join ONLY via emailed invitation). Sign-in routes by `account.role`.
- Empty space is fine; never pad with fake content.

## 8. The three experiences — one app, rendered by role

### 8.1 Customer experience (`role: null`)

- Tabs (5): Home · Bookings · Inbox · Pets · Account.
- Screens: Home (greeting + "Who's caring for Biscuit today?", pill search, service chips row,
  live-walk banner on primary, "Top rated near you" business cards with photo, paw rating,
  Verified chip, "from $X"), Business detail (200px hero, stats trio, service rows with prices,
  reviews card), Booking flow (Step 1 packages as radio cards + add-on checkboxes, sticky
  subtotal bar; Step 2 review: summary card, price breakdown, payment row, care-notes notice),
  Booking confirmed (timeline), Live tracking (230px map, sitter row, timeline, updates feed),
  Bookings (Upcoming/Past segments; Past shows COMPLETED/CANCELLED/DECLINED cards), Completed
  job (sitter card, report-card READ view, lockbox row, receipt, review/tip actions), Leave
  review (paw-stamp input, tag chips, textarea), Add tip (presets $3/$5/$8/Custom, one-time
  notice, amount summary), Chat (bubbles, quick replies, composer), Pets list, Pet form
  (photo row, name, type chips, breed, age/weight two-up, vet & care section, access-notes
  warning), Account, Account settings (change email/phone/password rows, toggles, danger rows),
  in-app login/register.
- Report-card READ view: mood chip (`#1E7A43` on `#E2F2E7`), counter tiles `×2 pee` etc. in
  `#F0F4EF` radius 12, ✓ tiles in `#1E7A43`, sitter quote 13/500 `#3C5244`, photo thumbs 64px.
- Receipts always itemize: base + add-ons + service fee (+ tip when added) = total.

### 8.2 Sitter experience (`EMPLOYEE`)

- Tabs (4): Today · Schedule · Earnings · Profile.
- Screens: Invitation accept (business card + EMPLOYEE role chip + expiry, name/password,
  accept CTA — the only sitter entry), Today (stat trio incl. dark jobs tile + green
  in-progress tile, live-job card `border:2px solid #2FA45E`, up-next rows with time blocks),
  Job detail (window/address/pay rows — "You'll earn $16.80 · 70% of $24" in `#1E7A43` — customer
  card, pet card, instructions notice, door-code chip + "Visible to you only", clock-in
  confirm-in-place → "Open live job"), Live job (260px map, elapsed timer Sora 22/800 `#1E7A43`,
  photo/note/message action tiles, clocked-in row, destructive "Clock out & finish"), Report
  card FORM (mood chips, pee/poop steppers, Ate/Drank/Treat checkbox tiles, note textarea,
  photo row, "Send report card"), Job complete (check circle, earned line at the sitter's rate),
  Weekly availability (legend chips + seven 3-state rows + save), Earnings (dark unpaid-balance
  hero + "Your rate · 70%" chip, stat trio, per-job rows with "% of $X" math, tips `+$` green,
  adjustments `−$` amber, payout history with PAID chips), Profile.
- Availability rows (`border-radius:14px;padding:14px 15px`, tap cycles available → off → not
  set): available = white + `border:1px solid rgba(15,29,27,.1)` + `border-left:4px solid #2FA45E`,
  window 13.5/800; off = `background:#EBEFEA`, "Off this day" `#5C6F62`; not set =
  `border:1.5px dashed rgba(15,29,27,.25)`, "Not set" `#8AA08F` + "Unavailable" dashed chip.
  Unset ≠ available — label it treated-as-unavailable.

### 8.3 Business experience (`OWNER` / `MANAGER`)

- Tabs (6): Today · Requests · Schedule · Finance · Team · Manage. Sub-screens keep the tab bar.
  MANAGER = identical UI minus OWNER-only actions (set pay rate, record payouts).
- Screens: Today (2×2 stat grid, needs-attention request card, amber needs-sitter banner,
  on-duty rows → job detail), Requests inbox (pending cards with respond-by badges, tappable
  info rows → booking review), Booking review, Schedule (Day/Week toggle, date strip, per-sitter
  timeline rows → job detail; time gutter 52px, blocks `border-left:4px` semantic), Job detail,
  Finance, Jobs & receipts, Payroll, Ledger, Team, Member detail, Invite (email, role segmented,
  pay-rate row, expiry notice → sent state), Manage hub (STOREFRONT/MONEY/ACCOUNT sections),
  Business profile (cover, name, description, location row, FLAT SERVICE FEE + DEFAULT SITTER
  PAY tiles, override notice), Services & pricing, Service editor, Billing & plan, in-app
  login/register.
- **Dashboard stat grid**: `display:grid;grid-template-columns:1fr 1fr;gap:10px` — Jobs today
  (dark tile), Unassigned (amber tile), Needs sitter (white, tappable → schedule), Cancelled
  today (white, value `#5C6F62`). Counts only, no currency.
- **Booking review** (from "Review & accept" OR tapping any request row): respond-by amber
  banner (pending only), customer card (repeat chip), pet card (care-flag chip), every session
  listed, price card splitting "Customer pays" from "You receive" (green), code-sharing note.
  Pending → Decline / Accept & assign pinned; accepting reveals the sitter picker IN PLACE —
  available sitters first, then "UNAVAILABLE FOR …" eyebrow + rows at `opacity:.6` with reason
  chips (OFF / BOOKED). Accepted-but-unassigned → "Assign from schedule"; declined → muted card.
  Header badge mirrors live status.
- **Job detail**: status badge in header; info card (address · job price · sitter-pay line
  "$18.20 to Maya R. · 70%" in `#1E7A43`); customer / pet / sitter cards (sitter row notes the
  shared access code, links to member profile); 5-step status timeline; Message · Reassign
  outline pair + red "Cancel this job" text.
- **Finance tab**: dark balance hero ("All customer payments in, minus payouts"), owed
  (amber, → payroll) / "yours after payroll" tiles, month stats (collected · tips), missing-pay
  amber flag (`jobsMissingPayCount`), link rows (Jobs & receipts · Payroll · Ledger · Billing &
  plan), Recent activity via collapsed bar + bottom sheet (§6) — never inline.
- **Jobs & receipts**: Upcoming/Past segments. Upcoming rows: 46px DAY/date block + title
  (+ "· 1 of 4") + time · customer · sitter · price + status badge; unassigned = amber border,
  taps to assignment. Past rows: price tabular right-aligned above badge; cancelled/declined
  `opacity:.75`; refunds `−$` `#8A4B00`.
- **Payroll**: default-rate note in header sub; per-sitter cards (rate chip 70% CUSTOM amber /
  50% DEFAULT gray, unpaid Sora 17/800, earnings-count sub) with pay flow: button ("Pay Maya
  $186.90") → confirm-in-place ("Settles all 11 unpaid earnings · Venmo") → PAID record banner.
  THE INVARIANT: the pay amount = the unpaid total shown, and the payout record + ledger DEBIT
  repeat it exactly. Legacy no-pay flag notice. Payout history rows.
- **Ledger**: balance in header (tabular), rows: credit/debit dot (`#2FA45E`/`#C08B2E`), label +
  date, `+$`/`−$` amount (`#1E7A43`/`#8A4B00`), "bal $X" under it — running `balanceAfter` must
  chain correctly row to row.
- **Member detail**: name + ON DUTY/OFF chip, 3 stat tiles, contact card + message button,
  background-check row (APPROVED green / PENDING amber), availability summary ("Set by the
  sitter"), pay card (rate + chip, live unpaid balance → payroll, owner-only notice), options
  (Change role · Set pay rate `OWNER ONLY` · Remove from team red) + soft-removal footnote.
- **Services & pricing**: offering cards with title + ACTIVE/INACTIVE chip, meta
  ("WALKING · from $28 · 30–60 min"), feature chips, toggle; expanded card shows package/add-on
  price list in a `#F0F4EF` inset; inactive cards `opacity:.6`.
- **Service editor** ("+ New" / "Edit packages & add-ons"): title input, category chips (7
  `ServiceCategory` values), BASE PRICE / DURATION tiles, feature chips (+ Add). Edit mode:
  Packages + Add-ons cards (name + sessions sub, tabular price, ACTIVE/INACTIVE chip, dashed
  "+ Add") and red "Deactivate this offering". New mode: draft notice (packages after creation).
  CTA "Save changes" / "Create offering".

## 9. Product rules the UI must show correctly

- **Access codes** (`Job.accessCode`): shown ONLY once a sitter is assigned, only to that sitter
  (and the customer who set it; owners/managers see it on job detail). Always annotate:
  "Visible to you only — you're the assigned sitter" / "Shared with {sitter} when she was
  assigned". Never on pet profiles — pet `homeAccessNotes` are non-secret; warn users not to put
  codes there.
- **Availability is 3-state per day** (§8.2). No row = unavailable, and the UI says so.
- **Sitter pay**: sitter earns `payRatePercent` (per-sitter override, e.g. 70%) else the
  business `defaultSitterPayPercent` (e.g. 50%) of the JOB price (fee excluded); tips are 100%
  the sitter's. Show the math ("$16.80 · 70% of $24"). Only owners edit rates.
- **Payout = sum of what it settles** — button amount ≡ unpaid total ≡ payout record ≡ ledger
  debit.
- **Tips**: one-time, only after `COMPLETED`. After tipping, the action becomes a confirmation
  ("$5.50 tip sent · tips are one-time").
- **Money format**: `$1,234.56` (two decimals in receipts/ledgers; whole dollars OK when
  browsing — "from $28"). Credits `+$` in `#1E7A43`; debits/negatives true minus `−$` in
  `#8A4B00`. Tabular numerals. Prices carry context ("$26 per walk", "+$10", "$104 pack + $10
  add-on").

## 10. Iconography

### 10.1 The paw family (exact markup — copy verbatim)

All paw marks are the SAME 5 shapes in a `0 0 24 24` viewBox:
`<ellipse cx="12" cy="16" rx="5.5" ry="4.5"/><circle cx="5.5" cy="7.5" r="2.3"/><circle cx="10.5" cy="4.5" r="2.6"/><circle cx="15.5" cy="4.5" r="2.6"/><circle cx="20" cy="7.5" r="2.3"/>`

- **Logo tile**: rounded square (`border-radius:11–19px`) in `#0F1D1B` with the paw filled
  `#F2F6F1` (invert on green: cream tile, dark paw). Tab-bar "Pets" icon uses a compact paw.
- **Paw-back button** (every back affordance; bare — NO circle, NO background):
  `<div onClick={back} style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer"><svg width="36" height="36" viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5.5" ry="4.5" fill="#0F1D1B"></ellipse><circle cx="5.5" cy="7.5" r="2.3" fill="#0F1D1B"></circle><circle cx="10.5" cy="4.5" r="2.6" fill="#0F1D1B"></circle><circle cx="15.5" cy="4.5" r="2.6" fill="#0F1D1B"></circle><circle cx="20" cy="7.5" r="2.3" fill="#0F1D1B"></circle><polyline points="13.6,13.7 11.2,16 13.6,18.3" fill="none" stroke="#F2F6F1" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></polyline></svg></div>`
  On green screens invert fills (paw `#F2F6F1`, chevron `#0F1D1B`).
- **Paw rating stamp** (replaces ★ EVERYWHERE): inline 13px before the numeral —
  `<svg width="13" height="13" viewBox="0 0 24 24" style="vertical-align:-1.5px">` + the 5 shapes
  filled `#C08B2E` — then ` 4.9`. Rating INPUT = five 36px tappable stamps, `fill:currentColor`,
  color `#C08B2E` up to the selection and `rgba(15,29,27,.15)` beyond. Never use ★ glyphs.

### 10.2 Line icons

`stroke:currentColor;stroke-width:1.8`, round caps/joins; 22px tab bars, 18px list rows, 13–14px
chevrons (right `points="6,3 11,8 6,13"`). Simple geometry only (house, calendar, chat rect+tail,
clock, person, envelope, bars chart). No icon fonts, no duotone sets, no emoji in UI chrome.
Emoji allowed ONLY inside user-generated content (chat messages, sitter notes): 🐾 🐶 💚 🌳 📸.

## 11. Motion

`transition:.15s` on toggle knobs/tracks; the bottom sheet's slide/fade (§6) is the only larger
animation; everything else is instant re-render. No page transitions, parallax, or springs.

## 12. Copy voice

- Short, warm, concrete: "Who's caring for Biscuit today?", "Say thanks to Maya".
- Middot `·` separates meta ("30 min · Alex R. · Ballard").
- The system explains itself in-line (11–12px muted or amber notice): why a code is visible,
  when a charge happens, that unset days are unavailable, that tips are one-time.
- Names: people as First + initial ("Maya R."); pets by name everywhere.

## 13. Seed data (keep the demo coherent)

Business "Willow & Bark Pet Care" (Ballard, Seattle · paw 4.9 · 212 reviews · Verified · flat fee
$6.00 · default sitter pay 50%). Team: Maya R. (`EMPLOYEE`, 70% custom rate), Devon L., Jordan P.,
Sasha K. (all `EMPLOYEE`, 50% default; Sasha's background check PENDING); owner Dana W. (`OWNER`).
Customer Alex Rivera (`role: null`) with pets Biscuit (Golden Retriever, 3 yrs, 64 lb, chicken
allergy, Apoquel 16 mg), Miso (cat, 5 yrs), Kiwi (parakeet). Services: Dog Walking $28 single /
$104 4-pack / $150 6-pack, add-ons +$10 second dog, +$12 60-min; Drop-ins from $24; Boarding from
$52/night; Doggy Day Care $38/day (inactive); Dog Training $45/session (inactive). Access codes:
lockbox 4821 (Alex's home), door 7733 (Priya's). Finance: balance $412.80, owed $281.40 (Maya
$186.90 · Devon $94.50), $131.40 after payroll, 2 legacy jobs missing pay. Data model mirrors
`AI_MANIFEST.md` (JobStatus, EmployeeEarning, LedgerEntry, BackgroundCheckStatus, PetMood…);
values follow `TEST_DATA_AND_RESPONSES.md` patterns — never Lorem Ipsum.

## 14. Don'ts

- No `#123524` anywhere; no pure `#000`/`#fff` text; no neutral gray borders.
- No blue links, browser-default form controls, gradients (except the striped placeholder), or
  glassmorphism.
- No ★ glyphs — ratings always use the paw stamp (§10.1).
- No circles/backgrounds behind the paw-back mark.
- No left-border accent cards except schedule timeline blocks and availability rows (4px,
  semantic color).
- No modals — confirm in place (§6); the bottom sheet is only for secondary feeds.
- No status colors invented per screen — only §3.
- Hit targets ≥ 44px on rows/buttons where possible (36px floor).

## 15. Self-check before shipping a screen

1. Only palette colors; borders/shadows are `rgba(15,29,27,α)`.
2. Sora for headings/stats, Manrope for everything else; money is tabular.
3. Cards 18px radius, hairline `.08`, gaps 12–16.
4. Status badges match §3 exactly; timelines use the §3 dot recipe.
5. Back = bare 36px paw; ratings = paw stamps; logo = paw tile.
6. Money math visible (fee split, % rate, payout ≡ unpaid, running balance chains).
7. Access code visibility annotated; availability shows three distinct states.
8. Placeholders are striped + monospace label — no stock art, no drawn SVG scenes.
