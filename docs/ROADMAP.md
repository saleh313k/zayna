# ZAYNA - Roadmap to launch (all features)

*Living document. Add new ideas to the "Parking lot" at the bottom; I will slot them into a stage.*
*Scope decision (owner): **everything on the backlog is required for the first launch.** Sizes below are relative; one "stage" is about the size of the booking journey or the salon-owner area already delivered.*

## 0. Where we are

| Area | State |
|---|---|
| Sign-up / sign-in (Google, email + password), registration wizard, roles | Built |
| Admin panel (dashboard, users, bookings, salon approvals) | Built |
| Booking journey (catalog, slots, atomic booking, cancel) | Built |
| Salon-owner area (dashboard, appointments, services, stylists, branches/hours, profile) | Built |
| Production Docker stack, backups, runbook, CI | Prepared, never run on a server |
| **Backend compiles** (0 errors, 58 warnings) | **Confirmed by you** |
| Local end-to-end smoke test (register salon -> approve -> book -> complete) | **Not yet done - first gate** |

Rule for every stage below: a feature is "done" only when it builds, has automated tests, **and you have used it end to end**. Nothing is called complete before that.

## 1. How the stages are ordered

Foundations first (things many features need), then what customers see, then power features, then money, then polish and launch.

```
S0 Stabilize ──> S1 Messaging ──> S2 Media + public salon page ──> S3 Reviews + loyalty ──> S4 Discovery
                                                                                              │
S12 Launch <── S11 Content/legal <── S10 Directory + claim <── S9 Payments <── S8 Admin <── S7 Owner tools <── S6 Staff accounts <── S5 Booking power
```

## 2. Stages

### S0 - Stabilize (in progress)
**Done in the repository (needs your `dotnet build` / `dotnet test` to confirm):**
* **AutoMapper removed.** It had a high-severity DoS vulnerability (CVE-2026-32933); the patched releases (15.1.1 / 16.1.1) are commercially licensed and the 13/14 lines will not be fixed. It was registered but never used, so it was simply deleted.
* Removed dead code: .NET template `WeatherForecast` (model + public endpoint), unused `Startup.cs`, `Class1.cs`, and three unused duplicate DTO files in `ZAYNA.Application` (38 of the 58 warnings).
* Fixed real defects found by the build: `ReviewController` crashed (500) when the user-id claim was missing (now 401); null-safety in `BranchController`, `BookingService`, `AdminController`; payment result type now says a failed payment has no transaction id / URL.
* `BookingMapper.cs` moved from `Migrations/` to its proper `Mapping/` folder (it only compiled because the namespace was right).
* Regression tests (no database needed, run in CI): booking status transitions incl. time gating, booking policy defaults/overrides/clamping, salon clock (Oman UTC+4 with safe fallback), `AppException` status codes.

**Still open in S0:**
* **Your local smoke test** (register salon -> set up -> approve -> book -> complete) and fixing what it finds.
* Integration tests against a real SQL Server in CI (Testcontainers): two simultaneous requests for one slot, unique booking numbers, cancel frees the slot.
* `NotificationScheduler` exists but is **not registered** in `Program.cs` (so reminders never run) and compares UTC with local salon times. It is rebuilt in S1, not enabled as-is.
* Remaining nullable warnings in old DTOs/migration names are cosmetic; clean up opportunistically.

### S1 - Messaging and account recovery (needs: email provider)
* Email sender abstraction (swap providers without code changes) + English/Arabic templates.
* Emails: booking confirmed / cancelled / reminder (background job), salon approved / rejected (with reason), welcome.
* **Email verification** for password sign-ups, **forgot / reset password**, change password.
* In-app notification centre (bell, unread count) using the existing notification records.
* SMS: optional and last (cost); the code path stays dormant until a provider is configured.
* Done when: real emails arrive from the test server, links expire and are single-use, and a reset works end to end.

### S2 - Images and the public salon page (needs: storage + map decisions)
* File storage abstraction (server disk volume now, cloud later); upload validation (type, size, image re-encoding), safe serving.
* Salon logo and gallery, stylist photos, service images (optional), managed from the owner area.
* **Public salon page** for registered salons: about, gallery, services and prices, opening hours, stylists, map with a "get directions" link, reviews placeholder, **Book now**.
* Salon location (latitude/longitude) picker for owners; map display with OpenStreetMap (free, no API key).
* Done when: an owner uploads photos and a customer sees a complete page on mobile and desktop, in English and Arabic.

### S3 - Reviews, ratings and loyalty (needs: rules approved)
* Reviews: only customers with a **completed** booking, one per booking, within a time window; star rating + text; average rating and count on cards and pages; owner can reply; customer can edit within a short window.
* Admin moderation: report, hide, delete; abuse limits.
* Loyalty: points balance and history screen; **redeem points as a discount at booking** (price recalculated server-side); admin-adjustable earn/redeem rates; points only for completed bookings (already so).
* Done when: a completed booking can be reviewed, the rating appears everywhere it should, and a booking can be paid partly with points.

### S4 - Discovery and the customer account
* Search and filters on registered salons: name, city, service/category, price range, minimum rating, sort.
* SEO-friendly salon URLs, sitemap and robots, page titles and descriptions, share preview.
* Favourites (heart), customer profile (name, phone, language, delete account), booking history filters.
* Done when: a visitor can find a salon by service and city in two clicks and mark favourites.

### S5 - Booking power features
* **Reschedule** a booking (customer and salon), keeping the slot rules.
* **"Any available stylist"** (server picks one).
* **Several services in one booking** (cart, total duration and price).
* Stylist **breaks, buffers between appointments, blocked time**, per-stylist working hours.
* **Per-salon policies** (cancellation window, auto-confirm vs manual confirm).
* **Walk-in / phone bookings** created by the salon, with an internal notes field.
* Done when: all of these are covered by tests, including concurrency on rescheduling.

### S6 - Staff accounts
* Invite a stylist by email; they sign in (Google or password) and see **their own** schedule, confirm / complete **their own** bookings, set their days off.
* Optional receptionist role with limited permissions.
* Done when: a stylist can work a full day from their own login and cannot see other staff's or other salons' data.

### S7 - Owner tools
* Calendar view (day / week) of bookings.
* Customer list with history and notes.
* Reports: revenue, bookings, busiest times, top services, per-stylist; **CSV export**.
* Done when: an owner can answer "how did we do this month?" without a spreadsheet.

### S8 - Admin completeness
* Reports and analytics page (real data, CSV export), platform **settings** page (global rules, rates).
* Salon detail view and edit, approve / reject **with reason** (emails the owner), user editing and role changes (Salon <-> Customer, staff), review moderation queue, **audit log** of admin actions.
* Disabling a salon owner also hides their salon.
* Done when: no admin screen shows mock data or "coming soon".

### S9 - Online payments (needs: payment provider account)
* Thawani (Oman) integration: create checkout, **webhook / return handling**, payment status on bookings, **automatic expiry of unpaid bookings**, refunds on cancellation per policy, receipts.
* Commission / platform fee model (decision needed), payout reporting (reporting only, no automatic payouts).
* Done when: a sandbox payment confirms a booking, a cancelled paid booking is refunded, and an abandoned payment frees the slot.

### S10 - Directory and "claim your salon"
* **Decision first:** the scraped directory (`PublicSalons`) is Google Maps data. Using it publicly may breach the source's terms and Omani data rules; decide whether to keep, replace with self-registered salons only, or license data.
* If kept: link a directory entry to a registered salon, claim flow (owner proves ownership, admin approves), merged listings.
* Done when: a claimed listing becomes a bookable salon without duplicates.

### S11 - Content, legal and compliance
* Terms of service, privacy policy, cookie notice, about, contact, FAQ, help (English + Arabic, reviewed by a lawyer / native speaker).
* Data rights: export and delete my data; consent records.
* Accessibility pass, full Arabic/RTL review on every screen.
* Done when: legal texts are approved by you and linked in the footer and at sign-up.

### S12 - Hardening and launch
* Security review, dependency scan clean, rate limits on all public endpoints, anti-bot on registration.
* Load test, database index review, error tracking and alerts.
* Deployment rehearsal on a throw-away server: HTTPS, backup, **restore drill**, update and rollback.
* Soft launch with 2-3 real salons you support personally; then open up.
* Done when: the rehearsal passes and the checklist in `docs/DEPLOYMENT.md` is fully ticked.

## 3. What I need from you (can start now, in parallel)

| By stage | Item | Default if you have no preference |
|---|---|---|
| S1 | **Email provider** account and a sending domain (SPF/DKIM DNS records) | Any SMTP-capable provider; I code against SMTP so you can switch later |
| S1 | SMS needed at launch? | No (email + in-app only) |
| S2 | Image storage | Server disk volume (included in backups) |
| S2 | Map provider | OpenStreetMap (free); Google Maps needs a billing account |
| S3 | Review rules | Completed booking only, one per booking, within 30 days |
| S3 | Loyalty rates | Earn 1 point per 1 OMR; redeem 100 points = 1 OMR (adjustable by admin) |
| S9 | **Thawani merchant account** and sandbox keys | Not started until you have them |
| S9 | Commission model | None at launch; reporting only |
| S10 | Fate of the scraped directory | Hidden from the public until a legal decision |
| S11 | Legal texts | You or a lawyer supplies them; I build the pages |
| S12 | Hosting, domain | Option A in `docs/DEPLOYMENT.md` |

## 4. Risks to watch
* **Nothing has run on a server yet.** Docker files, backups and HTTPS are unproven until the rehearsal.
* **Scope is large.** Realistically this is 12 more working sessions of the size already delivered; a smaller first launch is still possible if priorities change (the order above is the dependency order, not a promise of dates).
* **External accounts** (email, Thawani, legal review) are the usual cause of delays: start them early.
* **Google OAuth consent** must be published before the public can sign in.

## 5. Parking lot (add new items here)

*(empty - send me new ideas and I will classify them: new stage, part of an existing stage, or later)*
