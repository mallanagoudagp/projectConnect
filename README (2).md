# BuildTrack (projectConnect)

Connecting Parents, Students, and Builders for School & College Project Development.

BuildTrack is a full-stack platform where students request project help, parents approve and pay, verified builders deliver guided learning / ready‑made projects, and everyone tracks progress in one place.

This README documents the codebase **as it actually exists in this repository today** — how to set it up from scratch, how the pieces fit together, and how the implementation compares against the original BuildTrack PRD/SRS design document.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack (Actually Used)](#2-tech-stack-actually-used)
3. [Repository Structure](#3-repository-structure)
4. [Architecture — How the Pieces Actually Connect](#4-architecture--how-the-pieces-actually-connect)
5. [Setup From Scratch](#5-setup-from-scratch)
6. [Running the App](#6-running-the-app)
7. [Backend API Reference](#7-backend-api-reference)
8. [Database Schema (Current)](#8-database-schema-current)
9. [Feature Walkthrough](#9-feature-walkthrough)
10. [Testing](#10-testing)
11. [PRD/SRS Compliance Check](#11-prdsrs-compliance-check)
12. [Known Gaps, Risks & Inconsistencies](#12-known-gaps-risks--inconsistencies)
13. [Suggested Next Steps](#13-suggested-next-steps)

---

## 1. Project Overview

Four roles:

- **Parent** — approves project requests, selects builders, pays, tracks progress, reviews builders.
- **Child / Student** — requests help, attends sessions, views their own progress only.
- **Builder** — lists services, accepts requests, teaches, uploads progress, gets paid via escrow.
- **Admin** — verifies builders, oversees the platform.

Core selling point: a **collaborative workspace per project request** that combines chat/sessions, file uploads, escrow-based payments, and progress tracking in one place, rather than a plain buy/sell marketplace.

## 2. Tech Stack (Actually Used)

| Layer | What's in this repo |
|---|---|
| Frontend framework | Next.js 15 (App Router) + React 18 |
| Styling / UI | Tailwind CSS v4, shadcn/ui, Radix primitives, `lucide-react` |
| Frontend state | Local component state + a custom `AuthProvider` (React Context) |
| Frontend auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) — **currently bypassed**, see §12 |
| Primary backend | **FastAPI** (Python 3.13) — `backend/app` |
| ORM / DB access | SQLAlchemy (Core + ORM) |
| Database (backend) | PostgreSQL in production/docker; SQLite fallback for local/dev (`test.db`) |
| Migrations | Alembic (partial — see §12) |
| Secondary/legacy backend | Next.js Route Handlers under `app/api/*` using an **in-memory demo store** (`lib/demo-store.ts`) — not wired to the FastAPI backend |
| Alternate schema | A Supabase/Postgres SQL schema with Row-Level Security under `scripts/sql/*.sql` — a **third**, independent data model (UUID-based, `projects`/`requests` tables) |
| Payments | Mocked gateway (`MockPaymentGateway` in `payment_service.py`); no real Stripe/Razorpay integration yet |
| Real-time | `fastapi-socketio` is installed but **disabled** in code (`socketio_server.py`) — no live WebSocket events currently fire |
| Background jobs | No Celery/Redis usage in code, despite `docker-compose.yml` provisioning a `redis` service |
| Containerization | Docker + `docker-compose.yml` (backend + Postgres + Redis) |

> **Bottom line:** the actual stack that is wired up and working end-to-end is **Next.js (frontend) → FastAPI (backend) → SQLite/PostgreSQL (via SQLAlchemy)**. Supabase, the demo API routes, and Redis/Celery/WebSockets are present in the repo but not fully integrated — see [§12](#12-known-gaps-risks--inconsistencies).

## 3. Repository Structure

```
projectConnect/
├── app/                       # Next.js App Router pages + a legacy demo API layer
│   ├── admin/dashboard/       # Admin dashboard UI
│   ├── auth/                  # Login/signup pages (parent, student, builder)
│   ├── builder/               # Builder dashboard + onboarding
│   ├── builders/              # Public builder search/listing page
│   ├── parent/                # Parent dashboard + approvals
│   ├── student/                # Student dashboard + request flow
│   ├── workspace/[id]/         # Unified per-project workspace (sessions, files, escrow)
│   ├── notifications/, refunds/, settings/, demo/, test/
│   └── api/                   # Next.js Route Handlers backed by an in-memory demo store
│       ├── auth/, backend/, children/, families/, parents/
│       ├── payments/, refunds/, storage/, uploads/
├── backend/                    # FastAPI application (the primary backend)
│   ├── app/
│   │   ├── main.py             # App entrypoint, router registration, CORS
│   │   ├── models/              # SQLAlchemy models (families, parents, children,
│   │   │                        #   builders, services, project_requests, approvals,
│   │   │                        #   sessions, escrow, files, reviews, subscriptions,
│   │   │                        #   payments, notifications)
│   │   ├── routes/              # families, parents, children, builders, subscriptions,
│   │   │                        #   payments, notifications, dashboards, workspaces,
│   │   │                        #   escrow, files, reviews, analytics, auth
│   │   ├── services/            # db.py (engine/session), payment_service.py
│   │   │                        #   (row-locking + idempotency), payment_gateway.py,
│   │   │                        #   notification_service.py, socketio_server.py (disabled)
│   │   └── workers/              # expiry_checker.py (standalone script, not scheduled)
│   ├── alembic/                 # DB migrations (partial — see §12)
│   ├── tests/                   # pytest test suite
│   ├── seed.py, create_db.py    # DB bootstrap/seed scripts
│   └── Dockerfile
├── components/                  # Shared React components + shadcn/ui primitives
├── hooks/                        # use-mobile, use-toast
├── lib/
│   ├── api-client.ts             # Typed fetch wrapper for the FastAPI backend (partially used)
│   ├── auth-context.tsx           # Supabase-backed AuthProvider
│   ├── demo-data.ts, demo-store.ts # In-memory mock data for the legacy /api routes
│   └── supabase/                 # Supabase browser/server clients
├── scripts/sql/                   # Independent Supabase Postgres schema + RLS policies + seed
├── middleware.ts                 # Currently a no-op (auth check disabled for demo purposes)
├── docker-compose.yml             # backend + Postgres + Redis
├── package.json                   # Frontend dependencies (Next.js 15, React 18)
└── *.pdf, *.txt                   # Original design/brainstorm documents (see §11)
```

## 4. Architecture — How the Pieces Actually Connect

```
Browser (Next.js pages under app/parent, app/builder, app/student, app/workspace)
        │
        │  fetch('http://localhost:8000/...')  — hardcoded, not using NEXT_PUBLIC_API_URL
        ▼
FastAPI backend (backend/app/main.py)
        │
        ▼
SQLAlchemy ORM ──► PostgreSQL (docker-compose) or SQLite (local dev / test.db)
```

Two things run in parallel but are **not** part of this main flow:

- **`app/api/*` (Next.js Route Handlers)** talk only to an in-memory `demoStore` — this looks like an earlier v0-generated prototype/demo layer. It is not called by the main dashboard pages, and any data written to it disappears on server restart.
- **`scripts/sql/*.sql`** define a completely separate Supabase/Postgres schema (RLS-secured, UUID keys, tables named `projects`/`requests`) intended for direct `supabase-js` access from the frontend. This does not match the FastAPI/SQLAlchemy schema and doesn't appear to be consumed by any current page.

Authentication is provided end-to-end by **Supabase Auth**, but `middleware.ts` currently short-circuits all route protection, and every dashboard page fetches backend data using **hardcoded demo identifiers** (e.g. `parent@demo.com`, `child_id=1`) instead of the logged-in user's identity.

## 5. Setup From Scratch

### 5.1 Prerequisites

- Node.js 18+ and a package manager (`npm`, `pnpm`, or `yarn` — both `package-lock.json` and `pnpm-lock.yaml` exist in this repo, pick one)
- Python 3.13
- Docker + Docker Compose (recommended for Postgres/Redis) — or a local PostgreSQL 15 instance
- A Supabase project (only required if you want working auth/storage — the app runs without it for backend-only development)

### 5.2 Clone

```bash
git clone https://github.com/mallanagoudagp/projectConnect.git
cd projectConnect
```

### 5.3 Backend Setup (FastAPI)

There is no `requirements.txt` in this repo — dependencies are currently installed inline in the `Dockerfile`. For local (non-Docker) development, install them manually:

```bash
cd backend
python -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows

pip install fastapi uvicorn sqlalchemy alembic fastapi-socketio pytest httpx psycopg2-binary PyJWT
```

> ⚠️ `PyJWT` is imported by `app/routes/auth.py` (`import jwt`) but is **not** listed in the Dockerfile's install command — add it manually or the container build will fail at import time. See [§12](#12-known-gaps-risks--inconsistencies).

Set the database URL (defaults to a local Postgres if unset):

```bash
# macOS/Linux
export DATABASE_URL="sqlite:///./test.db"     # quick local dev, no Postgres needed
# or, to match docker-compose:
export DATABASE_URL="postgresql://user:password@localhost:5432/buildtrack"
```

Create and seed the database:

```bash
python create_db.py     # creates all tables from the SQLAlchemy models
python seed.py           # drops + recreates tables and inserts demo Family/Parent/Child/Builder data
```

Run the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Confirm it's up:

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### 5.4 Frontend Setup (Next.js)

```bash
cd ..   # back to repo root
npm install      # or pnpm install
```

Create a `.env.local` (none is checked into the repo — create one yourself):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

> Note: most dashboard pages currently call `http://localhost:8000` directly rather than reading `NEXT_PUBLIC_API_URL`, so changing this variable alone will not repoint them — see [§12](#12-known-gaps-risks--inconsistencies).

Run the frontend:

```bash
npm run dev
```

Visit `http://localhost:3000`.

### 5.5 Docker Compose (Backend + Postgres + Redis)

```bash
docker compose up --build
```

This brings up:
- `backend` on port `8000`
- `db` (Postgres 15) on port `5432`
- `redis` on port `6379` (provisioned but currently unused by the application code)

You still need to run the Next.js frontend separately with `npm run dev` — it is not containerized in `docker-compose.yml`.

## 6. Running the App

1. Start the backend (`uvicorn` or `docker compose up`).
2. Run `python seed.py` once to populate demo data (Demo Family / Parent / Child / Builder).
3. Start the frontend (`npm run dev`).
4. Because `middleware.ts` currently disables auth checks, you can navigate directly to:
   - `/parent/dashboard`
   - `/builder/dashboard`
   - `/student/dashboard`
   - `/builders` (public builder search)
   - `/workspace/[id]` (a project's unified workspace, once a `project_requests` row exists)
   - `/admin/dashboard`

## 7. Backend API Reference

All routes are served from `http://localhost:8000` (no `/api/v1` version prefix is currently used, unlike the PRD's recommendation).

| Resource | Method | Path | Purpose |
|---|---|---|---|
| Health | GET | `/health` | Liveness check |
| Auth | POST | `/auth/login`, `/auth/signup` | Issues a JWT (separate from Supabase auth) |
| Auth | GET | `/auth/verify` | Verifies a JWT |
| Families | POST/GET | `/families`, `/families/{id}` | Create/fetch a family |
| Parents | POST/GET | `/parents`, `/parents/{id}` | Create/fetch a parent |
| Children | POST/GET | `/children`, `/children/{id}` | Create/fetch a child |
| Builders | GET | `/builders`, `/builders/pending` | List verified / pending builders |
| Builders | POST | `/builders/onboard` | Builder submits profile + one service |
| Builders | POST | `/builders/{id}/verify` | Admin verifies a builder |
| Builders | GET | `/builders/{id}/analytics` | Earnings, avg rating, recent reviews |
| Dashboards | GET | `/dashboards/parent`, `/dashboards/child`, `/dashboards/builder` | Role dashboard data (by email/id, not by session) |
| Subscriptions | POST | `/parents/{parent_id}/subscriptions/{id}/approve` | Row-locked approval (double-payment prevention) |
| Payments | POST | `/payments/create`, `/payments/confirm`, `/payments/{id}/approve`, `/payments/{id}/refund` | Idempotency-key based payment lifecycle |
| Escrow | POST | `/escrow/{project_id}/fund` | Parent pays; funds held in escrow |
| Escrow | POST | `/escrow/{project_id}/release` | Releases funds to builder once progress = 100% |
| Workspaces | GET | `/workspaces/{project_id}` | Unified state: service, builder, student, sessions, files, escrow |
| Workspaces | POST | `/workspaces/{project_id}/sessions` | Builder proposes a session |
| Workspaces | PUT | `/workspaces/{project_id}/sessions/{id}/approve` | Approve a proposed session |
| Workspaces | PUT | `/workspaces/{project_id}/progress` | Update progress (0–100) |
| Files | POST/GET | `/workspaces/{project_id}/files` | Attach/list file records (URL only, no actual upload handling server-side) |
| Reviews | POST | `/reviews` | Submit a review for a completed project |
| Notifications | POST/GET | `/families/{id}/notifications` | Create/list notifications (no real-time push — socket layer is disabled) |

Interactive Swagger docs are auto-generated by FastAPI at `http://localhost:8000/docs` once the server is running.

## 8. Database Schema (Current)

This reflects `backend/app/models/*.py` — the schema actually used by the FastAPI backend (distinct from the Supabase SQL schema in `scripts/sql/`, see §12).

| Table | Key Columns | Notes |
|---|---|---|
| `families` | id, name | |
| `parents` | id, family_id (FK), name, email (unique) | |
| `children` | id, family_id (FK), name, grade, age, avatar | |
| `builders` | id, user_id, name, email (unique), verification_status, rating_avg, blurb, categories (JSON string), portfolio (JSON string) | |
| `services` | id, builder_id (FK), type, price, category | |
| `project_requests` | id, child_id (FK), service_id (FK), status, progress, created_at | |
| `approvals` | id, request_id (FK, unique), parent_id (FK), status, locked_at | One approval per request — enforces the single-lock rule |
| `sessions` | id, project_request_id (FK), topic, scheduled_at, duration_minutes, meeting_link, status | |
| `escrow_payments` | id, project_request_id (FK, unique), amount, status, created_at, released_at | |
| `file_attachments` | id, project_request_id (FK), uploader_role, file_name, file_url, created_at | |
| `reviews` | id, project_request_id (FK), parent_id (FK), builder_id (FK), rating, comment, created_at | |
| `subscriptions` | id, parent_id, status, payment_status | Generic payment-lock subscription record (not the builder visibility-tier subscription from the PRD) |
| `payments` | id, subscription_id (FK), amount, status, gateway_id, idempotency_key (indexed) | |
| `notifications` | id, family_id, type, message, data (JSON) | |

**Migrations vs. models:** Alembic (`backend/alembic/versions/`) only has migrations for `families`, `parents`, `children`, `subscriptions`, `payments`, and `notifications`, plus a follow-up migration adding `idempotency_key`. There are **no migrations** for `builders`, `services`, `project_requests`, `approvals`, `sessions`, `escrow_payments`, `file_attachments`, or `reviews` — those tables are only created via `Base.metadata.create_all()` in `create_db.py`/`seed.py`, not via Alembic. Anyone setting up a fresh Postgres database with `alembic upgrade head` alone will be missing most of the schema.

## 9. Feature Walkthrough

What's implemented and working end-to-end via the FastAPI backend + corresponding Next.js pages:

- ✅ Builder onboarding + admin verification (`/builder/onboarding`, `/builders/pending`, `/builders/{id}/verify`)
- ✅ Public builder search/listing (`/builders`)
- ✅ Parent dashboard showing active + pending projects per family (`/dashboards/parent`)
- ✅ Child dashboard scoped to a single child's projects (`/dashboards/child`)
- ✅ Builder dashboard with assigned projects + analytics (earnings, rating, reviews)
- ✅ Escrow-based payment flow: fund → hold → release-on-completion (`/escrow/*`)
- ✅ Row-locked, idempotency-key-protected payment approval/refund (`payment_service.py`)
- ✅ Session proposal/approval flow and progress tracking inside a unified project "workspace" page
- ✅ File attachment records per project
- ✅ Post-completion review submission, gated on project status
- ✅ Admin dashboard UI (front-end shell)

Present in the UI/routes but **not functionally wired up**:

- ⚠️ Real-time notifications (Socket.IO code exists but is explicitly disabled)
- ⚠️ Session-based auth on dashboards (Supabase login works, but dashboard data fetches ignore the logged-in user and use hardcoded demo identifiers)
- ⚠️ The `/api/*` Next.js routes (subscriptions, uploads, refunds) — functional against the demo store, but disconnected from the FastAPI/Postgres data the rest of the app uses
- ⚠️ Real payment gateway integration (currently fully mocked)
- ⚠️ File uploads to real storage (S3/Supabase Storage plumbing exists — `storage/ensure-bucket`, `uploads/presign` — but isn't connected to the FastAPI `file_attachments` table)

## 10. Testing

Backend tests live in `backend/tests/` (pytest, using FastAPI's `TestClient` against the configured `DATABASE_URL`):

```bash
cd backend
pytest
```

Root-level ad hoc scripts (`test_basic.py`, `test_api_endpoints.py`, `test_complete_workflow.py`, `test_postgres_direct.py`, `simple_test.py`, `manual_race_test.py`) are manual/exploratory scripts rather than an automated suite — run individually with `python <script>.py` if needed. `manual_race_test.py` in particular appears to exercise the concurrent double-payment scenario manually.

No frontend test suite (Jest/Playwright/Cypress) currently exists.

## 11. PRD/SRS Compliance Check

Comparing this repository against the BuildTrack PRD/SRS document (`BuildTrack_PRD_SRS.docx`):

| PRD Area | Status | Notes |
|---|---|---|
| Parent / Child / Builder / Admin roles | 🟡 Partial | Models and dashboards exist for all four; RBAC/session-based enforcement is not implemented — anyone can hit any dashboard endpoint with any identifier |
| Dual-parent approval locking | 🟡 Partial | `Approval` model supports a single lock per request; the subscription-approval route uses `with_for_update()` row locking as designed, but there's no UI simulating two parents racing to approve |
| Double-payment prevention (row locks + idempotency keys) | ✅ Implemented | `payment_service.py` matches the PRD's design closely: `SELECT ... FOR UPDATE`, idempotency key check, transactional commit |
| Escrow / payment holding | ✅ Implemented (mocked gateway) | Not in the original PRD by this name, but implements the same "payment locked until completion" business rule using an escrow abstraction |
| Refund policy (self-serve pre-work, admin-approved post-work) | ❌ Not implemented | No refund endpoint enforces the "only before work starts" rule; the only refund-related code is the disconnected demo `/api/refunds` route, which just returns a mock success message |
| Builder search, filters, comparison | 🟡 Partial | Basic list/search of verified builders exists; category/price/rating filter UI and side-by-side comparison are not implemented server-side |
| Reviews & ratings | ✅ Implemented | Verified-review constraint (project must be completed, one review per project) matches the PRD |
| Real-time notifications (WebSockets) | ❌ Not implemented | Notification records are created and stored, but Socket.IO emission is explicitly disabled in code |
| Ready Project Marketplace | ❌ Not implemented | No marketplace-specific model/route exists; only the guided-learning `services` table is present |
| Subscription plans (Free/Standard/Premium) for builders | ❌ Not implemented | The `subscriptions` table in this codebase is a generic payment-lock record tied to a parent, not a builder visibility-tier plan as described in the PRD |
| Scheduling (parent-controlled availability, builder proposes) | 🟡 Partial | Builders can propose sessions and someone can "approve" them; there's no explicit parent-availability-window model constraining what a builder can propose |
| Media upload via S3 with presigned URLs | 🟡 Partial | Presign/upload endpoints exist only in the disconnected demo `/api` layer using local demo storage, not S3, and aren't linked to the FastAPI `file_attachments` table |
| Database design (normalized, FKs, indexes) | 🟡 Partial | Table/relationship shape closely follows the PRD's ER overview; UUID PKs, soft-deletes, and full indexing described in the PRD are not present (integer PKs, no `deleted_at` columns) |
| Backend stack (FastAPI, PostgreSQL, Redis, Celery, S3) | 🟡 Partial | FastAPI + PostgreSQL/SQLAlchemy match; Redis, Celery, and S3 are provisioned/mentioned but not used in code |
| Frontend stack (Next.js, Tailwind, shadcn/ui) | ✅ Implemented | Matches the PRD closely |
| Security (JWT, RBAC, rate limiting, audit logs) | ❌ Largely not implemented | A JWT is issued/verified in `auth.py`, but no route actually requires or checks it; no RBAC middleware, rate limiting, or audit logging exists anywhere in the codebase |
| API versioning (`/api/v1`) | ❌ Not implemented | Routes are unversioned |

**Overall:** the core transactional backbone the PRD emphasizes most — role modeling, request → approval → payment → session → progress → review lifecycle, and double-payment-safe transaction handling — is implemented and functionally close to the design. The parts of the PRD that are largely missing are: security/RBAC enforcement, real-time delivery, the marketplace, builder subscription tiers, and refund policy enforcement.

## 12. Known Gaps, Risks & Inconsistencies

Things worth fixing before this goes further:

1. **Three parallel data layers.** The FastAPI/SQLAlchemy backend, the Next.js `/api` demo-store routes, and the Supabase SQL schema in `scripts/sql/` each define an independent (and mutually incompatible) view of the data model. Pick one source of truth — the FastAPI/Postgres layer is the most complete — and remove or clearly quarantine the other two.
2. **Auth is effectively disabled.** `middleware.ts` no-ops all route protection, and dashboard pages fetch data using hardcoded demo emails/IDs rather than the authenticated Supabase session. Anyone can currently view any dashboard.
3. **Missing `requirements.txt`.** Backend dependencies are only declared inline in the `Dockerfile`, and `PyJWT` is used in code but not installed there — a fresh Docker build will fail on `import jwt`.
4. **Incomplete Alembic history.** Running `alembic upgrade head` on a brand-new database will not create `builders`, `services`, `project_requests`, `approvals`, `sessions`, `escrow_payments`, `file_attachments`, or `reviews` — those only get created by directly calling `Base.metadata.create_all()`.
5. **Hardcoded backend URLs.** Frontend pages call `http://localhost:8000` directly instead of using the `NEXT_PUBLIC_API_URL` env var already defined in `lib/api-client.ts`, so pointing the frontend at a deployed backend requires a code change, not just an env var change.
6. **No `.env.example`.** Supabase and backend URL environment variables are required but undocumented in the repo; anyone cloning fresh has to reverse-engineer them from source.
7. **Socket.IO is present but inert.** `fastapi-socketio` is installed and imported, but `init_socket()` is a no-op — no real-time behavior currently exists despite the frontend/PRD both assuming it.
8. **Redis and Celery are provisioned, unused.** `docker-compose.yml` runs a Redis container and the PRD calls for Celery workers, but no code in the repo uses either.
9. **Mocked payments only.** All payment/escrow flows go through `MockPaymentGateway`, which always succeeds — no real Stripe/Razorpay integration exists yet.
10. **Package manager ambiguity.** Both `package-lock.json` and `pnpm-lock.yaml` are committed; pick one and remove the other to avoid dependency drift.

## 13. Suggested Next Steps

1. Consolidate on the FastAPI + PostgreSQL data model; delete or clearly label the demo `/api` routes and the Supabase SQL schema as legacy/unused.
2. Wire dashboard pages to use the authenticated Supabase session (via `useAuth()`) instead of hardcoded demo identifiers, and re-enable `middleware.ts` route protection.
3. Add a `backend/requirements.txt` (including `PyJWT`) and generate the missing Alembic migrations for all current SQLAlchemy models.
4. Add a `.env.example` at the repo root documenting every required environment variable.
5. Implement the refund policy (pre-work self-serve vs. post-work admin approval) as a real endpoint.
6. Either finish the Socket.IO integration for real-time notifications or remove the dependency and mark notifications as poll-based in documentation.
7. Replace hardcoded `http://localhost:8000` calls with `process.env.NEXT_PUBLIC_API_URL`.
8. Decide whether the Ready Project Marketplace and builder subscription tiers are in scope for the current milestone; if so, add the corresponding models/routes — they don't exist yet.
