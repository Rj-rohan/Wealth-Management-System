# SYSTEM ARCHITECTURE
## Personal Wealth Management Module
**Version:** 1.0  
**Status:** Approved  
**Author:** Principal Software Architect  
**Date:** June 2026  

---

## 1. Multi-Tier Architecture Overview

The Weallth platform is built on an API-first, cloud-native microservices architecture. The **Personal Wealth Management (PWM) Module** functions as the central orchestrator, consuming data from low-level services (like the Investment Management portfolio sync) and exposing endpoints to client-facing portals.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: PRESENTATION                            │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐ │
│  │   Advisor Workbench Portal    │   │      Client Web & Mobile      │ │
│  │   (React + TypeScript)        │   │   (React Native & Web App)    │ │
│  └───────────────┬───────────────┘   └───────────────┬───────────────┘ │
└──────────────────┼───────────────────────────────────┼─────────────────┘
                   │                                   │
┌──────────────────┼───────────────────────────────────┼─────────────────┐
│                  ▼                                   ▼                 │
│                        TIER 2: GATEWAY & ROUTING                       │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     API Gateway (Kong / AWS Gateway)              │ │
│  │    [Auth/MFA Routing]  [Rate Limiting]  [WAF Network Security]    │ │
│  └───────────────────────────────────┬───────────────────────────────┘ │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼─────────────────────────────────┐
│                                      ▼                                 │
│                        TIER 3: CORE APPLICATION LOGIC                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                Personal Wealth Management Service                 │ │
│  │  ┌────────────────────────┐  ┌─────────────────────────────────┐  │ │
│  │  │   Calculation Engine   │  │   Recommendation Rule Engine    │  │ │
│  │  └────────────────────────┘  └─────────────────────────────────┘  │ │
│  │  ┌────────────────────────┐  ┌─────────────────────────────────┐  │ │
│  │  │  WHS Scoring Algorithm │  │    AI Wealth Advisor / Coach    │  │ │
│  │  └────────────────────────┘  └─────────────────────────────────┘  │ │
│  └──────┬──────────────────────┬──────────────────────┬──────────────┘ │
│         │                      │                      │                │
│         ▼                      ▼                      ▼                │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │  Investment  │       │  Retirement  │       │  Insurance   │        │
│  │  Mgmt Service│       │ Planning Serv│       │ Planning Serv│        │
│  └──────────────┘       └──────────────┘       └──────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼─────────────────────────────────┐
│                                      ▼                                 │
│                        TIER 4: DATABASE & STORAGE                      │
│  ┌────────────────────────┐  ┌───────────────────┐  ┌────────────────┐ │
│  │ PostgreSQL / Supabase  │  │  Redis Cache      │  │ AWS S3 Bucket  │ │
│  │ (Relational Data & RLS)│  │ (Session & Scores)│  │ (Report PDFs)  │ │
│  └────────────────────────┘  └───────────────────┘  └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Module Interactions

The Personal Wealth Management module acts as the user's dashboard entry point and integrates with other domains as follows:

1. **Investment Management Module Integration:**
   - **Data Pulled:** Linked accounts, cash balances, asset positions, and model portfolio allocation drift alerts.
   - **Data Pushed:** Target allocation overrides defined during client goal-setting.
2. **Retirement Planning Module Integration:**
   - **Data Pulled:** Multi-scenario projection calculations and withdrawal sequence recommendations.
   - **Data Pushed:** Current asset earmarks and monthly savings rates.
3. **Risk Management & Insurance Module Integration:**
   - **Data Pulled:** Coverage gaps and policy details.
   - **Data Pushed:** Client net income and dependent status.
4. **AI Coach / Explainer Service Integration:**
   - **Data Pulled:** Generated natural language summaries for retirement shortfalls and recommendations.
   - **Data Pushed:** Context payloads (goals, net worth, gaps, specific recommendations).

---

## 3. Folder Structures

### 3.1 Backend Folder Structure (Node.js/TypeScript Microservice)

```
personal-wealth-management-service/
├── config/                  # DB connection pool, Supabase client configurations
├── src/
│   ├── api/                 # Express controllers, routing, Swagger documentation
│   │   ├── controllers/     # Route controller endpoints (goals, net worth, WHS)
│   │   ├── middlewares/     # Authentication, compliance, audit-logger, rate limiters
│   │   └── routes/          # Express routing files mapped to OpenAPI spec
│   ├── calculations/        # Compounding, inflation, and gap math implementations
│   ├── database/            # Database assets
│   │   ├── migrations/      # SQL schema delta migration scripts
│   │   ├── models/          # ORM models (Prisma or TypeORM)
│   │   └── seeds/           # Representative data inserts for testing
│   ├── integration/         # API connectors to other cluster microservices
│   │   ├── investment.ts    # Fetch holdings and drift alerts
│   │   ├── retirement.ts    # Fetch projections and withdrawal sequencing
│   │   └── insurance.ts     # Fetch coverage gaps
│   ├── services/            # Core business logic implementations
│   │   ├── scoring.ts       # Wealth Health Score algorithm
│   │   └── rule_engine.ts   # Recommendation generator
│   ├── types/               # Type definition files
│   └── app.ts               # Express application entry point
├── tests/
│   ├── unit/                # Unit tests for scoring, calculations, and rules
│   ├── integration/         # Mocked server routes and database queries
│   └── e2e/                 # Complete user journey tests
├── Dockerfile               # Production container definition
└── package.json             # Service dependencies and startup scripts
```

### 3.2 Frontend Folder Structure (React & TypeScript Web Application)

```
weallth-frontend-pwm/
├── public/                  # Logo, icons, static web assets
├── src/
│   ├── assets/              # CSS tokens, HSL typography configurations
│   ├── components/          # Reusable shared UI widgets
│   │   ├── charts/          # Allocation pie-charts, Net Worth trend lines
│   │   ├── coach/           # AI dialog widgets and floating advice panels
│   │   └── score/           # Wealth Health Score meters and breakdown tables
│   ├── context/             # Global states (Client vs Advisor mode, Linked Accounts)
│   ├── hooks/               # Custom hooks (useGoals, useNetWorth, useWHS)
│   ├── pages/               # Screen layout assemblies
│   │   ├── Dashboard/       # Client main dashboard screen
│   │   ├── Goals/           # Goal worksheets and "What-If" sliders
│   │   ├── Advisor/         # Household tracker and client overview workbench
│   │   └── Settings/        # Linked accounts and notification preferences
│   ├── services/            # API client fetch configurations
│   ├── types/               # Typing structures matching API contracts
│   └── App.tsx              # React app entry point and routing config
└── package.json             # Frontend dependency package
```

---

## 4. Key Architectural Decisions

### 4.1 Row-Level Security (RLS) on Supabase
- **Decision:** Implement strict RLS rules in PostgreSQL where a client can only read/write row items where `user_id = auth.uid()`.
- **Reason:** Wealth data is extremely sensitive. Preventing data leakage at the database layer is critical. Advisors are granted explicit access through an authorization join table `advisor_client_consent`, verified via custom DB helper functions.

### 4.2 Decoupled Recommendation Engine
- **Decision:** Execute WHS and Recommendation generation asynchronously via worker processes or triggers rather than synchronously on every dashboard API call.
- **Reason:** Heavy mathematical recalculations (such as portfolio drift combined with Monte Carlo retirement scenarios) would exceed the 200ms latency requirement if ran inline. Daily cron recalculations combined with event-driven queue updates ensure sub-10ms fetch latencies.
