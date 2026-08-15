# Project Standards
**Version:** 1.0 — Last Updated: 2026-07-03

This document defines the in-house conventions for the Weallth Personal Wealth Management project. It is the single source of truth for naming, lifecycle, citation, and documentation practices.

---

## 1. ID Conventions

All identifiers are sequential within their prefix. Once assigned, an ID is **never reused or renumbered**, even if the entity is deprecated or deleted.

| Entity | Prefix | Format | Example |
|---|---|---|---|
| Knowledge Object | `KO-` | `KO-XXXX` | `KO-0001` |
| Rule | `RULE-` | `RULE-XXXX` | `RULE-0012` |
| Calculator | `CALC-` | `CALC-XXXX` | `CALC-0003` |
| Canonical Concept | `CC-` | `CC-XXXX` | `CC-0007` |
| Golden Scenario | `SCN-` | `SCN-XXX` | `SCN-001` |

---

## 2. Citation Format

All knowledge objects derived from source material **must** include a citation. The format is enforced by a `NOT NULL` constraint on `citation_source` in the database schema, not by convention alone.

**Required format:**
```
{Book Title}, Ch. {N}, p. {N}
```

**Examples:**
- `Discover The Wealth Within You, Ch. 5, p. 142`
- `Discover The Wealth Within You, Ch. 8, p. 203–205`

If a page number is unavailable (e.g., digital-only edition), use `p. N/A` — never leave the field empty.

---

## 3. Status Lifecycle

Every knowledge object follows this state machine. **No object may skip a state.**

```
draft → reviewed → published → deprecated
```

| State | Meaning | Who can transition |
|---|---|---|
| `draft` | Extracted but not verified against source | Anyone |
| `reviewed` | Verified against source material, factually correct | Project lead |
| `published` | Active in the reasoning/recommendation pipeline | Project lead |
| `deprecated` | Superseded or found incorrect; retained for audit trail | Project lead |

- Objects in `draft` or `deprecated` states are **never** used in user-facing recommendations.
- Deprecation is preferred over deletion — the `version` field tracks revisions.

---

## 4. Commit & Documentation Pairing

Any commit (or pull request) that adds, modifies, or deprecates a knowledge object, rule, or calculator **must** update the Coverage Matrix (`docs/analysis_and_roadmap.md`, §5) in the same commit. The matrix must always reflect the current counts.

---

## 5. Document Naming & Versioning

- Every architecture or planning document **must** include a `Version:` and `Last Updated:` line in its header.
- Superseded documents are moved to `docs/archive/` — never deleted — so the design evolution remains visible to reviewers.
- Filenames use `snake_case.md` (e.g., `system_architecture.md`, not `SystemArchitecture.md`).

---

## 6. Calculator Standards

- All financial calculations live exclusively in `app/backend/src/calculations/engine.ts`.
- Controllers and services **must never** contain inline formulas.
- Every calculator function must have:
  - A JSDoc comment stating the formula.
  - A corresponding unit test in `src/calculations/__tests__/engine.test.ts` with at least one hand-computed verification.
- Calculators are deterministic. No LLM, no randomness, no external API calls.

---

## 7. Test Standards

- Financial calculator tests must verify against **hand-computed expected values**, not "output looks reasonable" assertions.
- Float comparisons use `toBeCloseTo(expected, 2)` (2 decimal places) unless the function explicitly rounds.
- Every golden scenario (in `test/scenarios/`) must include:
  - A synthetic user profile
  - The expected top recommendation
  - Whether citations are expected
  - The expected priority ordering

---

## 8. Technology & Version Pinning

- **Prisma**: Pinned to v5 (specifically `@prisma/client@5` and `prisma@5`) as of July 2026. This was a deliberate choice during the JSON-to-Postgres migration. Prisma v7 (released late 2025) removed `schema.prisma`-based URL configs and mandated a new `prisma.config.ts` system with mandatory driver adapters. To maintain environment simplicity (`DATABASE_URL` in `.env`) during this prototype phase, v5 is used. Revisit this before any real production deployment.

---

## 9. IEEE Mapping (for academic/internship reporting)

For formal traceability, the following mapping can be cited:

| This Project | IEEE Standard |
|---|---|
| `docs/requirements.md` | IEEE 830 (SRS) |
| `architecture/system_architecture.md` | IEEE 1016 (SDD) |
| Coverage Matrix + Eval Harness | IEEE 1012 (V&V) |
| This document | In-house Software Standards Guide |

This mapping satisfies "we followed a recognized standard" without restructuring documents to IEEE's full template format.
