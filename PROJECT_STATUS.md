# ZAYNA - Project Status

*Single source of truth for resuming work. Update at the end of every session.*
*Last updated: 2026-11-14 (Session 2 - recovery audit + email/notifications + password recovery). Branch: `chore/recover-and-stabilize`.*

**Evidence labels used below**
- **VERIFIED** = I executed or directly inspected it in this session.
- **UNVERIFIED** = written/claimed but not compiled or run (see "Environment limits").
- **CLAIMED** = stated in docs/commits/roadmap only; not independently confirmed.

---

## 1. Environment limits of the last session (read first)

| Capability | Result |
|---|---|
| `git clone` of the repo | Works (repo is **public**) |
| .NET 8 SDK | Installed via apt (8.0.134) |
| `dotnet restore` / build / test | **Impossible here**: `api.nuget.org` is blocked by the sandbox (NU1301). **No backend build or test was run.** |
| `npm install` + `vite build` | **VERIFIED**: exit code 0 (after conflict fixes too) |
| SQL Server / Docker | Not available. No migration, DB or runtime test was executed. |

**User-reported (CLAIMED):** after the recovery commit `fe13d30`, the owner ran `dotnet build` locally: success, 10 warnings. `dotnet test` results were not reported. That build predates the email/notification work below, which is **not yet compiled by anyone**. A Roslyn *syntax-only* pass (no NuGet references) found 0 syntax errors in the changed files; it cannot catch type/signature mismatches.

Consequence: backend changes made after `fe13d30` are **UNVERIFIED by a compiler**. Run `dotnet build` and `dotnet test` locally before trusting it (commands in section 7).

## 2. Repository state

- `main` = `e507d8f` ("production readiness"). It is **behind** `chore/stage0-stabilize` by 3 commits.
- **Unmerged work**: `chore/stage0-stabilize` (`7f9b938` Stage 0 stabilization + roadmap, `37cb180` salon list, `cb95f8c` gitignore). All other remote branches (`feature/mvp-google-auth`, `fix/*`, `test/backend-otp-tests`) have **0 commits ahead of main** (already merged; safe to delete).
- This session's work is on `chore/recover-and-stabilize`, cut from `chore/stage0-stabilize`. **Not pushed** (no credentials). Merge order: this branch -> main.
- 83 commits total. Authors: `saleh313k` (manual) and earlier Claude sessions.

## 3. Architecture (VERIFIED by inspection)

- Backend: .NET 8 solution, 5 projects: `ZAYNA.API` (controllers, startup, EF migrations), `ZAYNA.Core` (entities, DTOs, interfaces), `ZAYNA.Infrastructure` (EF context, services), `ZAYNA.Application` (nearly empty), `ZAYNA.Tests` (xUnit + Moq).
- Frontend: React 18 + Vite 5 + Tailwind 3, react-router, i18next (EN/AR), axios, `@react-oauth/google`.
- DB: SQL Server via EF Core 8; migrations in `ZAYNA.API/Migrations`; `DbInitializer` applies them (dev) and seeds demo salon + 2 stylists (dev only). Production: `Database:AutoMigrate=false`, use `dotnet ZAYNA.API.dll --pending|--migrate`.
- Auth: Google ID token + email/password; JWT with per-request "user still active" check; admin bootstrapped from `Admin:Email`.
- Infra: Docker compose (dev + prod), Caddy, backup/restore/deploy scripts, GitHub Actions CI (`.github/workflows/ci.yml`: dotnet restore/build/test, npm build, docker builds). **CLAIMED**: never run on a server.

## 4. Feature status (verified against code, not docs)

| Feature | Status | Evidence |
|---|---|---|
| Google sign-in, email register/login, salon registration wizard | Implemented | `AuthController`, `EmailAuthForm`, `WizardRegistration`; frontend calls match backend routes |
| Admin: dashboard, users, bookings, salon approvals | Implemented (real API) | `AdminController` 6 endpoints; admin components call `adminService` |
| Admin: **Reports** | **Stub** | `Reports.jsx` is a static list of 6 report buttons, no data/API |
| Admin: **Settings** | **Placeholder** | `/admin/settings` renders `ComingSoon` |
| Booking journey (catalog, slots, atomic booking, cancel) | Implemented in code | `CatalogController`, `BookingService`, `BookingFlow.jsx`; **double-booking DB backstop was missing - see 5.1** |
| Salon-owner area (dashboard, appointments, services, stylists, branches/hours, settings) | Implemented | `OwnerController` (13 endpoints) + `components/salon/*` |
| Public salon pages (`/salons/:city/:slug`) | Implemented (basic) | `SalonDetail.jsx`, `PublicSalonsController` |
| **Claim salon** (`/claim/:salonId`) | **Stub** | `ClaimSalon.jsx`: all API logic commented out; no backend endpoint |
| Reviews | Backend only | `ReviewController` exists; UI never calls it (`POST /api/review`, reads unused) |
| Loyalty points | Partial | Points awarded on completion; no UI, no redemption |
| Email notifications (SMTP) | **Implemented, UNVERIFIED** | `SmtpEmailService` (MailKit), bilingual EN/AR `EmailTemplates`, confirmation + cancellation + reminder emails via `NotificationService`. Needs real SMTP settings and a first end-to-end test. |
| Booking reminders | **Implemented, UNVERIFIED** | `NotificationScheduler` rewritten (salon-local time, 5-min cycle, dedupe via saved Notification, no busy-loop) and now registered in `Program.cs`. Pure timing rule in `ReminderPolicy`. |
| Password recovery (forgot / reset / change) | **Implemented; token logic executed, rest UNVERIFIED** | Stateless signed token (no new table): `PasswordResetTokens`, `PasswordService`; `POST /api/auth/{forgot-password,reset-password,change-password}`; pages `/forgot-password`, `/reset-password`, `/account/password` (customers; linked from Profile). Link on the login form. |
| SMS (Twilio) | Dormant | Keys are placeholders; code path skips quietly. Optional/last per roadmap. |
| Online payments (Thawani) | **Not implemented** | 3 methods in `ThawaniPaymentService` throw `NotImplementedException`; `Payments:OnlineEnabled=false` |
| Phone/OTP login | Legacy, unused by UI | Endpoints exist; frontend does not call them |
| Customer profile page | **Real data now (UNVERIFIED backend)** | New `CustomerController`: `GET /api/customer/me` (name, email, phone, member-since, loyalty balance, booking counts, favourite salon) and `PUT /api/customer/me` (display name only; email/phone are sign-in identifiers and need verification before they can be editable). `Profile.jsx` rewritten to use it; the invented rewards/stats, inert Redeem button and fake notification toggles were removed. |

## 5. Bugs and technical issues

### 5.1 FIXED this session (UNVERIFIED unless stated)
1. **Schema drift - double-booking backstop missing (HIGH).** The booking-journey commit changed `ApplicationDbContext` (unique filtered index on `StylistId, BookingDate, StartTime WHERE Status<>4`, unique `BookingNumber`, `decimal(18,3)` money, `TotalAmount` ignored) with **no migration**. Added hand-written migration `20261114000000_BookingModelSync` + updated snapshot + Designer. **Must verify**: `dotnet ef migrations add Check` should yield an empty migration (then `migrations remove`). Check for duplicate live slots before applying to existing data (query is in the migration's header comment). Also narrows `BookingNumber` to `nvarchar(450)` (SQL Server cannot index `nvarchar(max)`).
2. **16 files with unresolved merge markers (VERIFIED fixed).** Every file was one whole-file block whose two sides were byte-identical (a botched merge that duplicated content). Resolved by keeping one side plus any shared prefix/suffix. Files: `Readme.md`, `FILE_STRUCTURE.md`, `database/schema.sql`, `database/seed-data.sql`, `setup.ps1`, `project structure`, `frontend/.eslintrc.{cjs,json}`, `.prettierrc`, `public/{manifest.json,robots.txt}`, `ErrorBoundary.jsx`, `Modal.jsx`, `Pagination.jsx`, `hooks/useLocalStorage.js`, `docs/archive/...OLD-with-merge-conflict.md`. JSON/CJS/JSX parse OK; `vite build` exit 0. Note: the four JS/JSX files are **not imported anywhere** (dead code), and `ErrorBoundary` is not mounted.
3. **Unthrottled legacy auth endpoints (MEDIUM).** `send-otp` (anonymous, sends paid SMS = SMS-pumping/cost abuse), `verify-otp`, `register`, `login` now carry `[EnableRateLimiting("auth")]` (10/min/IP). Trivial attribute; **UNVERIFIED compile**.

4. **Email & reminders (ROADMAP S1, part 1) - UNVERIFIED.** New: `SmtpEmailService`, `NoopEmailService` (used when no provider is configured), `EmailTemplates`, `ReminderPolicy`; rewritten `NotificationService` (adds `BookingId` to notifications, email for confirm/cancel/remind, all channels best-effort) and `NotificationScheduler`. `BookingController` now sends the cancellation notice on both cancel paths (`/cancel` and `/status` -> Cancelled); previously nothing called `SendBookingCancellationAsync`. Fixed old scheduler bugs: enum-vs-string query (would fail at runtime) and the catch block that skipped the delay (busy loop). Added `MailKit 4.8.0`. Provider selection in `Program.cs`: `Email:Provider=SendGrid` -> SendGrid; else SMTP if `Smtp:Host` set; else no-op. Config keys: `Smtp:*`, `Notifications:RemindersEnabled`, `Notifications:ReminderLeadMinutes` (default 120); mirrored in `docker-compose.prod.yml` and `.env.production.example` (`SMTP_*`). 11 new unit tests in `ZAYNA.Tests/NotificationTests.cs` (not run). Known limits: single API instance only; failed reminder emails are not retried; salon owners are not emailed yet.
6. **Password recovery (ROADMAP S1, part 2).** Design: token = `userId.expiry.HMAC-SHA256(derivedKey, userId|expiry|CURRENT passwordHash)`; unforgeable, expires (`Auth:ResetTokenMinutes`, default 60, clamp 10-1440), and **single-use** because a password change alters the hash. Key is derived (domain-separated) from `JwtSettings:SecretKey` - **rotating the JWT secret invalidates outstanding reset links** (harmless). Link is `{App:PublicUrl or first Cors origin}/reset-password#token=...` (URL *fragment*: never sent to servers/Referer; the page strips it from the address bar). Anti-enumeration: `forgot-password` always returns the same 200 message; the email is sent on a background task so timing does not leak; max 3 requests/hour/email. Google-only and Admin accounts get a "you use Google sign-in" email instead of a link and cannot reset/change a password. A reset clears the sign-in lockout; reset/change send a "password changed" email. Change-password verifies the current password (5 failures -> 15 min lock). All three endpoints are `[EnableRateLimiting("auth")]`. In Development the reset link is written to the API log (so you can test without SMTP). **Executed here:** a standalone harness compiled the real `PasswordResetTokens.cs` and ran 20 checks (expiry, single-use, wrong key, tampering, malformed/oversized input, URL-safe format): all passed. **Not executed:** the xunit tests (`PasswordResetTokenTests.cs`), `PasswordService`, controllers, templates (no NuGet). Frontend `vite build` exit 0 and EN/AR i18n key parity verified. Known limits: existing JWTs stay valid up to their lifetime after a password change (no token revocation / security stamp); change-password page is customer-only (salon owners have no account page yet); email *verification* is not done.
5. `saleh.bak` removed from the working tree at the owner's request. **It remains in git history** of the public repo (history rewrite not done).

### 5.2 OPEN - security (do these first)
1. **JWT signing key is committed** (owner will replace it before production - still required; must also be removed from the file)  in `backend/ZAYNA.API/appsettings.json` (44-char value, looks real) in a **public** repo. Anyone can forge tokens (including Admin) against any deployment using it. **Action: rotate it everywhere, load from env/secret store, replace the file value with a placeholder.** Startup validation does not reject it. The key remains in git history; rotation is the only real fix.
2. **`saleh.bak`** (5.2 MB SQL Server backup, possibly scraped `PublicSalons` data - see ROADMAP S10) was deleted from the tree but is **still downloadable from git history**. If the contents are sensitive or legally risky, rewrite history (git filter-repo) and force-push.
3. Google OAuth client id in `appsettings.json` is public by design (fine).
4. Twilio/SendGrid/Thawani values are placeholders (checked by pattern, values not printed).

### 5.3 OPEN - correctness / quality
- `NotificationScheduler` unregistered and timezone-buggy (also in ROADMAP S0/S1).
- No integration tests against SQL Server; concurrency/unique-booking behavior untested. Tests present: 18 (`BookingRulesTests` 11 Fact + 2 Theory, `OtpServiceTests` 5 Fact) - **never run by me**.
- 3 duplicate repository implementations (`Data/GenericRepository.cs`, `Data/Repositories/Repository.cs`, `Repositories/Repository.cs`); two contain `NotImplementedException` members. Only `GenericRepository<>` is registered.
- `ZAYNA.Infrastructure.csproj` references `Microsoft.Extensions.*` **10.0.1** on a `net8.0` target (version mismatch risk).
- `frontend/package.json` lists `"node": "^20.0.0"` as a runtime dependency (almost certainly accidental).
- Duplicate `Footer.jsx` / `Footer.tsx`; `vite-env.d.ts` with no TypeScript; `components/common/Layout`, `pages/Dashboard.jsx` usage not audited.
- Two committed patch files in repo root (`zayna-admin-panel.patch`, `zayna-booking-journey.patch`, ~236 KB) - leftover artifacts.
- i18n: EN 476 keys vs AR 477; `home.footerColumns` is a string in EN but an object in AR (and `home.dir` missing in AR) - possible footer rendering bug.
- `.env.example` omits `VITE_EMAILJS_*` and `VITE_WHATSAPP_NUMBER`, which the code reads.
- Bundle is 925 KB (single chunk); no code splitting.
- ~~Customer `Profile.jsx` showed invented data~~ **Fixed (see 4)**. It had hard-coded loyalty points, fake rewards/stats, an inert Redeem button, fake notification toggles and a Save that never called an API. `CustomerController.cs` was a 0-byte file. Still open on this page: loyalty *redemption* does not exist (backend has `CanRedeem/Deduct` but no endpoint/UI/reward catalogue); no per-user notification preferences.
- **Fixed: `LoyaltyService.GetCustomerPointsAsync` returned the number of history rows (always 0, collection not loaded) instead of `LoyaltyPointsBalance`.** 5 new unit tests (`LoyaltyServiceTests.cs`, not run).
- Loyalty points are awarded (10) every time a booking is set to Completed; whether the status policy blocks Completed->Completed was not verified - check for double-award.
- **ESLint is not usable**: `.eslintrc.cjs` and `.eslintrc.json` both exist, but there is no `lint` script and no `eslint` dependency in `package.json`. Add a flat `eslint.config.js` + devDependencies if linting is wanted.
- `salonService.js:43` calls `/booking/salon/${id}/` with trailing slash (works in ASP.NET, cosmetic).
- 21 backend routes are not called by the frontend (OTP auth, reviews, branch/nearby, publicsalons search, salon branch/stylist POST/PUT, service CRUD). Some are superseded by `/api/owner/*`; candidates for removal/auditing (attack surface).

### 5.4 Docs vs implementation
| Docs say | Reality |
|---|---|
| Payments via **Stripe** (README) | Code is **Thawani** (and not implemented) |
| **OTP/SMS** is the primary auth (README, demo credentials table) | Primary auth is Google + email/password; OTP is legacy/unused |
| SMS+email **reminders 2h before** | Scheduler not registered; not working |
| Set up DB with `sqlcmd ... Database/schema.sql` + `seed-data.sql` | App uses **EF migrations**; `schema.sql` is a stale hand-written 13-table script (EF model has 17 tables) and the path is `database/` (lowercase) |
| "A complete ... booking system" | MVP incomplete: see section 4 |
| `docs/ROADMAP.md`: backend compiles (0 errors/58 warnings) | **CLAIMED** (user-confirmed, before Stage 0 edits); not re-verified |

README, `FILE_STRUCTURE.md`, `project structure` and `database/*.sql` are now free of conflict markers but their **content is still outdated** and needs a rewrite (see next steps).

## 6. Remaining MVP work (priority order)

0. **Gate: run backend build + tests locally** and fix anything my unverified edits broke.
1. Security: rotate JWT secret; decide on `saleh.bak`.
2. Verify migration `BookingModelSync` (empty-diff check + apply on a copy of real data).
3. **Local end-to-end smoke test** (register salon -> admin approves -> set hours/services/stylist -> customer books -> owner completes). Never done; fix findings.
4. SQL Server integration tests (Testcontainers) for slot concurrency / unique booking numbers / cancel frees slot (ROADMAP S0).
5. **Verify email**: set `Smtp__*`, create a booking, cancel it, check both emails (and spam folder; configure SPF/DKIM for the From domain). Then test reminders (set `Notifications:ReminderLeadMinutes` high and book a slot a few hours out).
5b. **Verify password recovery**: request a reset from `/forgot-password` (Development: copy the link from the API log; production: from the email), set a new password, confirm the old link no longer works, sign in. Then rest of ROADMAP S1: **email verification** (affects login gating; needs a design decision and probably a migration), in-app notification bell UI (backend `GetUserNotificationsAsync` exists; no controller/UI yet), welcome email, salon-approved/rejected emails, email the salon owner on new bookings.
6. Replace stubs: admin Reports (real queries + CSV), admin Settings, or hide their routes/menu entries until built. Decide Claim-salon fate (ROADMAP S10 legal question first).
7. Reviews UI + loyalty UI (ROADMAP S3).
8. Payments (Thawani) - only after merchant sandbox keys exist.
9. Clean-up: remove dead repos/files/patch files, fix csproj version mismatch, rewrite README/FILE_STRUCTURE/schema docs to match reality, delete merged remote branches.

## 7. How to resume

```bash
git fetch --all
git checkout chore/recover-and-stabilize
# Backend (not run by the last session!)
cd backend && dotnet restore ZAYNA.sln && dotnet build ZAYNA.sln -c Release && dotnet test ZAYNA.sln
dotnet ef migrations add Check --project ZAYNA.API   # must be EMPTY; then: dotnet ef migrations remove --project ZAYNA.API
# Frontend (verified working)
cd ../frontend && npm install && npm run build
```
Required config to start the API: `ConnectionStrings:DefaultConnection`, `JwtSettings:*` (new secret, >= 32 chars), `GoogleSettings:ClientId`, `Cors:AllowedOrigins`, optional `Admin:Email`.

If sharing build output with a new session: paste `dotnet build` errors/warnings and `dotnet test` summary so work can proceed against compiler-verified state.

## 8. Session log

| Date | Session | Summary |
|---|---|---|
| 2026-11-14 | 2d (profile) | Replaced the fake customer Profile with real data (new `CustomerController`, `AuthContext.updateUser`), fixed loyalty balance bug, 5 tests. `vite build` exit 0; i18n parity verified; Roslyn syntax-only check clean for new C#. Backend still not compiled by anyone after `fe13d30`. |
| 2026-11-14 | 2c (password recovery) | Forgot/reset/change password end to end (stateless token, no migration), EN/AR UI, 13 xunit tests written. Token logic executed via standalone harness (20/20 pass); `vite build` exit 0. Found: fake data on Profile page, unusable ESLint setup. Backend still not compiled by anyone after `fe13d30`. |
| 2026-11-14 | 2b (email) | Owner: build OK (10 warnings), will rotate JWT, `.bak` deletion approved, SMTP chosen. Added SMTP email + bilingual templates, rewrote/registered reminder scheduler, cancellation notices, config + tests. Roslyn syntax-only check clean; not compiled. |
| 2026-11-14 | 2 (recovery) | Full audit. Resolved 16 conflict-marker files (verified), rate-limited 4 legacy auth endpoints, added missing EF migration (unverified), created this file. Frontend build verified; backend could not be built (no NuGet access). Nothing pushed. |
