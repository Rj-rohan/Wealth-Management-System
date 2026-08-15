# DATABASE MIGRATION PLAN
## Personal Wealth Management Module
**Version:** 1.0  
**Status:** Approved  
**Author:** Lead Database Architect  
**Date:** June 2026  

---

## 1. Rollout Phases

To ensure zero-downtime deployments and prevent transactional lockups, the database migration will execute in 4 sequential phases:

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  Phase 1: Preparation  ├─────►│  Phase 2: Schema DDL   ├─────►│   Phase 3: Backfills   │
│  Backup & Lock Checks  │      │ Tables, Enums, Indexes │      │ Legacy Profile Maps    │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                            │
                                                                            ▼
                                                                ┌────────────────────────┐
                                                                │  Phase 4: Verification │
                                                                │ Smoke Tests & Policies │
                                                                └────────────────────────┘
```

---

## 2. Phase-by-Phase Executions

### Phase 1: Pre-Deployment & Backup (T-2 Hours)
1. **Automated Snapshot:** Initiate a manual snapshot of the production Supabase/PostgreSQL instance.
   - Target Retention: 30 days.
2. **Lock Analysis:** Run the lock-monitoring query to ensure no long-running transactions are active.
3. **Connection Pooling:** Shift API gateway connections to the transaction-level pooler (port 6543) to limit direct connection depletion.

### Phase 2: Schema DDL Deployments (T-Zero)
Execute the schema creation scripts using Supabase CLI or direct SQL migration nodes:
1. Define custom Types and Enums (`user_role`, `risk_profile_type`, etc.).
2. Create base tables (`client_profiles`, `advisor_client_consent`, `goals`, `assets`, `liabilities`).
3. Create secondary scoring and alert tables (`wealth_health_score_snapshots`, `wealth_health_score_history`, `recommendation_alerts`, `compliance_suitability_logs`).
4. Apply constraint checks (`chk_target_date`, values bounds).
5. Apply performance indexes.

### Phase 3: Data Backfills & Relationship Mapping (T+30 Mins)
1. **Profile Generation:** For users who exist in the central `users` auth table but lack a `client_profiles` record, execute an automated default mapping:
   ```sql
   INSERT INTO client_profiles (user_id, risk_profile, monthly_net_income, job_volatility, has_dependents, age)
   SELECT id, 'Moderate'::risk_profile_type, 0.00, 'Medium'::job_volatility_type, FALSE, 35
   FROM users u
   WHERE NOT EXISTS (SELECT 1 FROM client_profiles cp WHERE cp.user_id = u.id)
     AND u.role = 'Client';
   ```
2. **Scoring Snapshot Initialization:** Create a baseline scoring snapshot (score: 0) for all existing clients to initialize dashboard metrics.

### Phase 4: RLS Activation & Verification (T+60 Mins)
1. Apply the custom authorization function `is_authorized_advisor()`.
2. Toggle Row-Level Security policies (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
3. Run verification check queries (see Section 4).

---

## 3. Rollback Strategy

In the event of a deployment failure (e.g., query timeouts, syntax errors, locking failures), execute this rollback procedure immediately:

### 3.1 Drop New Objects Script
```sql
BEGIN;

-- 1. Drop Policies
DROP POLICY IF EXISTS users_self_access ON users;
DROP POLICY IF EXISTS profile_self_access ON client_profiles;
DROP POLICY IF EXISTS profile_advisor_access ON client_profiles;
DROP POLICY IF EXISTS goals_self_access ON goals;
DROP POLICY IF EXISTS goals_advisor_access ON goals;
DROP POLICY IF EXISTS assets_self_access ON assets;
DROP POLICY IF EXISTS assets_advisor_access ON assets;
DROP POLICY IF EXISTS liabilities_self_access ON liabilities;
DROP POLICY IF EXISTS liabilities_advisor_access ON liabilities;
DROP POLICY IF EXISTS whs_self_access ON wealth_health_score_snapshots;
DROP POLICY IF EXISTS whs_history_self_access ON wealth_health_score_history;
DROP POLICY IF EXISTS recommendations_self_access ON recommendation_alerts;
DROP POLICY IF EXISTS suitability_advisor_self ON compliance_suitability_logs;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS is_authorized_advisor(UUID, UUID);

-- 3. Drop Tables
DROP TABLE IF EXISTS compliance_suitability_logs CASCADE;
DROP TABLE IF EXISTS recommendation_alerts CASCADE;
DROP TABLE IF EXISTS wealth_health_score_history CASCADE;
DROP TABLE IF EXISTS wealth_health_score_snapshots CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS advisor_client_consent CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;

-- 4. Drop Types
DROP TYPE IF EXISTS alert_status_type;
DROP TYPE IF EXISTS alert_priority_type;
DROP TYPE IF EXISTS goal_category_type;
DROP TYPE IF EXISTS liability_category_type;
DROP TYPE TYPE IF EXISTS asset_category_type;
DROP TYPE IF EXISTS job_volatility_type;
DROP TYPE IF EXISTS risk_profile_type;
DROP TYPE IF EXISTS kyc_status_type;

COMMIT;
```

---

## 4. Database Verification Queries

Deploy these SQL sanity checks post-migration to confirm database integrity and RLS policy correctness:

### Query 1: Validate Relationship Consistency
Verify that every user has a corresponding client profile or advisor flag.
```sql
SELECT u.id, u.email, u.role, cp.risk_profile 
FROM users u
LEFT JOIN client_profiles cp ON u.id = cp.user_id
WHERE u.role = 'Client' AND cp.id IS NULL;
-- Expected output: 0 rows (confirms successful backfill).
```

### Query 2: Validate RLS Policies (Mock Client Session)
Simulate a select query under a mocked user session to verify data isolation.
```sql
-- Simulate Client Session for Evelyn (b33d026f-4c28-4ad0-85f2-1ab08e2f89e2)
SET LOCAL request.jwt.claims TO '{"sub": "b33d026f-4c28-4ad0-85f2-1ab08e2f89e2"}';

SELECT * FROM client_profiles;
-- Expected output: 1 row (Evelyn's profile only. Rajesh's profile must NOT appear).
```

### Query 3: Validate Advisor Access (Authorized Consent Check)
Simulate an advisor querying client data.
```sql
-- Simulate Advisor Session for Sarah (a11a026f-4c28-4ad0-85f2-1ab08e2f89e1)
SET LOCAL request.jwt.claims TO '{"sub": "a11a026f-4c28-4ad0-85f2-1ab08e2f89e1"}';

SELECT user_id, risk_profile, monthly_net_income FROM client_profiles;
-- Expected output: 2 rows (Evelyn's and Rajesh's profiles, since both granted consent).
```
