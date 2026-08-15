-- SUPERSEDED BY app/backend/prisma/schema.prisma (Last Updated: 2026-07-30)
-- ============================================================================
-- WEALLTH PLATFORM - PERSONAL WEALTH MANAGEMENT SCHEMA
-- PostgreSQL & Supabase Production DDL and Seed Data
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums
CREATE TYPE user_role AS ENUM ('Client', 'Advisor', 'Admin');
CREATE TYPE kyc_status_type AS ENUM ('Pending', 'Verified', 'Rejected');
CREATE TYPE risk_profile_type AS ENUM ('Conservative', 'Moderate', 'Aggressive');
CREATE TYPE job_volatility_type AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE asset_category_type AS ENUM ('Cash', 'Equities', 'Fixed Income', 'Real Estate', 'Commodities', 'Alternatives', 'Precious Metals', 'Cryptocurrency', 'Insurance Cash Value', 'Private Equity');
CREATE TYPE liability_category_type AS ENUM ('Mortgage', 'Credit Card', 'Student Loan', 'Auto Loan', 'Personal Loan');
CREATE TYPE goal_category_type AS ENUM ('Retirement', 'Education', 'Purchase', 'Travel', 'Philanthropy', 'General Savings');
CREATE TYPE alert_priority_type AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE alert_status_type AS ENUM ('Active', 'Dismissed', 'Snoozed', 'Addressed');

-- 1. Users Table (Core Auth mapping)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Client',
    kyc_status kyc_status_type NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Client Profiles Table (Financial Context)
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_profile risk_profile_type NOT NULL DEFAULT 'Moderate',
    monthly_net_income DECIMAL(18,2) NOT NULL CHECK (monthly_net_income >= 0),
    job_volatility job_volatility_type NOT NULL DEFAULT 'Medium',
    has_dependents BOOLEAN NOT NULL DEFAULT FALSE,
    age INTEGER NOT NULL CHECK (age BETWEEN 0 AND 120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Advisor-Client Consent Join Table
CREATE TABLE advisor_client_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    has_consent BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (advisor_id, client_id)
);

-- 4. Goals Table (Compounding and Shortfalls)
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category goal_category_type NOT NULL DEFAULT 'General Savings',
    current_cost DECIMAL(18,2) NOT NULL CHECK (current_cost >= 0),
    target_date DATE NOT NULL,
    earmarked_assets DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (earmarked_assets >= 0),
    monthly_savings DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (monthly_savings >= 0),
    outside_sources DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (outside_sources >= 0),
    inflation_rate_assumed DECIMAL(5,4) NOT NULL DEFAULT 0.0300 CHECK (inflation_rate_assumed BETWEEN -0.1 AND 0.5),
    return_rate_assumed DECIMAL(5,4) NOT NULL DEFAULT 0.0600 CHECK (return_rate_assumed BETWEEN 0 AND 0.4),
    tax_rate_assumed DECIMAL(5,4) NOT NULL DEFAULT 0.2500 CHECK (tax_rate_assumed BETWEEN 0 AND 0.9),
    future_cost DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (future_cost >= 0),
    shortfall DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_target_date CHECK (target_date > CURRENT_DATE)
);

-- 5. Assets Table (Net Worth and Liquidity)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID, -- NULL if manually entered
    name VARCHAR(255) NOT NULL,
    category asset_category_type NOT NULL,
    current_value DECIMAL(18,2) NOT NULL CHECK (current_value >= 0),
    is_liquid BOOLEAN NOT NULL DEFAULT FALSE,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Liabilities Table (Net Worth and Debt Management)
CREATE TABLE liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category liability_category_type NOT NULL,
    outstanding_balance DECIMAL(18,2) NOT NULL CHECK (outstanding_balance >= 0),
    interest_rate DECIMAL(5,4) NOT NULL CHECK (interest_rate BETWEEN 0 AND 2.0),
    monthly_payment DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (monthly_payment >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Wealth Health Score Snapshots
CREATE TABLE wealth_health_score_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    score_emergency_fund INTEGER NOT NULL CHECK (score_emergency_fund BETWEEN 0 AND 100),
    score_debt_mgmt INTEGER NOT NULL CHECK (score_debt_mgmt BETWEEN 0 AND 100),
    score_savings_rate INTEGER NOT NULL CHECK (score_savings_rate BETWEEN 0 AND 100),
    score_portfolio_drift INTEGER NOT NULL CHECK (score_portfolio_drift BETWEEN 0 AND 100),
    score_retirement_readiness INTEGER NOT NULL CHECK (score_retirement_readiness BETWEEN 0 AND 100),
    score_insurance_protection INTEGER NOT NULL CHECK (score_insurance_protection BETWEEN 0 AND 100),
    score_estate_planning INTEGER NOT NULL CHECK (score_estate_planning BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Wealth Health Score History Log
CREATE TABLE wealth_health_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, snapshot_date)
);

-- 9. Recommendation Alerts Table
CREATE TABLE recommendation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    priority alert_priority_type NOT NULL DEFAULT 'Medium',
    alert_message TEXT NOT NULL,
    formula_triggered VARCHAR(100) NOT NULL,
    status alert_status_type NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Compliance Suitability Logs
CREATE TABLE compliance_suitability_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    suitability_rationale TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_user ON client_profiles(user_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_liabilities_user ON liabilities(user_id);
CREATE INDEX idx_whs_history_user_date ON wealth_health_score_history(user_id, snapshot_date);
CREATE INDEX idx_recommendations_user_status ON recommendation_alerts(user_id, status);
CREATE INDEX idx_suitability_user_advisor ON compliance_suitability_logs(user_id, advisor_id);
CREATE INDEX idx_consent_advisor_client ON advisor_client_consent(advisor_id, client_id);

-- ============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_client_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_health_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_suitability_logs ENABLE ROW LEVEL SECURITY;

-- Custom function to check if the current user is an authorized advisor for a client
CREATE OR REPLACE FUNCTION is_authorized_advisor(client_uuid UUID, advisor_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM advisor_client_consent
        WHERE advisor_id = advisor_uuid 
          AND client_id = client_uuid 
          AND has_consent = TRUE 
          AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for Users Table
CREATE POLICY users_self_access ON users 
    FOR ALL USING (auth.uid() = id);

-- RLS Policies for Client Profiles
CREATE POLICY profile_self_access ON client_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY profile_advisor_access ON client_profiles
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Goals
CREATE POLICY goals_self_access ON goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY goals_advisor_access ON goals
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Assets
CREATE POLICY assets_self_access ON assets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY assets_advisor_access ON assets
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Liabilities
CREATE POLICY liabilities_self_access ON liabilities
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY liabilities_advisor_access ON liabilities
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Score Snapshots
CREATE POLICY whs_self_access ON wealth_health_score_snapshots
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY whs_advisor_access ON wealth_health_score_snapshots
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Score History
CREATE POLICY whs_history_self_access ON wealth_health_score_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY whs_history_advisor_access ON wealth_health_score_history
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Recommendations
CREATE POLICY recommendations_self_access ON recommendation_alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY recommendations_advisor_access ON recommendation_alerts
    FOR SELECT USING (is_authorized_advisor(user_id, auth.uid()));

-- RLS Policies for Suitability Logs (Advisors can view logs they generated)
CREATE POLICY suitability_advisor_self ON compliance_suitability_logs
    FOR ALL USING (auth.uid() = advisor_id);

-- ============================================================================
-- REPRESENTATIVE SEED DATA
-- ============================================================================

-- Insert Test Users (User UUIDs are hardcoded for referential consistency)
INSERT INTO users (id, email, password_hash, role, kyc_status) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'evelyn.v@example.com', '$2b$12$N9qo8uLOqpY3zGlC3uP8GevJ7tH.jVlPjZ9N9Kj124U5c9e2v8yV.', 'Client', 'Verified'),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'rajesh.n@example.com', '$2b$12$N9qo8uLOqpY3zGlC3uP8GevJ7tH.jVlPjZ9N9Kj124U5c9e2v8yV.', 'Client', 'Verified'),
('a11a026f-4c28-4ad0-85f2-1ab08e2f89e1', 'sarah.j@example.com', '$2b$12$N9qo8uLOqpY3zGlC3uP8GevJ7tH.jVlPjZ9N9Kj124U5c9e2v8yV.', 'Advisor', 'Verified');

-- Insert Client Profiles
INSERT INTO client_profiles (user_id, risk_profile, monthly_net_income, job_volatility, has_dependents, age) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Moderate', 5500.00, 'Low', FALSE, 34),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Aggressive', 18500.00, 'High', TRUE, 48);

-- Map Advisor-Client Consent
INSERT INTO advisor_client_consent (advisor_id, client_id, has_consent) VALUES
('a11a026f-4c28-4ad0-85f2-1ab08e2f89e1', 'b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', TRUE),
('a11a026f-4c28-4ad0-85f2-1ab08e2f89e1', 'd55f026f-4c28-4ad0-85f2-1ab08e2f89e4', TRUE);

-- Insert Client Assets
-- Evelyn (Liquid: $5,000, 401(k): $15,000)
INSERT INTO assets (user_id, name, category, current_value, is_liquid) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Checking Cash Reserves', 'Cash', 5000.00, TRUE),
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Employer 401k Account', 'Equities', 15000.00, FALSE);

-- Rajesh (Liquid: $85,000, Investments: $450,000, Home Equity: $1,200,000)
INSERT INTO assets (user_id, name, category, current_value, is_liquid) VALUES
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Fidelity Money Market', 'Cash', 85000.00, TRUE),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Schwab Equity Portfolio', 'Equities', 450000.00, FALSE),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Primary Residence Value', 'Real Estate', 1200000.00, FALSE);

-- Insert Client Liabilities
-- Evelyn (Student Loan: $25,000, Credit Card: $3,500)
INSERT INTO liabilities (user_id, name, category, outstanding_balance, interest_rate, monthly_payment) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Navient Student Loan', 'Student Loan', 25000.00, 0.0450, 250.00),
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Chase Sapphire Credit Card', 'Credit Card', 3500.00, 0.2299, 150.00);

-- Rajesh (Mortgage: $450,000)
INSERT INTO liabilities (user_id, name, category, outstanding_balance, interest_rate, monthly_payment) VALUES
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Wells Fargo Home Mortgage', 'Mortgage', 450000.00, 0.0325, 2100.00);

-- Insert Client Goals
-- Evelyn (Turkey Trip in 5 years, target cost $10k today. Home down payment in 6 years, target $50k today.)
INSERT INTO goals (user_id, name, category, current_cost, target_date, earmarked_assets, monthly_savings, outside_sources, inflation_rate_assumed, return_rate_assumed, tax_rate_assumed, future_cost, shortfall) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Trip to Turkey', 'Travel', 10000.00, '2031-06-30', 750.00, 100.00, 0.00, 0.0400, 0.0500, 0.2700, 12167.00, 4409.00),
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Home Down Payment', 'Purchase', 50000.00, '2032-06-30', 0.00, 400.00, 0.00, 0.0300, 0.0600, 0.2700, 59703.00, 25680.00);

-- Rajesh (Children College Fund in 8 years, cost $80k today. Retirement in 12 years, cost $12k/mo today.)
INSERT INTO goals (user_id, name, category, current_cost, target_date, earmarked_assets, monthly_savings, outside_sources, inflation_rate_assumed, return_rate_assumed, tax_rate_assumed, future_cost, shortfall) VALUES
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 'Children College Fund', 'Education', 80000.00, '2034-06-30', 50000.00, 250.00, 0.00, 0.0600, 0.0700, 0.3500, 127508.00, 42100.00);

-- Insert WHS Snapshots
INSERT INTO wealth_health_score_snapshots (user_id, score, score_emergency_fund, score_debt_mgmt, score_savings_rate, score_portfolio_drift, score_retirement_readiness, score_insurance_protection, score_estate_planning) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 65, 80, 45, 60, 95, 65, 80, 50),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 85, 100, 100, 80, 92, 85, 80, 70);

-- Insert WHS History Log
INSERT INTO wealth_health_score_history (user_id, score, snapshot_date) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 62, '2026-06-22'),
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 65, '2026-06-23'),
('d55f026f-4c28-4ad0-85f2-1ab08e2f89e4', 85, '2026-06-23');

-- Insert Recommendation Alerts
INSERT INTO recommendation_alerts (user_id, category, priority, alert_message, formula_triggered) VALUES
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Debt Management', 'High', 'Your credit card has an outstanding balance of $3,500 at 22.99% APR. Redirect discretionary income to pay off this balance immediately.', 'FORMULA_DEBT_APR_GT_8'),
('b33d026f-4c28-4ad0-85f2-1ab08e2f89e2', 'Goal Funding', 'Medium', 'Your Turkey Trip goal has a projected shortfall of $4,409. Increase monthly savings by $42, decrease the goal budget, or delay the trip by 18 months.', 'FORMULA_GOAL_SHORTFALL_DETECTED');
