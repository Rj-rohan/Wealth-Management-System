import pg from "pg";
const { Client } = pg;
const client = new Client({ connectionString: "postgresql://postgres:system@localhost:5432/wealth_management" });
await client.connect();
const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
console.log("Tables in DB:", res.rows.map(r => r.table_name));
await client.end();
