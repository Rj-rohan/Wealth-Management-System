# Merge Record

This repository is the consolidation of two codebases developed in parallel by
two teams on the same product:

| | Source | Stack |
| --- | --- | --- |
| **Team A** — wealth planning | `AbhayBhise/Personal-Wealth-Management-Module--Weallth` | React 18 + Vite SPA · Express + TypeScript · Prisma → PostgreSQL/pgvector |
| **Team B** — research & markets | `Rj-rohan/Wealth-Management-System` | Next.js 16 App Router (JavaScript) · route handlers · no database |

Neither was treated as the base into which the other was copied. Team A's
service layer and database were kept because they were the deeper asset; Team
B's screens and API handlers were ported onto that architecture rather than run
beside it.

---

## 1. Final architecture

```
wealth-management-system/
├── package.json                 npm workspaces + concurrently
├── .env.example                 every variable, both services
├── docker-compose.yml           local pgvector Postgres (Supabase is the default target)
│
├── backend/                     Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma        + InvestorProfile, TrackerHolding, WatchlistItem
│   │   ├── migrations/          + 20260815120000_markets_workspace
│   │   └── seed.ts
│   └── src/
│       ├── index.ts             mounts /api/v1 and /api
│       ├── middleware/auth.ts   NEW — requireAuth, requireSelf
│       ├── routes/
│       │   ├── index.ts         wealth planning (guarded)
│       │   └── markets.ts       NEW — ported Team B handlers
│       ├── controllers/         + investor profile, tracker, watchlist
│       ├── services/
│       │   ├── index.ts         wealth planning services (unchanged)
│       │   ├── investor.ts      NEW — classification + persistence
│       │   ├── market.ts        NEW — quotes, news
│       │   ├── risk.ts          NEW — stress testing
│       │   ├── treasury.ts      NEW — forecast, narrative
│       │   ├── branches.ts      NEW — branch rollup
│       │   ├── reports.ts       NEW — report generation, printable HTML
│       │   ├── aiCfo.ts         NEW — streaming markets assistant
│       │   ├── llm/fastLlm.ts   NEW — one fast-LLM client for both teams
│       │   └── rag/             Team A RAG engine (unchanged)
│       ├── repositories/
│       │   ├── prisma.ts        NEW — shared client singleton
│       │   └── index.ts         unchanged apart from using the singleton
│       └── calculations/        financial engine + 87 tests (unchanged)
│
└── frontend/                    React 18 + Vite + React Router + Tailwind v4
    └── src/
        ├── App.tsx              one router, five areas, legacy redirects
        ├── index.css            unified design tokens
        ├── context/             InvestorProfileContext (replaces Team B's UserContext)
        ├── services/api.ts      apiFetch/apiJson — single API client
        ├── store/useAppStore.ts session, dashboard, portfolio, chat, shell state
        ├── components/          both teams' components + AppShell, panels
        ├── pages/               13 screens
        └── data/                Buffett stock dataset + scoring
```

**One API, two surfaces, one session.** `/api/v1/*` serves account-scoped wealth
planning; `/api/*` serves the market modules. A single JWT authorises both.

---

## 2. Feature matrix

Every feature below is present in the merged application.

| Feature | Team A | Team B | Resolution |
| --- | :---: | :---: | --- |
| Registration / login / session | ✓ | – | Preserved, and now actually enforced (§6) |
| Investor-type classification | – | ✓ | Moved server-side, persisted per account |
| Wealth discovery onboarding | ✓ | ✓ | **Combined** into one 9-step wizard (§5) |
| Financial Snapshot | ✓ | – | Preserved |
| Wealth Health Score + 7 pillars | ✓ | – | Preserved |
| Net worth history | ✓ | – | Preserved |
| Dashboard | ✓ | ✓ | **Combined** into one page (§5) |
| Tool launcher grid | – | ✓ | Preserved as a dashboard section |
| Portfolio valuation / performance / allocation / rebalancing | ✓ | – | Preserved, moved to `/portfolio` |
| Equity tracker: positions, P&L, suggestions | – | ✓ | Preserved as second Portfolio tab, moved to the database |
| Goals: CRUD, shortfall, Edelman Solver | ✓ | – | Preserved |
| Recommendations + AI explanations | ✓ | – | Preserved |
| AI wealth advisor (RAG, pgvector) | ✓ | – | Preserved in full |
| AI goal coach / retirement coach | ✓ | – | Preserved |
| Currency preference | ✓ | – | Preserved, in the shared top bar |
| Advisor client list, assumptions, compliance log | ✓ | – | Preserved |
| Buffett stock screener | – | ✓ | Preserved |
| Buffett methodology + company assessment | – | ✓ | Preserved |
| Watchlist | – | ✓ | Preserved, moved to the database |
| Equity research (sectors) | – | ✓ | Preserved |
| Shareholder letters | – | ✓ | Preserved |
| Market pulse (quotes + news) | – | ✓ | Preserved |
| Risk radar (stress tests) | – | ✓ | Preserved |
| Treasury autopilot | – | ✓ | Preserved |
| Branch intelligence | – | ✓ | Preserved |
| Smart reports + PDF export | – | ✓ | Preserved (PDF export now actually works, §9) |
| AI CFO (streaming) | – | ✓ | Preserved |
| Calculation engine (87 tests) | ✓ | – | Preserved, untouched, still passing |

Nothing was dropped.

---

## 3. Database changes

Team B had no database. Three tables were added to Team A's schema; **no
existing model, field, relation or migration was modified**.

| Table | Purpose |
| --- | --- |
| `investor_profiles` | Investing-style answers plus the derived classification (type, allocation targets, max P/E, min dividend yield). One row per user. |
| `tracker_holdings` | Self-entered equity positions for the Portfolio Tracker: ticker, quantity, cost basis, mark price. |
| `watchlist_items` | Companies scored with the Buffett methodology: name, score, rating, assessment date. |

All three are keyed to `users.id` with `ON DELETE CASCADE`, and `users` gained
the three matching back-relations.

Migration: `backend/prisma/migrations/20260815120000_markets_workspace/`.

**`Holding` vs `TrackerHolding` were deliberately not merged.** They look alike
but model different things: `Holding` is a custodian-level asset inside an
`Account`, feeding net worth, allocation and the Wealth Health Score;
`TrackerHolding` is a user-entered equity position with a personal cost basis
used for P&L. Collapsing them would have corrupted net-worth arithmetic.

The datasource also gained `directUrl` so Prisma Migrate can bypass Supabase's
transaction pooler.

---

## 4. API changes

**Added** (all under `/api/v1`, all guarded):

```
GET    /users/:userId/investor-profile
PUT    /users/:userId/investor-profile
DELETE /users/:userId/investor-profile
POST   /investor-profile/classify          preview without persisting
GET    /users/:userId/tracker/holdings
POST   /users/:userId/tracker/holdings
DELETE /users/:userId/tracker/holdings/:holdingId
GET    /users/:userId/watchlist
POST   /users/:userId/watchlist
DELETE /users/:userId/watchlist/:itemId
```

**Ported from Next.js route handlers to Express**, paths kept identical so the
screens' calls did not change:

```
GET  /api/market/quotes            GET  /api/treasury/forecast
GET  /api/market/news              POST /api/treasury/narrative   ← renamed
POST /api/ai-cfo/chat              GET  /api/branches/financial-summary
POST /api/risk/stress-test         POST /api/reports/generate
                                   GET  /api/reports/download
```

**One breaking rename:** `/api/treasury/groq-narrative` → `/api/treasury/narrative`.
The old path named a vendor in the contract; the caller was updated in the same
change. No other endpoint changed shape.

**Unchanged:** every pre-existing `/api/v1` endpoint keeps its path, request and
response shape.

---

## 5. Where overlapping features went

**Dashboard.** Team A's dashboard carried the financial picture; Team B's home
screen carried the investor snapshot and a tool launcher. They now stack on one
page: investor snapshot → Wealth Health Score and financial overview → 7-pillar
breakdown → goals and priority actions → research and market tools. Team A's
dashboard also had a "Portfolio" tab; that content moved to `/portfolio` so
portfolio work lives in one place.

**Portfolio.** Two genuinely different views, kept as two tabs of one page:
*Analytics* (all asset classes, valuation, performance, allocation,
rebalancing) and *Equity Tracker* (self-entered positions, P&L, budget-aware
suggestions).

**Onboarding.** Both teams had a wizard, and they overlapped on age, occupation
and income. Rather than run two, Team B's questionnaire was reduced to the four
questions Team A's wizard did not already ask — goal, risk appetite, horizon,
monthly budget — and added as step 7 of nine, "Investing Style". Age is derived
from the date of birth already collected, and the existing portfolio value from
the accounts already entered. Nothing is asked twice. The step shows the
classification live, and submitting saves the wealth discovery and the investor
profile together.

Accounts that onboarded before this step existed are not stranded:
`/settings/investing-style` presents the same form, and the screens that need a
profile link to it.

**Navigation.** One sidebar in five sections — Overview, Planning, Research,
Markets, Advisory. Old paths from both products (`/goals`, `/buffett-screener`,
`/market-pulse`, …) redirect to their new homes.

**Design language.** One palette: a dark base with a green primary accent and
gold for research surfaces. Team A's CSS variable names were kept as aliases
pointing at the shared tokens, so its screens restyled without markup changes.

**Two AI assistants, kept separate on purpose.** The wealth advisor (floating
widget) answers planning questions grounded in the RAG knowledge base. The AI
CFO (`/ai-cfo`) is a markets-desk assistant over live positions and cash. Same
provider, different context and different retrieval — merging them would have
lost one or the other.

---

## 6. Authentication

Team A already issued a 7-day JWT at sign-in and sent it from the client, but
**no route ever verified it** — any caller could read or modify another user's
data by supplying a different id in the URL. Team B had no authentication at all.

The merge introduces `requireAuth` (verifies the token) and `requireSelf`
(confirms the caller owns the account in the path), applied to every
`/users/:userId` route across both feature sets. Advisors retain access to their
consented clients. Login, registration and the risk questionnaire stay public.

On the client, all API traffic now goes through `apiFetch`, which attaches the
token and signs the user out on a 401. Several screens previously called `fetch`
directly without any header — those would have broken under the new guard and
were converted.

One sign-in covers everything; there is no second login for market features.

---

## 7. Dependencies

Team B's `package.json` declared only `next`, `react` and `react-dom` while its
code imported three packages that were never listed — the app could not have
built as committed:

| Package | Used by | Resolution |
| --- | --- | --- |
| `groq-sdk` | AI CFO, risk, treasury, reports | **Not added.** Team A already reached the same Groq endpoint through the `openai` SDK; the ported services use a shared client (`services/llm/fastLlm.ts`) instead, so the platform has one LLM configuration and one credential. |
| `jspdf` | Smart Reports PDF export | Added — the export silently failed without it. |
| `@react-google-maps/api` | Branch Intelligence map | Added. |

`vitest` was moved from `^4.1.9` to `^2.1.9`: v4 requires Node ≥ 20.19 and the
suite could not start on Node 20.11. No framework was upgraded. Nothing was
removed.

---

## 8. Conflicts encountered and how they were resolved

| Conflict | Resolution |
| --- | --- |
| Two frameworks (Vite SPA vs Next.js App Router) | Consolidated onto the Vite SPA. Team A's Express service, Prisma schema and RAG engine were the larger and harder-to-move asset; Team B's screens were self-contained client components using only `next/link` and `next/navigation`. Porting 13 screens was smaller and safer than porting a database, an auth layer and a retrieval engine. |
| Two API surfaces | Both mounted on one Express process under distinct prefixes, sharing one session and one error contract. Team B's paths were preserved verbatim so screen code did not change. |
| Two dashboards | Combined into one page rather than kept as competing routes (§5). |
| Two portfolio views | Kept as two tabs — they answer different questions (§5). |
| Two onboarding wizards | Merged into one, with Team B's questions reduced to what Team A did not already ask (§5). |
| Two investor-profile stores (localStorage vs database) | Moved to the database, keyed to the account. |
| Classification logic on the client | Moved to the server so screener thresholds and allocation targets have one implementation. A preview endpoint keeps the live feedback in the wizard without duplicating the rules. |
| Two design systems | One token set; Team A's variable names aliased onto it (§5). |
| Two LLM configurations (`GROK_API_KEY` + `openai` SDK vs `GROQ_API_KEY` + `groq-sdk`) | One client, `GROQ_API_KEY` primary with `GROK_API_KEY` honoured as an alias so existing deployments keep working. |
| `Holding` vs `TrackerHolding` | Kept separate — same shape, different meaning (§3). |
| Team B's `styled-jsx` blocks | `<style jsx global>` is Next-only; the attributes were stripped so React stops warning. Styles unchanged. |
| Team B's `process.env.NEXT_PUBLIC_*` in the browser | Converted to Vite's `import.meta.env.VITE_*`. |

---

## 9. Fixes made along the way

Integration surfaced defects that predated the merge; each was fixed rather than
carried over:

- **Unenforced authentication** — see §6. The most serious issue found.
- **Undeclared dependencies** — see §7. Two features (PDF export, branch map) could not have worked as committed.
- **Silent PDF failure** — the export swallowed its error; it now surfaces one.
- **Google Maps error overlay** — with no API key the loader injected Google's own error banner over the page. The loader is no longer mounted without a key, and the page shows a short notice instead. Branch metrics are unaffected either way.
- **Shared Prisma client** — repositories now use one client instance rather than opening a second connection pool, which matters on hosted Postgres where connections are capped.
- **Watchlist date sorting** — sorted by a numeric `Date.now()` id, which is meaningless for database ids; ordering is now done by the server.

No financial calculation was modified. No feature was replaced with a placeholder.

---

## 10. Verification

| Check | Result |
| --- | --- |
| `npm install` (workspaces) | Clean |
| `npm run build` (backend `tsc` + frontend `tsc` + `vite build`) | Passes, no type errors |
| `npm test` — calculation engine | **87/87 passing** |
| `prisma validate` / `prisma generate` | Schema valid, client generated |
| Backend boot, `/health` | OK |
| Markets endpoints — quotes, news, branches, treasury forecast, treasury narrative, stress test, report generate, report download | All 200 with correct payloads |
| Error contracts — unknown scenario, unknown route | 400 / 404 as designed |
| AI CFO streaming | Streams correctly, falls back without a key |
| Auth — no token / bad token | 401 |
| Auth — valid token, other user's data | 403 |
| Auth — valid token, own data | Passes the guard |
| Investor classification | Verified against Team B's original rules (age 29 / high / 10y / wealth → Aggressive Growth, 85/10/5, max P/E 45) |
| Screens loaded in a browser | Dashboard, Portfolio (both tabs), Goals, Screener, Equity Research, Letters, Methodology, Watchlist, Market Pulse, Risk Radar, Treasury, Branches, Reports, AI CFO, Investing Style |
| Interactions exercised | Stress test run end to end (chart, narrative, mitigations); portfolio tab switching; live investor classification in the style form |
| Console | No unhandled errors; no React warnings after the `styled-jsx` cleanup |

### Not verified here

The environment used for the merge had **no PostgreSQL available** (no Docker,
no local server, and Supabase credentials are supplied separately). Everything
that needs a live database was therefore exercised only up to the point where it
reaches the database, and the following need one pass against Supabase:

1. `npm run db:migrate` and `npm run db:seed` against a project with `pgvector` enabled.
2. Sign-in, registration and the 9-step onboarding wizard end to end.
3. Wealth Health Score, net worth, goals, recommendations and portfolio analytics with seeded data.
4. Persistence round-trips for the three new tables — investor profile, tracker holdings, watchlist.
5. The RAG wealth advisor, which additionally needs `GEMINI_API_KEY` and an ingested knowledge base (`npm run rag:ingest` in `backend/`).

The screens' loading, empty and error states were confirmed against a
deliberately unreachable database, so the paths around these calls are exercised
even though the calls themselves are not.
