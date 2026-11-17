# ZAYNA

A bilingual (English / Arabic, RTL-aware) appointment-booking platform for salons in Oman. Customers find a salon, pick a
service, stylist and time, and book; salon owners manage services, stylists, working hours and appointments; an
administrator approves salons.

> **Status: MVP under active development - not yet verified for production.**
> The honest, current state (what works, what is unverified, what is missing, and the production checklist) lives in
> [`PROJECT_STATUS.md`](PROJECT_STATUS.md). Read it before deploying anything.

## What works today

| Area | Notes |
|---|---|
| Sign-in | Google, or email + password. Password recovery by email link (forgot / reset / change). |
| Customers | Browse salons, book (services, stylist, free slots), cancel, booking history, real profile (loyalty balance, booking stats). |
| Booking integrity | Slots are checked and saved atomically; a unique database index also prevents two live bookings for the same stylist and time. |
| Reviews | Only for the customer's own completed booking (one per booking). Public average, star breakdown, "verified visit" badge and reviewer tier. |
| Loyalty points | 10 points per completed appointment (shown on the profile). There is no redemption yet. |
| Salon owners | Register a salon (admin approval), manage services, stylists, branches, working hours, appointments. |
| Admin | Dashboard, users, bookings, salon approvals. |
| Email | Booking confirmation, cancellation and reminder emails (English + Arabic in one message) over SMTP. |

**Not built yet:** online payments (pay at the salon; the Thawani integration is a stub), SMS, email verification,
loyalty redemption, review moderation, admin Reports and Settings pages, "claim your salon". See `PROJECT_STATUS.md`.

## Tech stack

- **Backend:** .NET 8, ASP.NET Core Web API, Entity Framework Core 8, SQL Server, JWT auth, BCrypt, MailKit (SMTP).
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, react-router, i18next (EN/AR), axios.
- **Ops:** Docker Compose (dev and production), Caddy (HTTPS), GitHub Actions CI.

## Repository layout

See [`FILE_STRUCTURE.md`](FILE_STRUCTURE.md) (generated from the real file list). In short: `backend/` (solution with API, Core,
Infrastructure, Application, Tests), `frontend/`, `database/` (legacy reference scripts - the app uses EF migrations),
`deploy/` (production Docker/Caddy/scripts), `docs/`.

## Run it locally

### Option A - Docker (SQL Server + API + web)

Requires Docker with the Compose plugin.

```bash
cp .env.example .env
# edit .env: DB_PASSWORD, JWT_SECRET_KEY (>= 32 random characters), GOOGLE_CLIENT_ID, ADMIN_EMAIL
docker compose up --build
```

Web: <http://localhost:3000> - API: <http://localhost:5000> (Swagger UI is available in Development).
In Development the API applies database migrations and seeds a demo salon on start.

### Option B - without Docker (Windows, SQL Server/LocalDB)

```bash
# API  (https://localhost:7001 / http://localhost:5000)
cd backend
dotnet run --project ZAYNA.API

# Web  (http://localhost:3000)
cd frontend
cp .env.example .env     # set VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

`appsettings.Development.json` uses `Server=localhost;Database=ZaynaDB;Trusted_Connection=True` and ships a
**development-only** JWT key. The API refuses that key (and the old leaked one) outside Development, so every real
deployment must set its own secret.

### Google sign-in

Create a Google OAuth "Web application" client id, add your frontend origin (for example `http://localhost:3000`) under
*Authorised JavaScript origins*, and set `GOOGLE_CLIENT_ID` (API and frontend use the same public id). The address in
`ADMIN_EMAIL` becomes the administrator when it signs in with Google.

## Configuration (environment variables / `appsettings`)

| Setting | Purpose |
|---|---|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `JwtSettings__SecretKey` (`JWT_SECRET_KEY`) | **Required.** >= 32 random characters. Never commit it. |
| `GoogleSettings__ClientId` | Google OAuth client id |
| `Cors__AllowedOrigins` | Comma-separated frontend origins |
| `Admin__Email` | Platform administrator's email |
| `Smtp__Host/Port/Security/Username/Password/FromEmail/FromName` | Outgoing email. Empty host = email disabled (bookings still work) |
| `App__PublicUrl` | Public site URL used in email links (defaults to the first CORS origin) |
| `Notifications__RemindersEnabled`, `Notifications__ReminderLeadMinutes` | Appointment reminders (default 120 minutes before) |
| `Database__AutoMigrate` | On in Development, **off in Production** (use `--pending` / `--migrate`, see the runbook) |

Production variables are listed in `.env.production.example`.

## Database

Schema changes are **EF Core migrations** (`backend/ZAYNA.API/Migrations`), applied automatically in Development and
explicitly in production (see `docs/DEPLOYMENT.md`). The scripts in `database/` are a stale hand-written reference and are
not part of the migration path.

```bash
cd backend
dotnet ef migrations add <Name> --project ZAYNA.API
dotnet ef database update --project ZAYNA.API
```

## Tests and CI

```bash
cd backend && dotnet test          # xUnit
cd frontend && npm run build       # there is no frontend test or lint script yet
```

GitHub Actions (`.github/workflows/ci.yml`) restores, builds and tests the backend, builds the frontend, validates the
production compose file and builds both Docker images.

## Deployment

Follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (server, DNS, `.env`, first deployment, verification, backups and restore).
Health endpoints: `/health/live` (process) and `/health/ready` (process + database).

## Other documentation

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) - verified state, open issues, production checklist, how to resume work
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - planned stages
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/TESTING_DEPLOYMENT.md`](docs/TESTING_DEPLOYMENT.md) - not re-audited; may lag the code
