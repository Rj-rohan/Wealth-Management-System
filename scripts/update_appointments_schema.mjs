import pg from "pg";
const client = new pg.Client({ connectionString: "postgresql://postgres:system@localhost:5432/wealth_management" });
await client.connect();

await client.query(`
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
  ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_meet_url TEXT;

  CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT,
    scope TEXT,
    token_type TEXT DEFAULT 'Bearer',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
`);

console.log("Appointments and Google OAuth tokens tables verified.");
await client.end();
