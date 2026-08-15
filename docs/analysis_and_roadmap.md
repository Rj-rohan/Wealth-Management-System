# Wealth Platform — Analysis, Standards & Roadmap
*Based on the audit report of the current codebase*
*Last Updated: 2026-07-03*

---

## 1. Executive Assessment

**What exists:** A ~65%-complete wealth management prototype — auth, onboarding, a Wealth Health Score, goals, net worth/portfolio views, and a rule-based alerts engine, all backed by a JSON file instead of a database.

**What's missing relative to every architecture round in this conversation:** The actual knowledge platform. Six hardcoded chunks with keyword matching is not a RAG system, a knowledge base, or a reasoning layer — it's a placeholder. There is no LLM connected, no typed knowledge objects, no citation-backed reasoning, and no evaluation harness of any kind.

**Verdict:** This is not a deviation to be alarmed about — it's actually a *reasonable* place to be. You've built the "boring but necessary" application shell (data model, calculators, UI, auth) that the knowledge platform needs to plug into. That shell was never the risky part. The risky, differentiating part — knowledge objects, rules-from-books, real reasoning — hasn't started. Say this to your mentors plainly: the app is real, the "AI" is a mock, and that mock is the next deliverable, not a footnote.

One useful reframe: your `RecommendationAlert` engine already proves the reasoning pattern you need (structured trigger → typed alert → priority → message) — it's just running on 3 hand-coded heuristics instead of a real rule base. You're not starting from zero on reasoning; you're starting from zero on *knowledge*.

---

## 2. Decision Review — Keep / Change / Why

| Decision | Verdict | Reasoning |
|---|---|---|
| JSON file instead of a DB | **Change now** | Fine for early UI iteration, but you already have a real relational schema (User, Account, Holding, Goal, etc.) — that's Postgres-shaped data, not document-shaped. Every day you stay on JSON is a day of technical debt that compounds once knowledge objects (which need relational + full-text/vector search) get added. This is the single highest-leverage infrastructure change available right now. |
| Hardcoded TypeScript if/else for rules | **Keep for now, plan migration** | This was the *correct* MVP call — a data-driven rule engine (YAML/JSON rules) was explicitly flagged as premature in earlier planning until the schema proves itself. Don't rewrite it yet. Migrate to declarative rules only once you have >15–20 rules and the if/else chain starts hurting to maintain (rule of thumb: when adding a rule requires touching more than one function, migrate). |
| Mock "RAG" via string templates | **Replace — highest priority** | This is the core gap. It fakes the exact capability the whole project exists to deliver. Everything else can wait behind this. |
| Application data model (User/Account/Goal/WHS) separate from "knowledge" | **Keep, and keep them separate** | This is actually a good instinct already present in your schema, whether intentional or not: user financial *state* (accounts, goals, WHS) is a different category of data than domain *knowledge* (concepts, rules, citations from books). Don't merge them into one "knowledge object" table — a user's `Goal` row is not a `KnowledgeObject`. Keep two schemas that reference each other (a `RecommendationAlert` can cite a `KnowledgeObject.id`). |
| Calculator library (23 functions) | **Keep as-is, it's good** | This matches the "calculators as first-class deterministic citizens" principle from the architecture discussion almost exactly. Don't let an LLM anywhere near this math. Just make sure each calculator gets unit tests before you build on top of it (see §6). |
| Zero tests | **Fix in parallel with DB migration** | Not urgent-urgent, but every week without tests on 23 financial calculators is a week where a silent regression could produce a wrong number for a real user later. Cheap to fix now, expensive to retrofit. |
| JWT auth, not fully enforced on all routes | **Fix before any real data or demo with real users** | Low effort, real risk once anything beyond localhost is involved. |

---

## 3. Knowledge Object Schema — Proposed Design

This is the piece to build next. It should live *alongside* your existing schema, not replace it.

```sql
-- Canonical, reusable concepts (the "kernel" vocabulary)
CREATE TABLE canonical_concepts (
  id            UUID PRIMARY KEY,
  name          TEXT NOT NULL,           -- e.g. "Emergency Fund"
  domain        TEXT NOT NULL,           -- e.g. "Cash Flow"
  aliases       TEXT[] DEFAULT '{}',     -- e.g. {"Rainy Day Fund", "Cash Reserve"}
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- The core unit: one fact/rule/formula/strategy/etc.
CREATE TABLE knowledge_objects (
  id                UUID PRIMARY KEY,
  type              TEXT NOT NULL CHECK (type IN
                      ('definition','rule','formula','strategy',
                       'example','exception','checklist','warning')),
  concept_id        UUID REFERENCES canonical_concepts(id),
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,        -- book-derived text — never leaves your infra
  citation_source   TEXT NOT NULL,        -- book title
  citation_chapter  TEXT,
  citation_page     TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','reviewed','published','deprecated')),
  confidence        SMALLINT CHECK (confidence BETWEEN 0 AND 100),
  applies_to        JSONB,                -- e.g. {"min_age":18,"country":"IN"}
  created_at        TIMESTAMPTZ DEFAULT now(),
  reviewed_at       TIMESTAMPTZ,
  version           INT NOT NULL DEFAULT 1
);

-- Structured, executable rules (separate from the human-readable rule object above)
CREATE TABLE rules (
  id                UUID PRIMARY KEY,
  knowledge_object_id UUID REFERENCES knowledge_objects(id),
  condition_json    JSONB NOT NULL,   -- {"field":"debt_interest","op":">","value_ref":"expected_return"}
  action             TEXT NOT NULL,    -- e.g. "recommend_pay_debt_first"
  priority_base      SMALLINT NOT NULL,
  depends_on         UUID[] DEFAULT '{}'  -- other rule ids, for the priority/ordering engine
);
```

---

## 4. Project Standards

1. **ID conventions** — `KO-XXXX` for knowledge objects, `RULE-XXXX` for rules, `CALC-XXXX` for calculators. Sequential, never reused, never renumbered.
2. **Citation format** — `{Book Title}, Ch. {N}, p. {N}` exactly, enforced by a non-null constraint.
3. **Status lifecycle** — draft → reviewed → published → deprecated. No object skips a state.
4. **Commit/doc pairing rule** — any PR that adds/changes a knowledge object must update the Coverage Matrix in the same PR.
5. **Naming for docs** — every architecture doc gets a version number and "last updated" date in its header.

---

## 5. Coverage Matrix

| Domain | KOs | Rules | Calculator | Status |
|---|---|---|---|---|
| Emergency Fund | 1 → target 15-20 | 1 | ✅ `calculateEmergencyFundTarget` | ⚠ partial |
| Debt | 1 → target 15-20 | 1 | — | ⚠ partial |
| Retirement | 2 → target 15-20 | 0 | ✅ multiple | ⚠ partial |
| Insurance | 0 | 0 | — | ❌ not started |
| Asset Allocation | 1 → target 15-20 | 1 | ✅ `computeAssetAllocation` | ⚠ partial |
| Goals | 1 → target 15-20 | 0 | ✅ multiple | ⚠ partial |

---

## 6. Sequenced Roadmap

**Phase 1 — Foundation (~1 week)**
1. Migrate JSON → Postgres.
2. Unit tests for all 23 calculators.
3. Write `docs/standards.md`.

**Phase 2 — Real knowledge, one domain (proof-of-concept)**
4. Create `knowledge_objects` + `canonical_concepts` + `rules` tables.
5. Manually extract 20-30 objects from Emergency Fund chapter.
6. Connect a real LLM for the explanation step.
7. Wire `RecommendationAlert.knowledge_object_ids`.
8. Build 10-15 golden scenarios.

**Phase 3 — Prove it, then expand**
9. Demo end-to-end: real profile → rule match → calculator → cited LLM explanation.
10. Repeat extraction for remaining domains. Migrate rules to declarative format when if/else becomes painful.
