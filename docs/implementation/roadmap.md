# IMPLEMENTATION ROADMAP
## Personal Wealth Management Phased Rollout Plan
**Version:** 1.0  
**Status:** Approved  
**Author:** Lead Program Manager & Systems Architect  
**Date:** June 2026  

---

## 1. Roadmap Overview

The implementation of the Weallth Personal Wealth Management module spans 4 development phases over a 16-week timeline, following the advisor-led-first delivery patterns observed in enterprise wealth integrations (e.g., HDFC bank/Finacle case studies).

```
Timeline:  W1-4                W5-8                W9-12               W13-16
Phases:    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │ Phase 1:     │───►│ Phase 2:     │───►│ Phase 3:     │───►│ Phase 4:     │
           │ Database &   │    │ Calculations │    │ Rule Engine  │    │ AI Assistant │
           │ CRUD Auth    │    │ & Worksheets │    │ & WHS Scoring│    │ & Refinement │
           └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## 2. Detailed Phases

### Phase 1: Database Foundation, API Shell & Authentication (Weeks 1-4)
Establish the data layer, mapping schemas, identity boundaries, and core CRUD routes.
- **Estimated Effort:** 45 Story Points (SP)
- **Primary Team:** 1 DB Architect, 1 Backend Engineer, 1 QA Engineer
- **Dependencies:** Core Platform Auth Service
- **Milestone Checklist:**
  - [ ] Deploy schema migrations for assets, liabilities, goals, and client profiles on PostgreSQL.
  - [ ] Activate Supabase Row-Level Security (RLS) policies and deploy custom `is_authorized_advisor` verification function.
  - [ ] Implement and verify JWT authentication middleware on the API Gateway.
  - [ ] Complete CRUD controller routes for goals, assets, and liabilities.
  - [ ] Write integration test suites verifying data isolation (cross-tenant security).

---

### Phase 2: Goal Compounding & Worksheet Engine (Weeks 5-8)
Develop the core compounding logic, inflation adjustments, and interactive dashboard front-end.
- **Estimated Effort:** 55 Story Points (SP)
- **Primary Team:** 1 Financial Engineer, 1 Backend Engineer, 2 Frontend Engineers, 1 QA Engineer
- **Dependencies:** Phase 1 API endpoints
- **Milestone Checklist:**
  - [ ] Implement inflation-adjusted future cost formulas inside the calculation module.
  - [ ] Write numerical Newton-Raphson solvers for extending time horizons (Option C).
  - [ ] Implement after-tax future value models for earmarked assets and monthly savings.
  - [ ] Deploy the Goals Worksheet Screen on the frontend.
  - [ ] Build the interactive goal-modifying sliders restricted strictly to: Goal Cost, Monthly Savings, and Target Date.
  - [ ] Verify mathematical accuracy against book calculations using automated unit test sets.

---

### Phase 3: Rule Engine & Wealth Health Score Engine (Weeks 9-12)
Build rules-based recommendation logic and compute aggregated scores.
- **Estimated Effort:** 50 Story Points (SP)
- **Primary Team:** 1 Rule Developer, 1 Backend Engineer, 1 Frontend Engineer, 1 QA Engineer
- **Dependencies:** Phase 2 calculations
- **Milestone Checklist:**
  - [ ] Deploy rules evaluator using the JSON-based condition format.
  - [ ] Implement specific checks for emergency cash reserves, high-interest debt, portfolio drifts, and insurance gaps.
  - [ ] Write the 7-category Wealth Health Score (WHS) calculation engine.
  - [ ] Create the WHS Snapshot database write pipeline and historical logger.
  - [ ] Deploy dashboard score meters and active recommendation cards to the client portal.
  - [ ] Write compliance suitability logger for advisor rebalancing overrides.

---

### Phase 4: AI Coaching Assistant, Load Testing & General GA (Weeks 13-16)
Deploy natural-language explainers, RAG reference systems, safety guardrails, and complete performance testing.
- **Estimated Effort:** 40 Story Points (SP)
- **Primary Team:** 1 Prompt Engineer, 1 Backend Engineer, 1 DevOps Engineer, 1 QA Engineer
- **Dependencies:** Vector database indices, OpenAI API
- **Milestone Checklist:**
  - [ ] Deploy Semantic chunking and vector index for book context in Pinecone.
  - [ ] Integrate prompt templates for AI Goal Coach, AI Retirement Coach, and Behavioral Nudge engine.
  - [ ] Implement strict output filters and system instructions enforcing advisory-only safety guardrails.
  - [ ] Perform stress testing targeting 10,000 concurrent users at sub-200ms latency.
  - [ ] Run compliance checks, finalize audit logs, and deploy the production cluster to Kubernetes.

---

## 3. Resource & Team Allocation

A dedicated squad of 5 engineers will execute the roadmap:
- **1 Lead Systems Architect / DB Architect:** Manages database schemas, migrations, RLS policies, and core performance scaling.
- **1 Backend Engineer:** Implements Express route controllers, rule evaluations, and compliance loggers.
- **1 Financial Systems Engineer:** Codes and validates compounding models, numerical solvers, and WHS scoring scripts.
- **1 Frontend Developer:** Assembles the React portals, charts, interactive worksheets, and Zustand states.
- **1 QA Automation Specialist:** Writes Cypress E2E scripts, Mocha unit tests, and executes load profiles using k6.
