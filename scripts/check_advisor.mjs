import pg from "pg";
const { Client } = pg;
const client = new Client({ connectionString: "postgresql://postgres:system@localhost:5432/wealth_management" });
await client.connect();

const userRes = await client.query("SELECT * FROM users WHERE email = 'pateatharva261@gmail.com'");
const u = userRes.rows[0];
console.log("User:", u);

const pRes = await client.query(`SELECT * FROM advisor_profiles WHERE user_id = '${u.id}'`);
console.log("Profile for pateatharva261:", pRes.rows[0]);

await client.end();
