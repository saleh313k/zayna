# ZAYNA - Project Status

*Single source of truth for resuming work. Update at the end of every session.*
*Last updated: 2026-11-14 (Session 2 - recovery audit). Branch: `chore/recover-and-stabilize`.*

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

Consequence: every backend change in this session is **UNVERIFIED by a compiler**. Run `dotnet build` and `dotnet test` locally before trusting it (commands in section 7).

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
| SMS / email notifications | **Not functional** | `NotificationScheduler` is never registered in `Program.cs`; compares UTC with local times. Twilio/SendGrid keys are placeholders. |
| Online payments (Thawani) | **Not implemented** | 3 methods in `ThawaniPaymentService` throw `NotImplementedException`; `Payments:OnlineEnabled=false` |
| Phone/OTP login | Legacy, unused by UI | Endpoints exist; frontend does not call them |
| Customer profile page | Not audited in depth | `Profile.jsx` exists and is routed |

## 5. Bugs and technical issues

### 5.1 FIXED this session (UNVERIFIED unless stated)
1. **Schema drift - double-booking backstop missing (HIGH).** The booking-journey commit changed `ApplicationDbContext` (unique filtered index on `StylistId, BookingDate, StartTime WHERE Status<>4`, unique `BookingNumber`, `decimal(18,3)` money, `TotalAmount` ignored) with **no migration**. Added hand-written migration `20261114000000_BookingModelSync` + updated snapshot + Designer. **Must verify**: `dotnet ef migrations add Check` should yield an empty migration (then `migrations remove`). Check for duplicate live slots before applying to existing data (query is in the migration's header comment). Also narrows `BookingNumber` to `nvarchar(450)` (SQL Server cannot index `nvarchar(max)`).
2. **16 files with unresolved merge markers (VERIFIED fixed).** Every file was one whole-file block whose two sides were byte-identical (a botched merge that duplicated content). Resolved by keeping one side plus any shared prefix/suffix. Files: `Readme.md`, `FILE_STRUCTURE.md`, `database/schema.sql`, `database/seed-data.sql`, `setup.ps1`, `project structure`, `frontend/.eslintrc.{cjs,json}`, `.prettierrc`, `public/{manifest.json,robots.txt}`, `ErrorBoundary.jsx`, `Modal.jsx`, `Pagination.jsx`, `hooks/useLocalStorage.js`, `docs/archive/...OLD-with-merge-conflict.md`. JSON/CJS/JSX parse OK; `vite build` exit 0. Note: the four JS/JSX files are **not imported anywhere** (dead code), and `ErrorBoundary` is not mounted.
3. **Unthrottled legacy auth endpoints (MEDIUM).** `send-otp` (anonymous, sends paid SMS = SMS-pumping/cost abuse), `verify-otp`, `register`, `login` now carry `[EnableRateLimiting("auth")]` (10/min/IP). Trivial attribute; **UNVERIFIED compile**.

### 5.2 OPEN - security (do these first)
1. **JWT signing key is committed** in `backend/ZAYNA.API/appsettings.json` (44-char value, looks real) in a **public** repo. Anyone can forge tokens (including Admin) against any deployment using it. **Action: rotate it everywhere, load from env/secret store, replace the file value with a placeholder.** Startup validation does not reject it. The key remains in git history; rotation is the only real fix.
2. **`frontend/src/components/claim/db/saleh.bak`** (5.2 MB SQL Server backup) is tracked in a public repo. Unknown contents (possibly the scraped `PublicSalons` data, which `ROADMAP` S10 flags as legally uncertain). Not deleted by me (may be the only copy). **Decision needed**: back it up elsewhere, then remove it and consider history rewrite.
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
5. Notifications MVP (ROADMAP S1): register + rewrite scheduler (salon-local time), email confirmations, password reset / email verification. **Needs your email-provider decision.**
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
| 2026-11-14 | 2 (recovery) | Full audit. Resolved 16 conflict-marker files (verified), rate-limited 4 legacy auth endpoints, added missing EF migration (unverified), created this file. Frontend build verified; backend could not be built (no NuGet access). Nothing pushed. |
