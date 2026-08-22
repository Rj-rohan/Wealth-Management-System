import pg from "pg";
const { Client } = pg;

const rawUrl = process.env.DATABASE_URL || "postgresql://postgres:system@localhost:5432/wealth_management";

async function main() {
  console.log("Connecting to PostgreSQL...");
  const parsed = new URL(rawUrl);
  const targetDb = parsed.pathname.replace(/^\//, "") || "wealth_management";

  const client = new Client({
    host: parsed.hostname,
    port: parseInt(parsed.port || "5432", 10),
    user: parsed.username,
    password: decodeURIComponent(parsed.password || ""),
    database: "postgres", // connect to default postgres db first
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL server.");

    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
    if (res.rowCount === 0) {
      console.log(`Creating database "${targetDb}"...`);
      await client.query(`CREATE DATABASE "${targetDb}";`);
      console.log(`Database "${targetDb}" created successfully!`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err.message);
  } finally {
    await client.end();
  }
}

main();
