# ZAYNA - Production deployment & operations guide

> **Status: prepared, not yet proven on a real server.** Everything here was validated as far as possible without
> one (the Compose file resolves, the Caddy config validates, the scripts pass ShellCheck and a control-flow test
> with stubbed commands). The Docker images were **never built** and the stack was **never started** where this was
> written. Treat your first deployment as the real test, do it on a throw-away server first if you can, and
> report any error to be fixed. See section 14 for the full list of what is unverified.

---

## 1. Decisions only you can make (nothing is bought or changed without your approval)

| # | Decision | My recommendation |
|---|----------|-------------------|
| 1 | Where to host (section 3) | One Linux VPS with 4 GB RAM running this Docker Compose stack |
| 2 | Domain name to buy / use | Any registrar; you will create one DNS record yourself |
| 3 | Google sign-in for the public | Publish the OAuth consent screen ("In production") so any Google user can sign in |
| 4 | Online payment | Keep **off** for launch; pay at the salon (already the default) |
| 5 | SMS / email provider | None for launch (booking confirmations are shown on screen only) |
| 6 | Who is the platform admin | The Google account you put in `ADMIN_EMAIL` |

---

## 2. Architecture

```
   Internet
      |  80 / 443 (HTTPS, automatic certificate)
      v
  +-------------------------------------------------------------+
  |  web   Caddy: HTTPS, serves the React site, proxies /api    |   <- the ONLY service with public ports
  +----------------------------+--------------------------------+
                               |  private Docker network (no public ports below this line)
                    +----------v----------+
                    |  api   ASP.NET 8    |   health: /health/live  /health/ready
                    +----------+----------+
                               |
                    +----------v----------+
                    |  db  SQL Server     |   data in a persistent Docker volume
                    |      Express 2022   |   backups -> ./backups (+ optional off-server copy)
                    +---------------------+
```

* The browser talks to **one origin** (`https://your-domain`); `/api/*` is forwarded to the API, so no cross-site
  (CORS) problems and no API URL baked into the site.
* The database and the API are **not reachable from the internet**.
* The API connects with its own least-privilege database login, never `sa`.
* Files: `docker-compose.prod.yml`, `deploy/Caddyfile`, `deploy/web.Dockerfile`, `backend/Dockerfile`,
  `deploy/scripts/*`, `deploy/sql/init-db.sql`, `.env.production.example`.

---

## 3. Hosting options and costs (indicative, checked November 2026 - confirm on the provider's site before buying)

Prices moved a lot in 2026; treat every number as a rough guide.

| | **Option A - one VPS + Docker Compose** (prepared in this repo) | **Option B - Azure managed services** (not prepared) |
|---|---|---|
| What you run | Ubuntu server with Docker; this stack | App Service (API) + Azure SQL Database + static site hosting |
| Typical monthly cost | **~6-12 USD/EUR**: a 2 vCPU / 4 GB server (Hetzner-class prices were about 5-6 EUR/month in autumn 2026 after two price rises; other providers cost several times more) + optional backup storage | **~20-35 USD**: App Service B1 about 13 USD + Azure SQL Basic about 5 USD (2 GB, very small) or Standard S0 about 15 USD, plus a container registry if you deploy containers |
| Plus | Domain (about 10-20 USD/year; check the registrar) | Same |
| Backups | You schedule them (scripts provided); **you must also copy them off the server** | Managed, automatic point-in-time restore |
| Patching / security | **You** (OS updates, firewall) | Provider handles the platform |
| Latency to Oman | Depends on the region; Hetzner has no Middle East location (expect noticeably higher latency than a Gulf region, still fine for a booking site) | Azure has a UAE region close to Oman (check that the services you need are offered there) |
| Single point of failure | Yes (one server) | Lower |
| Effort to start | Low: files already here | Medium: new deployment files needed |

**Recommendation:** start with **Option A**. It is the cheapest, it matches the Docker files you already had, and
it keeps the cost near zero while you validate the business. Move the database to a managed service (Option B's
Azure SQL) when you have paying customers and cannot afford downtime or manual backups.

**Hardware floor:** SQL Server needs at least 2 GB RAM by itself. Use **4 GB RAM, 2 vCPU, 40 GB disk** or more.
Providers sometimes withdraw their cheapest plans; if the plan you want cannot be ordered, pick the next one up.

**SQL Server Express limits** (free and licensed for production): 10 GB per database, about 1.4 GB buffer pool,
4 cores. That is ample for the first thousands of bookings. Check the database size occasionally (section 10).

---

## 4. Before you start - checklist

- [ ] A Linux server (Ubuntu 24.04 LTS recommended), 4 GB RAM, and its public IP address
- [ ] A domain name and access to its DNS settings
- [ ] SSH access to the server with a key (not only a password)
- [ ] The code (this repository, on the commit/tag you want to release)
- [ ] A Google OAuth client; `https://YOUR-DOMAIN` added under **Authorised JavaScript origins**; consent screen set to **In production**
- [ ] A **new** JWT secret (never reuse the development one)

---

## 5. Prepare the server (once)

Run as a non-root user with `sudo`. Replace `deploy` with your user name.

```bash
# 1) Updates and automatic security updates
sudo apt update && sudo apt -y upgrade
sudo apt -y install unattended-upgrades ufw git curl
sudo dpkg-reconfigure -plow unattended-upgrades

# 2) Firewall: only SSH, HTTP and HTTPS (UDP 443 = HTTP/3)
sudo ufw default deny incoming && sudo ufw default allow outgoing
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow 443/udp
sudo ufw enable

# 3) Docker Engine + Compose plugin: follow the official, current instructions
#    https://docs.docker.com/engine/install/ubuntu/
#    then allow your user to run it:
sudo usermod -aG docker "$USER"      # log out and back in afterwards
docker compose version               # must print a version

# 4) (Optional but recommended on 4 GB servers) 2 GB swap so a memory spike does not kill the database
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

SSH hardening (disable password login, no root login) is strongly recommended: edit `/etc/ssh/sshd_config`
(`PasswordAuthentication no`, `PermitRootLogin no`), then `sudo systemctl reload ssh` - **keep a second SSH session open
while you test it**.

---

## 6. DNS (you do this; I never touch DNS)

Create an **A record** for your domain (e.g. `zayna.example.com`) pointing to the server's IPv4 address (and an
**AAAA** record if the server has IPv6). Wait until it resolves:

```bash
dig +short zayna.example.com        # must print the server IP
```

Caddy can only obtain the HTTPS certificate **after** this works and ports 80/443 are reachable.

---

## 7. Put the code on the server

```bash
sudo mkdir -p /opt/zayna && sudo chown "$USER": /opt/zayna
git clone <your repository url> /opt/zayna     # private repo: add a read-only "deploy key"
cd /opt/zayna
git checkout <release tag or commit>           # deploy a specific, known version
chmod +x deploy/scripts/*.sh                   # git on Windows may not keep the executable bit
```

> If a script fails with `bad interpreter` or `\r: command not found`, it was saved with Windows line endings.
> The repository's `.gitattributes` forces LF for these files; fix an existing copy with `sed -i 's/\r$//' deploy/scripts/*.sh`.
> When you commit from Windows, also run `git update-index --chmod=+x deploy/scripts/*.sh`.

---

## 8. Configure (`.env`)

```bash
cd /opt/zayna
cp .env.production.example .env
chmod 600 .env
nano .env
```

Rules: no spaces around `=`, no quotes, **no `$` and no `;`** in any value. Generate the secrets on the server:

```bash
openssl rand -base64 48      # -> JWT_SECRET_KEY (generate again if it contains $ or ;)
openssl rand -hex 24         # -> DB_APP_PASSWORD
# DB_SA_PASSWORD: your own 12+ characters with upper, lower, digit and symbol; store it in a password manager
```

All variables are documented in section 13. **Never commit `.env`** (it is git-ignored) and never paste it anywhere.

---

## 9. First deployment

```bash
cd /opt/zayna

# 1) Create the database and the application's own login (safe to re-run)
deploy/scripts/init-db.sh

# 2) Build, review the database changes, apply them (after your confirmation), start
deploy/scripts/deploy.sh
```

What `deploy.sh` does, so nothing surprises you:

1. Builds the images (the first build takes several minutes).
2. Runs **`--pending`**: lists the database migrations that have not been applied. **Read the list.**
   On a brand-new database it lists all of them; that is expected.
3. If there are any: takes a **backup**, then **asks you to type `yes`** before it applies them.
4. Applies them and makes sure the admin account (`ADMIN_EMAIL`) exists.
5. Starts everything and waits for `https://YOUR-DOMAIN/health/ready`.

Nothing changes in the database until you type `yes`. The API itself **refuses to start** if the schema is out of
date (production never migrates silently).

### Verify (do all of these)

- [ ] `https://YOUR-DOMAIN` loads, with a valid certificate (padlock)
- [ ] `https://YOUR-DOMAIN/health/ready` returns `Healthy`
- [ ] `docker compose -f docker-compose.prod.yml ps` shows `db`, `api`, `web` as running/healthy
- [ ] From **another computer**, ports other than 22/80/443 are closed (for example `nmap -Pn YOUR-IP`); **1433 must not be reachable**
- [ ] Sign in with the Google account you set as `ADMIN_EMAIL`; you land on the admin dashboard
- [ ] Register a test salon (second Google account), set it up, approve it as admin, book it as a customer, cancel the booking
- [ ] Run a backup (section 10) and confirm a file appears in `backups/`
- [ ] Reload the page and restart the stack (`docker compose -f docker-compose.prod.yml restart`): data is still there

---

## 10. Backups and restore

**Take a backup now and on a schedule**

```bash
deploy/scripts/backup.sh          # writes backups/zaynadb_<UTC time>.bak.gz, verified (RESTORE VERIFYONLY)
```

Nightly at 02:00 via cron (`crontab -e`):

```
0 2 * * * /opt/zayna/deploy/scripts/backup.sh >> /var/log/zayna-backup.log 2>&1
```

Local copies older than `BACKUP_KEEP_DAYS` (default 14) are pruned.

> **A backup that lives only on the same server is not a backup.** Copy them elsewhere. With
> [rclone](https://rclone.org) (any object storage or cloud drive): run `rclone config`, then set
> `BACKUP_RCLONE_REMOTE=remote:zayna-backups` in `.env`; `backup.sh` then uploads each file automatically. Also take
> your provider's server snapshots if they are cheap.

**Restore (destructive - replaces the live database)**

```bash
deploy/scripts/restore.sh backups/zaynadb_20261103T020000Z.bak.gz
```

It takes a safety backup of the current state first, asks you to type `RESTORE ZaynaDB`, stops the app, restores, and
starts it again. Anything saved after that backup was made is lost.

**Test your restores.** Once, right after launch and then every few months, restore a backup onto a scratch server
and check that the site works. An untested backup is a hope, not a plan.

**Database size** (Express stops at 10 GB per database):

```bash
docker compose -f docker-compose.prod.yml exec db sh -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "EXEC sp_spaceused" -d ZaynaDB'
```

---

## 11. Updating and rolling back

### Update

```bash
cd /opt/zayna
git fetch --tags && git checkout <new tag or commit>
deploy/scripts/deploy.sh
```

Same safe sequence as the first deployment: build, show pending migrations, backup + confirmation if there are any,
start, wait for health. Each version's images are tagged with the commit id and kept locally, and `.deploy-history`
records every successful deployment.

### Roll back the application (code only)

Use this when a new version misbehaves and **no database migration was applied**, or the migration is backward compatible:

```bash
cd /opt/zayna
git checkout <previous commit>              # see .deploy-history for ids
export APP_VERSION=<previous commit id>
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-build api web
curl -fsS https://YOUR-DOMAIN/health/ready
```

(The previous images are still on the server unless you removed them manually - do not run `docker system prune -a`.)

### Roll back the database

Schema migrations are **forward-only in production** (the `Down` migrations are not used). If a migration went wrong:
stop the app, restore the backup that `deploy.sh` took just before the migration (section 10), then roll the code back
as above. Bookings made between the backup and the restore are lost, so decide quickly and tell affected users.

---

## 12. Day-to-day operations

```bash
cd /opt/zayna
docker compose -f docker-compose.prod.yml ps                       # status
docker compose -f docker-compose.prod.yml logs -f --tail=200 api   # live API logs (one JSON object per line)
docker compose -f docker-compose.prod.yml logs --since 1h api | grep -i '"LogLevel":"Error"'
docker compose -f docker-compose.prod.yml restart api              # restart one service
df -h && docker system df                                          # disk usage
```

* **Monitoring:** point a free uptime monitor (for example UptimeRobot) at `https://YOUR-DOMAIN/health/ready` with email alerts.
  It fails when the API is down **or** the database is unreachable.
* **Logs** rotate automatically (10 MB x 5 files per service), so they cannot fill the disk.
* **HTTPS certificates** renew automatically; the `caddy_data` volume keeps them.
* **OS updates:** automatic security updates are on; reboot occasionally (`sudo reboot`), the stack restarts by itself.
* **Changing a secret** (edit `.env`, then `docker compose ... up -d`). Changing `JWT_SECRET_KEY` signs every user out.
  Changing `DB_APP_PASSWORD` requires `deploy/scripts/init-db.sh` first (it updates the database login), then `up -d`.
* **Changing the admin:** edit `ADMIN_EMAIL`, run `deploy/scripts/deploy.sh`. The new address becomes Admin the next time it signs in with Google.

---

## 13. Environment variable reference (`.env`)

| Variable | Required | Example (not real) | Meaning |
|---|---|---|---|
| `DOMAIN` | yes | `zayna.example.com` | Public host name, no `https://` |
| `ACME_EMAIL` | yes | `you@example.com` | Let's Encrypt expiry notices |
| `DB_SA_PASSWORD` | yes | (strong, 12+ chars) | SQL Server administrator; backups only |
| `DB_APP_PASSWORD` | yes | `openssl rand -hex 24` | The API's database login; letters/digits/`.`/`_`/`-` only, 16+ |
| `DB_MEMORY_LIMIT_MB` | no (1536) | `1536` | SQL Server memory cap |
| `JWT_SECRET_KEY` | yes | `openssl rand -base64 48` | Signs login tokens |
| `JWT_ISSUER` / `JWT_AUDIENCE` / `JWT_EXPIRY_HOURS` | no | `ZAYNA.API` / `ZAYNA.Client` / `24` | Token settings |
| `GOOGLE_CLIENT_ID` | yes | `123-abc.apps.googleusercontent.com` | Google OAuth client (public identifier) |
| `ADMIN_EMAIL` | no | `owner@example.com` | The platform admin's Google account |
| `BOOKING_TIMEZONE` | no | `Asia/Muscat` | Salon-local time zone |
| `BACKUP_KEEP_DAYS` | no (14) | `14` | Local backup retention |
| `BACKUP_RCLONE_REMOTE` | no | `remote:zayna-backups` | Off-server backup destination |
| `APP_VERSION` | no | set by `deploy.sh` | Image tag (commit id) |

Settings fixed by `docker-compose.prod.yml` (change only on purpose): `ASPNETCORE_ENVIRONMENT=Production`,
`Database__AutoMigrate=false`, `Proxy__TrustForwardedHeaders=true`, `Payments__OnlineEnabled=false`,
`AllowedHosts=<DOMAIN>;localhost`, `Cors__AllowedOrigins=https://<DOMAIN>`. Booking rules (lead time, cancellation
window, horizon, auto-confirm) can be added as `Booking__MinLeadMinutes`, `Booking__CancellationCutoffHours`,
`Booking__MaxDaysAhead`, `Booking__AutoConfirm` environment entries under `api`.

---

## 14. Security checklist

- [ ] Firewall allows only 22, 80, 443 (tcp) and 443 (udp); `1433` and `8080` are not reachable from outside
- [ ] SSH: keys only, no root login
- [ ] `.env` is `chmod 600`, not in Git, not shared; secrets are different from development
- [ ] The Google consent screen is published and only your domain is an authorised origin
- [ ] Admin signs in with Google (admin accounts cannot use a password)
- [ ] Backups run nightly **and** are copied off the server; a restore has been tested
- [ ] Uptime monitor is active on `/health/ready`
- [ ] Anyone in the `docker` group is effectively root on the server: keep that group small
- [ ] The 5 MB `frontend/src/components/claim/db/saleh.bak` in the repository is reviewed for personal data and removed from the Git history
- [ ] Secrets passed to containers can be read by anyone who can run `docker inspect` (root/docker group); acceptable for one server, move to a secrets manager if the team grows

---

## 15. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Browser says the certificate is invalid / site not reachable | DNS not pointing at the server yet, or ports 80/443 blocked. Check `dig`, the firewall and your provider's firewall; then `docker compose -f docker-compose.prod.yml logs web` |
| `api` keeps restarting, log says *"The database schema is out of date"* | Run `deploy/scripts/deploy.sh` (it shows and applies pending migrations) |
| `api` unhealthy, log shows a login/connection error | `DB_APP_PASSWORD` changed or `init-db.sh` not run: run `deploy/scripts/init-db.sh`, then `docker compose ... up -d` |
| `/health/ready` is `Unhealthy`, `/health/live` is `Healthy` | The API is up but cannot reach the database: `docker compose ... logs db`, check memory/disk |
| Google button: "origin is not allowed" | Add `https://YOUR-DOMAIN` (exact, no trailing slash) under Authorised JavaScript origins; wait a few minutes |
| Google sign-in returns an error after the popup | Check `GOOGLE_CLIENT_ID` is identical in `.env` and the Cloud Console; check the server can reach `www.googleapis.com` |
| Only test users can sign in with Google | Publish the OAuth consent screen ("In production") |
| `db` container exits immediately | Not enough memory (needs 2 GB+) or a weak `DB_SA_PASSWORD`; `docker compose ... logs db` |
| `docker compose` permission denied | Log out and back in after `usermod -aG docker`, or use `sudo` |
| 429 on login | The login rate limit (10 requests/minute per address) - wait a minute |

---

## 16. What is NOT verified, and what is still missing

**Not verified (no Docker, no server, no NuGet access where this was prepared):**

* The Docker images were never built and the stack never started. Expect to fix small things on the first run.
* The `sqlcmd` commands in the scripts (database creation, backup, restore) were not executed against a real SQL
  Server; the tool path (`/opt/mssql-tools18`) is that of the `2022-latest` image.
* The API's new maintenance commands (`--pending`, `--migrate`), the health endpoints, the forwarded-header and JSON-log
  setup were written but never compiled or run.
* Automatic HTTPS needs real DNS and open ports; it could not be tried.
* The CI workflow has never run on GitHub.

**Still missing for a complete production setup:**

* Email/SMS provider (no booking confirmations or password reset), online payment provider (disabled).
* Off-server backup destination and an alerting channel are yours to choose.
* High availability: one server means downtime while it reboots or fails. Acceptable for an MVP; revisit with real revenue.
* A Content-Security-Policy header (the Google sign-in needs a carefully tested policy) and a WAF/CDN in front of the site.
* Load testing, and a written incident/recovery drill.
* Legal pages (terms, privacy policy) and, for Oman, the business and data-protection obligations.
