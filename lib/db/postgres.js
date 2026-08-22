// Pure PostgreSQL client setup using node-postgres (pg) pool with automatic database creation.
import "server-only";
import { Pool, Client } from "pg";

let pool;
let isCreatingDb = false;

function parseDbConfig() {
  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const dbName = parsed.pathname.replace(/^\//, "") || "postgres";
      return {
        connectionString: rawUrl,
        host: parsed.hostname,
        port: parseInt(parsed.port || "5432", 10),
        user: parsed.username,
        password: decodeURIComponent(parsed.password || ""),
        database: dbName,
        ssl: process.env.DATABASE_SSL === "true" || rawUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
      };
    } catch {
      // Fallback if URL parsing fails
    }
  }

  return {
    connectionString: null,
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "wealth_management",
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

async function tryCreateDatabaseIfNotExists(targetDbName) {
  if (isCreatingDb || !targetDbName || targetDbName === "postgres") return;
  isCreatingDb = true;

  const cfg = parseDbConfig();
  const maintenanceClient = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: "postgres",
    ssl: cfg.ssl,
  });

  try {
    await maintenanceClient.connect();
    const checkRes = await maintenanceClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );

    if (checkRes.rowCount === 0) {
      // Sanitize database name
      const safeDbName = targetDbName.replace(/[^a-zA-Z0-9_]/g, "");
      await maintenanceClient.query(`CREATE DATABASE "${safeDbName}";`);
      console.log(`[PostgreSQL] Automatically created database "${safeDbName}".`);
    }
  } catch (err) {
    console.warn(`[PostgreSQL Auto-Create Warning]: Could not auto-create database "${targetDbName}":`, err.message);
  } finally {
    try {
      await maintenanceClient.end();
    } catch {}
    isCreatingDb = false;
  }
}

export function getPool() {
  if (!pool) {
    const cfg = parseDbConfig();
    const connectionString =
      cfg.connectionString ||
      `postgresql://${cfg.user}:${encodeURIComponent(cfg.password)}@${cfg.host}:${cfg.port}/${cfg.database}`;

    pool = new Pool({
      connectionString,
      ssl: cfg.ssl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }
  return pool;
}

export async function query(text, params = []) {
  try {
    const p = getPool();
    return await p.query(text, params);
  } catch (err) {
    // Error code 3D000 = database does not exist
    if (err.code === "3D000" || err.message?.includes("does not exist")) {
      const cfg = parseDbConfig();
      await tryCreateDatabaseIfNotExists(cfg.database);
      
      // Reset pool and retry once
      if (pool) {
        try {
          await pool.end();
        } catch {}
        pool = null;
      }
      const newPool = getPool();
      return await newPool.query(text, params);
    }
    throw err;
  }
}
