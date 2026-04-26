# Connect Wheels — Free-Tier Deployment Guide

Step-by-step guide to deploy this microservices project on **completely free** infrastructure.

**Architecture**

```
                     ┌─────────────────┐
   Browser ─────────▶│  Vercel (FE)    │  React + Vite
                     └────────┬────────┘
                              │ HTTPS
                              ▼
                     ┌─────────────────┐
                     │  Render         │
                     │  API Gateway    │  Express proxy
                     │  (cw-api-gateway)│
                     └────┬─────┬─────┬┘
                          │     │     │
                ┌─────────┘     │     └─────────┐
                ▼               ▼               ▼
         ┌───────────┐   ┌───────────┐   ┌───────────┐
         │ Render    │   │ Render    │   │ Render    │
         │ Auth Svc  │   │ Chat Svc  │   │ Garage Svc│
         └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
               │               │               │
               ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────┐
         │   Neon   │    │  Atlas   │    │   Neon   │
         │ Postgres │    │ MongoDB  │    │ Postgres │
         └──────────┘    └──────────┘    └──────────┘
```

**Total cost:** $0/month
**Total time first deploy:** ~45-60 minutes

---

## Free-tier limits to know up front

| Service | Free limit | Catch |
|---|---|---|
| **Render Web Service** | 750 hr/month per service | Sleeps after 15 min idle. First request after sleep ~30-60s. |
| **Vercel** | 100 GB bandwidth, unlimited deploys | None for hobby use |
| **Neon Postgres** | 0.5 GB storage, 1 project | Auto-suspends when idle (resumes in <1s) |
| **MongoDB Atlas M0** | 512 MB, shared CPU | None for hobby use |
| **Render disk** | Not free | **Why we don't persist uploaded images on Render** |

> **Important:** With 4 services, all 4 will sleep when idle. The first user hitting your site will trigger 4 cold starts in series and may wait ~1-2 minutes. This is the price of free. (Workarounds in [Phase 2](#phase-2-improvements-optional).)

---

## Prerequisites checklist

- [ ] GitHub account with this repo pushed (you confirmed: yes, public)
- [ ] Render account → https://render.com (sign in with GitHub)
- [ ] Vercel account → https://vercel.com (sign in with GitHub)
- [ ] Neon account → https://neon.tech (sign in with GitHub)
- [ ] MongoDB Atlas account → https://mongodb.com/atlas (free email signup)
- [ ] Docker Desktop installed locally (for the optional pre-flight test)

---

## Phase 0 — Critical security cleanup (DO THIS FIRST)

### 0.1 Rotate the leaked MongoDB password

A real password was previously committed in `chat-service/src/config/database.ts`. Even though we removed it, it's in your git history.

1. Go to MongoDB Atlas → **Database Access** → find user `salmanhanif524_db_user`.
2. Either **delete this user** or **edit password** to a fresh one.
3. The new connection string will only live in `.env.prod` and Render env vars (never code).

### 0.2 Remove any leaked Google OAuth secret

`docker-compose.yml` has a default `GOOGLE_CLIENT_SECRET=GOCSPX-...`. Treat it as compromised:

1. Google Cloud Console → APIs & Services → Credentials.
2. Click your OAuth client → **Reset Secret** (or delete & recreate).
3. Save the new client ID and secret for Phase 4.

### 0.3 Generate a strong JWT secret

```bash
openssl rand -hex 64
```

Copy the output. You'll paste it into Render env vars. The SAME value goes into:
- `cw-auth-service` (issues tokens)
- `cw-chat-service` (verifies tokens for socket auth)
- `cw-garage-service` (verifies tokens for protected routes)

---

## Phase 1 — Set up managed databases

### 1.1 Neon (Postgres)

1. https://neon.tech → **Create project**.
2. Region: pick closest to where you'll deploy on Render (e.g. `aws-us-east-1`).
3. Database name: `connect_wheels`.
4. After creation, click **Dashboard → Connection Details**.
5. Copy these values for later:

   ```
   Host:     ep-xxxx-xxxxx.us-east-1.aws.neon.tech
   Database: connect_wheels
   User:     neondb_owner
   Password: (click "Show password")
   ```

6. (Optional) Create a second database for garage if you want isolation:
   - Click **Branches → main → SQL Editor**
   - Run: `CREATE DATABASE connect_wheels_garage;`

### 1.2 MongoDB Atlas

1. https://mongodb.com/atlas → **Create cluster** → **M0 (FREE)**.
2. Provider: AWS, Region: same as Neon.
3. Cluster name: `connect-wheels`.
4. **Security → Database Access**: create a user `cw_app` with a strong password.
5. **Security → Network Access**: click **Add IP Address → Allow Access from Anywhere** (0.0.0.0/0).
   > Free tier doesn't support VPC peering. This is fine because the DB user/password is the real auth.
6. **Database → Connect → Drivers**: copy the URI:

   ```
   mongodb+srv://cw_app:<password>@connect-wheels.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Replace `<password>` with the real one and append `connect_wheels_chat` before the `?`:

   ```
   mongodb+srv://cw_app:REAL_PASSWORD@connect-wheels.xxxxx.mongodb.net/connect_wheels_chat?retryWrites=true&w=majority
   ```

---

## Phase 2 — (Optional but RECOMMENDED) Test locally with the prod images

This catches 95% of bugs before Render does. Skip only if you're in a hurry.

```bash
cd connect-wheels-be
cp .env.prod.example .env.prod
# Edit .env.prod with your real Neon + Atlas + JWT values

docker compose -f docker-compose.prod.yml --env-file .env.prod up --build
```

Then in another terminal:

```bash
curl http://localhost:8080/health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

All four should return `{"status":"healthy",...}`.

> If they don't, check `docker compose logs <service-name>`. Common issue: SSL not enabled on Postgres connection — make sure `DB_SSL=true` is set.

When done, `Ctrl+C` and `docker compose -f docker-compose.prod.yml down`.

---

## Phase 3 — Deploy backend to Render via Blueprint

### 3.1 Push your latest code to GitHub

```bash
cd "/home/salman/Connect Wheels"
git add .
git commit -m "feat: prepare project for Render + Vercel deployment"
git push origin main
```

### 3.2 Connect repo to Render

1. https://dashboard.render.com → **New** → **Blueprint**.
2. Select your `Connect Wheels` GitHub repo.
3. Render reads `render.yaml` at the root and shows you 4 services to be created.
4. Give the blueprint a name (e.g. `connect-wheels`).
5. Click **Apply**.

Render will start building all 4 services in parallel. **First builds take 5-10 minutes each.**

### 3.3 Wait, then fill in the secret env vars

Each service in `render.yaml` has env vars marked `sync: false`. These are **secrets that Render is waiting on**. The build will succeed but the service will crash on startup until you set them.

Go to each service in the Render dashboard → **Environment** tab → fill these in:

#### `cw-auth-service`

| Variable | Value |
|---|---|
| `DB_HOST` | `ep-xxxx.us-east-1.aws.neon.tech` (from Neon) |
| `DB_USERNAME` | `neondb_owner` |
| `DB_PASSWORD` | (your Neon password) |
| `DB_DATABASE` | `connect_wheels` |
| `JWT_SECRET` | (the `openssl rand -hex 64` output) |
| `GOOGLE_CLIENT_ID` | (your new OAuth client ID) |
| `GOOGLE_CLIENT_SECRET` | (your new OAuth secret) |
| `GOOGLE_REDIRECT_URI` | `https://cw-api-gateway.onrender.com/api/auth/google/callback` |
| `CORS_ORIGINS` | (filled in Phase 5 after Vercel deploy) — for now: `*` |
| `FRONTEND_URL` | `*` (temporary) |
| `FRONTEND_VERIFY_EMAIL_URL` | `*` (temporary) |

#### `cw-chat-service`

| Variable | Value |
|---|---|
| `MONGODB_URI` | (your full Atlas URI with password) |
| `JWT_SECRET` | (SAME value as auth-service) |
| `WEBSOCKET_CORS_ORIGIN` | `*` (temporary, fix in Phase 5) |

#### `cw-garage-service`

| Variable | Value |
|---|---|
| `DB_HOST` | (same Neon host) |
| `DB_USERNAME` | `neondb_owner` |
| `DB_PASSWORD` | (same Neon password) |
| `DB_DATABASE` | `connect_wheels` (or `connect_wheels_garage` if you made one) |
| `JWT_SECRET` | (SAME value) |

> Note: `AUTH_SERVICE_HTTP_URL` may auto-fill from `fromService` — but if it ends up wrong, override it manually to `https://cw-auth-service.onrender.com`.

#### `cw-api-gateway`

| Variable | Value |
|---|---|
| `AUTH_SERVICE_URL` | `https://cw-auth-service.onrender.com` |
| `CHAT_SERVICE_URL` | `https://cw-chat-service.onrender.com` |
| `GARAGE_SERVICE_URL` | `https://cw-garage-service.onrender.com` |
| `FRONTEND_URL` | `*` (temporary) |

### 3.4 Trigger a manual redeploy of each service

After saving env vars, click **Manual Deploy → Deploy latest commit** on each service.

### 3.5 Verify

```bash
curl https://cw-api-gateway.onrender.com/health
```

Expected:
```json
{
  "status": "healthy",
  "gateway": "API Gateway",
  ...
  "services": {
    "auth": "https://cw-auth-service.onrender.com",
    "chat": "https://cw-chat-service.onrender.com",
    "garage": "https://cw-garage-service.onrender.com"
  }
}
```

---

## Phase 4 — Deploy frontend to Vercel

### 4.1 Import the project

1. https://vercel.com/new → import the same GitHub repo.
2. **Root Directory:** `connect-wheels-fe`. (Click "Edit" next to the directory selector.)
3. Framework: Vercel auto-detects Vite.
4. **Environment Variables** → add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://cw-api-gateway.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://cw-api-gateway.onrender.com` |

5. Click **Deploy**.

After ~1 minute you'll get a URL like `https://connect-wheels-fe.vercel.app`. Copy it.

---

## Phase 5 — Tighten CORS to the real frontend URL

Now that you know your Vercel URL, go back to Render and replace the `*` placeholders:

1. **`cw-auth-service` env**:
   - `CORS_ORIGINS` → `https://connect-wheels-fe.vercel.app`
   - `FRONTEND_URL` → `https://connect-wheels-fe.vercel.app`
   - `FRONTEND_VERIFY_EMAIL_URL` → `https://connect-wheels-fe.vercel.app/verify-email`

2. **`cw-chat-service` env**:
   - `WEBSOCKET_CORS_ORIGIN` → `https://connect-wheels-fe.vercel.app`

3. **`cw-api-gateway` env**:
   - `FRONTEND_URL` → `https://connect-wheels-fe.vercel.app`

4. Manually redeploy each service.

5. **Update Google OAuth Redirect URIs** in Google Cloud Console to include the new prod callback:
   `https://cw-api-gateway.onrender.com/api/auth/google/callback`

---

## Phase 6 — Smoke test

| Test | How |
|---|---|
| Frontend loads | Visit `https://connect-wheels-fe.vercel.app` |
| Register a user | Use the signup form → check email verification log on Render `cw-auth-service` log tab |
| Login | Login with verified user → token returned |
| Profile loads | Authenticated `/user/profile` call succeeds |
| Chat connects | Open chat page → check `cw-chat-service` logs for "socket connected" |
| Image upload | Upload a garage cover → file shows on the page |

---

## Known limitations on free tier

### 1. **Image uploads are EPHEMERAL**

Files are saved to `/app/garage-service/uploads`. On Render free tier, this disk is **wiped on every deploy and every cold-start**. Uploaded images will disappear.

**Solutions (pick one for production):**

- **Cloudinary** (recommended, free tier 25 GB) — easiest. Replace the `multer.diskStorage` with `multer-storage-cloudinary`.
- **AWS S3** with free tier
- **Render Persistent Disk** ($0.25/GB/month, paid)

### 2. **Cold starts**

After 15 minutes of no traffic, services sleep. The next request takes ~30-60s to wake up. With 4 services, that compounds.

**Mitigations:**
- Use a free uptime monitor like UptimeRobot/Better Stack to ping `/health` every 10 min — keeps services warm. (Render's TOS technically discourages this; not a violation but borderline.)
- Combine 3 backend services into 1 (kills the microservice architecture, not recommended).
- Upgrade to Render's $7/month Starter plan per service (no sleep).

### 3. **No real CI**

Currently Render auto-deploys on `git push`. There's no test/lint gate. See [Phase 2 Improvements](#phase-2-improvements-optional).

### 4. **TypeScript runs via `ts-node`**

Slower startup and higher memory than compiled JS. To compile to JS:

```bash
# in each service
npm i -D typescript
npx tsc
# update package.json: "start": "node dist/index.js"
# update Dockerfile: add `RUN npx tsc` before runner stage
```

---

## How auto-deploy works (your "pipeline")

You don't need GitHub Actions for this. Here's the flow:

```
1. You: git push origin main
2. GitHub: webhook fires to Render and Vercel
3. Render: pulls code, runs `docker build` for each service, deploys
4. Vercel: pulls code, runs `npm run build`, deploys CDN
5. Both: send you an email/Slack notification on success or failure
```

Both platforms support:
- **Per-branch deploys**: a push to `feature/x` creates a preview URL automatically.
- **Rollbacks**: one click in the dashboard.
- **Build logs**: full real-time logs in the dashboard.

---

## Phase 2 improvements (optional, for later)

When you're ready to level up, add:

- [ ] **GitHub Actions CI** — type-check + lint before allowing deploy. Template provided in `.github/workflows/ci.yml.example` (we can add this later).
- [ ] **Cloudinary** for persistent image uploads.
- [ ] **Compiled TypeScript** (faster cold starts, smaller images).
- [ ] **Sentry** error monitoring (free tier: 5k errors/month).
- [ ] **Custom domain** (e.g. `connectwheels.com`) — both Render and Vercel support free custom domains with auto-HTTPS.
- [ ] **Database connection pooling** via Neon's built-in PgBouncer (already free, just use the `-pooler` host).
- [ ] **Redis** via Upstash for session storage / chat caching.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `getaddrinfo ENOTFOUND` (auth → DB) | Check `DB_HOST` is the Neon host, not `localhost`. Make sure `DB_SSL=true`. |
| `MongoServerSelectionError` | Check Atlas Network Access allows `0.0.0.0/0`. Check the password is URL-encoded (no `@` `/` `:` raw). |
| `CORS blocked for origin` | The frontend URL isn't in `CORS_ORIGINS`. Add it (comma separated, no trailing slash). |
| Chat doesn't connect (socket.io) | Make sure `VITE_SOCKET_URL` has NO `/api` suffix. WebSockets need root path. |
| `JWT malformed` / 403 on protected routes | `JWT_SECRET` differs between auth-service (issuer) and the verifier (chat/garage/api-gateway). They must be identical. |
| Build fails: "couldn't find package-lock.json" | Run `npm install` in the affected service locally and commit the lockfile. |
| Render service stuck "Deploying" forever | Open logs. Likely the app is crashing on startup — usually missing env var. |
| Image uploads return 404 after some time | This is the ephemeral-disk issue. Use Cloudinary. |

---

## Quick reference: URLs you'll have at the end

| Service | URL |
|---|---|
| Frontend | `https://connect-wheels-fe.vercel.app` |
| API Gateway (only public backend URL the FE talks to) | `https://cw-api-gateway.onrender.com` |
| Auth (internal) | `https://cw-auth-service.onrender.com` |
| Chat (internal) | `https://cw-chat-service.onrender.com` |
| Garage (internal) | `https://cw-garage-service.onrender.com` |
| Postgres | (Neon dashboard) |
| MongoDB | (Atlas dashboard) |

The "internal" services are still publicly accessible (they have HTTPS URLs). On Render's free plan there is no private network. They are protected only by JWT auth at the application layer. Keep `JWT_SECRET` strong.
