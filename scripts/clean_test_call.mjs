import pg from "pg";
const client = new pg.Client({ connectionString: "postgresql://postgres:system@localhost:5432/wealth_management" });
await client.connect();
await client.query("DELETE FROM calls WHERE id = 'test_call_001'");
console.log("Cleaned test call");
await client.end();
