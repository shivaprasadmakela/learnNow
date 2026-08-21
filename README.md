# learnNow Platform

An interactive learning platform for engineering topics: guided paths, hands-on labs,
notes, quizzes, and a built-in multi-language code playground.

- **Backend** — Java 21 / Spring Boot, PostgreSQL, Flyway. REST API on `:8080`.
- **Frontend** — React 19 + TypeScript + Vite, CSS Modules. Dev server on `:5173`.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | **21** | Matches `<java.version>` in `backend/pom.xml`. |
| Node.js | 20+ | |
| PostgreSQL | 14+ | Listening on `5432`. |
| Docker | any recent | Only for running integration tests. |

---

## Getting started

### 1. Create the database

```sql
CREATE DATABASE learnnow;
```

### 2. Configure the environment

Every secret is supplied through the environment. There are **no credential defaults
in the source tree**, so the application will refuse to start until these are set —
that is deliberate, and it is what stops a development secret from following a build
into production.

```bash
cp .env.example .env
```

Then fill it in. `run.sh` loads `.env` automatically.

| Variable | Required | Purpose |
|---|:--:|---|
| `SPRING_DATASOURCE_URL` | | Defaults to `jdbc:postgresql://localhost:5432/learnnow`. |
| `SPRING_DATASOURCE_USERNAME` | ✔ | Database user. |
| `SPRING_DATASOURCE_PASSWORD` | ✔ | Database password. |
| `JWT_SECRET` | ✔ | Access-token signing key. **Minimum 32 bytes** — startup fails below that. Generate with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` | ✔ | OAuth client id. Enforced as the ID token audience; Google sign-in is refused without it. |
| `RESEND_API_KEY` | ✔ | Transactional email. |
| `RESEND_FROM_ADDRESS` | ✔ | Verified sender address. |
| `RAZORPAY_KEY_ID` | ✔ | Payment gateway key. |
| `RAZORPAY_KEY_SECRET` | ✔ | Payment gateway secret. |
| `RAZORPAY_WEBHOOK_SECRET` | | Required to accept payment webhooks; without it they are rejected. |
| `APP_BASE_URL` | ✔ | Public frontend origin, used to build email links. |
| `ALLOWED_ORIGINS` | ✔ | Comma-separated **exact** origins. Wildcards are rejected at startup. |
| `ADMIN_BOOTSTRAP_EMAIL` | | Promotes this existing account to `ADMIN` on startup. |
| `ACCESS_TOKEN_TTL_MINUTES` | | Access-token lifetime. Default 30. |
| `PAYMENTS_MOCK_ENABLED` | | **Local only.** Accepts payment signatures without verifying them. |

The frontend reads two variables of its own, from `ui/.env`:

```
VITE_BACKEND_URL=          # leave blank to use the Vite dev proxy
VITE_GOOGLE_CLIENT_ID=
```

### 3. Run

```bash
./run.sh
```

Starts the backend on `:8080` (applying Flyway migrations) and the Vite dev server on
`:5173`. `./stop.sh` terminates both.

---

## Profiles

The active profile comes from `SPRING_PROFILES_ACTIVE` and is **not** defaulted in
`application.properties`. `run.sh` sets `local`; the Dockerfile pins `prod`.

| Profile | Flyway | Payment mock | Credentials |
|---|---|---|---|
| `local` | Relaxed — baseline and repair permitted | Allowed | From `.env` |
| `prod` | Strict validation only | Impossible | From the environment / secret manager |

---

## Testing

```bash
cd backend && mvn verify     # unit + integration tests, plus spotless:check
cd ui && npm test            # Vitest
cd ui && npm run typecheck   # tsc
cd ui && npm run lint        # ESLint
```

Integration tests run against a throwaway PostgreSQL container via Testcontainers, so
they need a reachable Docker daemon. **Without one they are skipped, not failed** — CI
asserts Docker is present so they cannot be silently skipped there.

If Testcontainers cannot find your daemon (common with Colima or a stale
`~/.testcontainers.properties`), point it at the right socket:

```bash
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
```

---

## Operations

- `GET /api/health` — public check; opens a database connection and returns `503` if
  the database is unreachable.
- `GET /actuator/health/readiness` and `/liveness` on the management port (`8081` by
  default) — point orchestrator probes at these. Keep the management port private.
- `GET /swagger-ui.html` — generated API documentation.

Token cleanup (expired verification, reset, and refresh tokens) runs nightly at 03:15.

---

## Repository layout

```text
learnNow/
├── backend/
│   ├── src/main/java/com/learnnow/
│   │   ├── admin/            # content authoring, course import
│   │   ├── common/           # config, security, exception handling
│   │   ├── compiler/         # code execution and shared snippets
│   │   ├── donations/        # Razorpay checkout and webhooks
│   │   ├── learningprogress/ # progress, streaks, points, quizzes
│   │   ├── notes/            # notes and bookmarks
│   │   ├── paths/            # paths, topics, subtopics, catalog
│   │   └── user/             # accounts, auth, sessions
│   ├── src/main/resources/db/migration/   # Flyway migrations
│   └── pom.xml
├── ui/
│   └── src/
│       ├── app/              # shell, routing, top-level hooks
│       ├── features/         # one folder per feature
│       ├── shared/           # API client, UI kit, hooks
│       └── styles/           # design tokens and themes
├── .github/workflows/        # CI and scheduled dependency audit
├── Dockerfile
├── run.sh / stop.sh
└── .env.example
```

---

## Security notes

- Access tokens are short-lived; renewal goes through `POST /api/auth/refresh`, which
  rotates the refresh token. `POST /api/auth/logout` revokes it. Resetting a password
  revokes every session.
- Code execution (`/api/compiler/**`) requires authentication and is rate limited.
- Authentication, email-sending, payment, and quiz endpoints are rate limited per tier.
  Limits are per instance — put real limiting at the gateway before scaling out.
- The client IP comes from Spring's `ForwardedHeaderFilter`
  (`server.forward-headers-strategy=framework`), so `X-Forwarded-For` is only trusted
  from your own proxy. Make sure a proxy actually sets it in production.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). `mvn verify` fails on unformatted Java — run
`mvn spotless:apply` before committing.
