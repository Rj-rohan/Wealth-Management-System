# Wealth Management System

A wealth management platform covering the full advisory lifecycle: onboarding and
wealth discovery, a Wealth Health Score, goal funding and retirement planning,
portfolio analytics, Buffett-methodology equity research, live market
intelligence, and two AI advisors.

```
├── backend/     Express + TypeScript + Prisma  → PostgreSQL (pgvector)
├── frontend/    React 18 + Vite + TypeScript + React Router + Tailwind
├── docs/        Architecture, specifications and the merge record
└── scripts/     RAG knowledge-base build pipeline
```

---

## Quick start

```bash
npm install
```

Create the two env files from the template — see [`.env.example`](.env.example),
which documents every variable and what breaks without it:

```bash
cp .env.example backend/.env    # then trim to the [BACKEND] section
cp .env.example frontend/.env   # then trim to the [FRONTEND] section
```

At minimum the backend needs `DATABASE_URL`, `DIRECT_URL` and `JWT_SECRET`.

Apply the schema and seed demo data:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Run both services (API on :3001, web on :5173):

```bash
npm run dev
```

Open http://localhost:5173 and sign in with `client@wms.demo` / `demo1234`.

### Other commands

| Command | Does |
| --- | --- |
| `npm run build` | Type-checks and builds backend then frontend |
| `npm test` | Runs the calculation-engine test suite (87 tests) |
| `npm run db:studio` | Opens Prisma Studio against the configured database |
| `npm run dev:api` / `npm run dev:web` | Runs one service on its own |

---

## Database

PostgreSQL 15+ **with the `pgvector` extension** — required by the RAG knowledge
base, which stores 768-dimension embeddings in `vector` columns.

**Supabase** (recommended): create a project, then run once in the SQL editor:

```sql
create extension if not exists vector;
```

Use the pooled connection string (port 6543) for `DATABASE_URL` and the direct
connection (port 5432) for `DIRECT_URL` — Prisma Migrate cannot run through the
transaction pooler.

**Local Docker** alternative:

```bash
docker compose up -d
```

---

## Architecture

**One API, two surfaces, one session.** The Express service exposes
`/api/v1/*` for account-scoped wealth planning and `/api/*` for the market
intelligence modules. A single JWT issued at sign-in authorises everything;
every `/users/:userId` route is guarded by `requireAuth` + `requireSelf`.

**Frontend** is a single-page React app. `AppShell` provides the sidebar, top
bar, currency selector and account menu for every screen. Vite proxies `/api`
to the backend in development.

**Layering (backend)** — routes → controllers → services → repositories. No
business logic in controllers; no data access in services outside repositories.
Financial mathematics lives in `backend/src/calculations/` and is covered by
tests.

### Feature map

| Area | Route | What it does |
| --- | --- | --- |
| Onboarding | `/onboarding` | 9-step wealth discovery → Financial Snapshot + investor type |
| Dashboard | `/dashboard` | Investor snapshot, Wealth Health Score, 7-pillar breakdown, net worth, goal progress, priority actions, tool launcher |
| Portfolio | `/portfolio` | **Analytics**: valuation, performance, allocation, rebalancing · **Equity Tracker**: positions, P&L, budget-aware suggestions |
| Planning | `/planning/goals` | Goal funding, Edelman Solver options, AI goal & retirement coaching |
| Research | `/research/screener` | Buffett 100-point stock screener |
| | `/research/equity` | Sector deep-dives |
| | `/research/letters` | Shareholder-letter lessons, filtered by investor type |
| | `/research/methodology` | The 6 principles, scoring formula, company assessment |
| | `/research/watchlist` | Assessed companies |
| Markets | `/markets/pulse` | Live quotes and market news |
| | `/markets/risk` | Portfolio stress testing |
| | `/markets/treasury` | Cash-flow forecast, shortfall alerts, FD ladder |
| | `/markets/branches` | Branch cash-health map |
| | `/markets/reports` | AI-written reports with PDF export |
| Advisory | `/ai-cfo` | Markets-desk AI assistant (streaming) |
| | floating widget | Wealth advisor, grounded in the RAG knowledge base |
| Settings | `/settings/investing-style` | Edit investor type inputs |

---

## Optional integrations

Every one of these degrades gracefully — the platform runs without any of them.

| Variable | Powers | Without it |
| --- | --- | --- |
| `GEMINI_API_KEY` | RAG advisor, goal coach, recommendation explanations | Those AI features are unavailable; everything else works |
| `GROQ_API_KEY` | AI CFO, risk narratives, treasury narrative, report writing | Screens fall back to built-in deterministic analysis |
| `SERPER_API_KEY` | Live quotes, market news, report benchmarks | A curated reference dataset is served instead |
| `VITE_GOOGLE_MAPS_API_KEY` | Branch Intelligence map | Branch metrics still render; the map is replaced by a notice |

---

## Merge record

This repository consolidates two codebases built by two teams. The full record —
feature inventory, conflict resolutions, database and API changes, and what was
verified — is in [`docs/MERGE_RECORD.md`](docs/MERGE_RECORD.md).

---

## Disclaimer

Advisory simulation only. Not financial advice.
