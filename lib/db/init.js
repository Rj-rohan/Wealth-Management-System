import "server-only";
import { query } from "./postgres";

let initialized = false;
let initPromise = null;

export async function ensureDbInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        reset_token TEXT,
        reset_expires TIMESTAMPTZ,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        email TEXT,
        full_name TEXT DEFAULT '',
        profile_photo TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        location TEXT DEFAULT '',
        date_of_birth TEXT,
        gender TEXT,
        nationality TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_professional_details (
        id TEXT PRIMARY KEY,
        advisor_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        job_title TEXT DEFAULT '',
        organization TEXT DEFAULT '',
        years_of_experience NUMERIC DEFAULT 0,
        professional_summary TEXT DEFAULT '',
        consultation_mode TEXT DEFAULT '',
        office_name TEXT DEFAULT '',
        office_address TEXT DEFAULT '',
        office_city TEXT DEFAULT '',
        office_state TEXT DEFAULT '',
        office_country TEXT DEFAULT '',
        postal_code TEXT DEFAULT '',
        fee_structure TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_qualifications (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        degree TEXT,
        institution TEXT,
        year INTEGER,
        field_of_study TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_certifications (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        issuing_body TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        credential_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_licenses (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT,
        license_number TEXT,
        issuing_authority TEXT,
        expiry_date TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_languages (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        language TEXT,
        proficiency TEXT DEFAULT 'fluent',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_expertise (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        area TEXT,
        level TEXT DEFAULT 'expert',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_availability (
        id TEXT PRIMARY KEY,
        advisor_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        working_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
        working_hours JSONB DEFAULT '{"start":"09:00","end":"17:00"}',
        timezone TEXT DEFAULT 'Asia/Kolkata',
        consultation_duration INTEGER DEFAULT 45,
        vacation_mode BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_settings (
        id TEXT PRIMARY KEY,
        advisor_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        notifications JSONB DEFAULT '{"email": true, "push": true, "meeting_reminders": true, "product_updates": false}',
        two_factor BOOLEAN DEFAULT FALSE,
        privacy JSONB DEFAULT '{"profile_visible": true, "show_contact": false}',
        theme TEXT DEFAULT 'dark',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        advisor_id TEXT,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        status TEXT DEFAULT 'prospect',
        risk_profile TEXT DEFAULT 'moderate',
        age INTEGER DEFAULT 30,
        occupation TEXT DEFAULT '',
        location TEXT DEFAULT '',
        joined_date TIMESTAMPTZ DEFAULT now(),
        last_contact TIMESTAMPTZ DEFAULT now(),
        net_worth NUMERIC DEFAULT 0,
        assets NUMERIC DEFAULT 0,
        liabilities NUMERIC DEFAULT 0,
        income NUMERIC DEFAULT 0,
        expenses NUMERIC DEFAULT 0,
        allocation JSONB DEFAULT '{"equity": 50, "fixedIncome": 30, "cash": 10, "alternatives": 5, "realEstate": 5}',
        tags JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        client_name TEXT DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        type TEXT DEFAULT 'video',
        start TIMESTAMPTZ NOT NULL DEFAULT now(),
        end_time TIMESTAMPTZ,
        duration INTEGER DEFAULT 45,
        status TEXT DEFAULT 'upcoming',
        notes TEXT DEFAULT '',
        google_event_id TEXT,
        google_meet_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS google_oauth_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        google_email TEXT,
        access_token TEXT,
        refresh_token TEXT,
        expiry_date BIGINT,
        scope TEXT,
        token_type TEXT DEFAULT 'Bearer',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        client_name TEXT DEFAULT '',
        last_message TEXT DEFAULT '',
        last_at TIMESTAMPTZ DEFAULT now(),
        unread INTEGER DEFAULT 0,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name TEXT DEFAULT 'Unassigned',
        name TEXT NOT NULL,
        category TEXT DEFAULT 'other',
        size_kb INTEGER DEFAULT 100,
        uploaded_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        client_name TEXT DEFAULT '',
        type TEXT DEFAULT 'private',
        pinned BOOLEAN DEFAULT FALSE,
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS financial_profiles (
        id TEXT PRIMARY KEY,
        client_id TEXT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
        income JSONB DEFAULT '{}',
        expenses JSONB DEFAULT '{}',
        debts JSONB DEFAULT '{}',
        emergency_fund JSONB DEFAULT '{}',
        health_score INTEGER DEFAULT 50,
        savings_rate NUMERIC DEFAULT 0,
        monthly_surplus NUMERIC DEFAULT 0,
        net_worth_timeline JSONB DEFAULT '[]',
        cash_flow_history JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS client_goals (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        type TEXT DEFAULT 'wealth_creation',
        label TEXT NOT NULL,
        target_amount NUMERIC DEFAULT 0,
        current_savings NUMERIC DEFAULT 0,
        target_date TIMESTAMPTZ,
        monthly_contribution NUMERIC DEFAULT 0,
        progress INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'not_started',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS financial_plans (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        client_name TEXT DEFAULT '',
        title TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        executive_summary TEXT DEFAULT '',
        objectives JSONB DEFAULT '[]',
        financial_analysis TEXT DEFAULT '',
        recommended_strategy TEXT DEFAULT '',
        asset_allocation JSONB DEFAULT '{}',
        risk_assessment TEXT DEFAULT '',
        action_items JSONB DEFAULT '[]',
        advisor_notes TEXT DEFAULT '',
        version_history JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS portfolio_data (
        id TEXT PRIMARY KEY,
        client_id TEXT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
        holdings JSONB DEFAULT '[]',
        performance_history JSONB DEFAULT '[]',
        analysis JSONB DEFAULT '{}',
        total_value NUMERIC DEFAULT 0,
        total_cost NUMERIC DEFAULT 0,
        total_return NUMERIC DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS risk_profiles (
        id TEXT PRIMARY KEY,
        client_id TEXT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
        risk_level TEXT DEFAULT 'balanced',
        risk_score INTEGER DEFAULT 50,
        investment_experience TEXT DEFAULT 'beginner',
        risk_capacity TEXT DEFAULT 'medium',
        risk_tolerance TEXT DEFAULT 'medium',
        financial_stability TEXT DEFAULT 'stable',
        investment_horizon TEXT DEFAULT 'medium',
        recommended_allocation JSONB DEFAULT '{}',
        suitable_categories JSONB DEFAULT '[]',
        assessed_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        category TEXT DEFAULT 'investment',
        title TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        explanation TEXT DEFAULT '',
        expected_benefit TEXT DEFAULT '',
        estimated_timeline TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_analyses (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        financial_situation_analysis TEXT DEFAULT '',
        goal_analysis TEXT DEFAULT '',
        overall_assessment TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS advisor_advice (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        summary TEXT DEFAULT '',
        advice JSONB DEFAULT '[]',
        raw_input JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        call_type TEXT DEFAULT 'voice',
        status TEXT DEFAULT 'calling',
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ,
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start);
      CREATE INDEX IF NOT EXISTS idx_client_goals_client ON client_goals(client_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_analyses_client ON advisor_analyses(client_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_advice_client ON advisor_advice(client_id);
      CREATE INDEX IF NOT EXISTS idx_calls_advisor ON calls(advisor_id);
      CREATE INDEX IF NOT EXISTS idx_calls_client ON calls(client_id);
    `;

    try {
      await query(schemaSql);
      initialized = true;
    } catch (err) {
      initPromise = null;
      console.error("[PostgreSQL Init Error]:", err.message);
      throw err;
    }
  })();

  return initPromise;
}
