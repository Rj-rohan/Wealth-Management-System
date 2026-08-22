import pg from "pg";
const { Client } = pg;
const client = new Client({ connectionString: "postgresql://postgres:system@localhost:5432/wealth_management" });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    advisor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    call_type TEXT DEFAULT 'voice',
    status TEXT DEFAULT 'calling',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_calls_advisor ON calls(advisor_id);
  CREATE INDEX IF NOT EXISTS idx_calls_client ON calls(client_id);
`);

console.log("Calls table created/verified successfully.");
await client.end();
