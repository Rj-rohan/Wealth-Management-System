// Local JSON-file database (server-only).
// This mirrors a relational schema and is intentionally isolated behind a
// small data-access layer so it can be swapped for Supabase/PostgreSQL later
// without touching feature service files.
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "wealth-advisor.db.json");

// Collections that mirror the documented Supabase tables.
const TABLES = [
  "users",
  "sessions",
  "advisor_profiles",
  "advisor_professional_details",
  "advisor_qualifications",
  "advisor_certifications",
  "advisor_licenses",
  "advisor_languages",
  "advisor_expertise",
  "advisor_availability",
  "advisor_settings",
];

function emptyDb() {
  return TABLES.reduce((acc, t) => ({ ...acc, [t]: [] }), {});
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(emptyDb(), null, 2), "utf-8");
  }
}

function read() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw || "{}");
    return { ...emptyDb(), ...parsed };
  } catch {
    return emptyDb();
  }
}

function write(data) {
  ensureFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function matches(row, where) {
  return Object.entries(where || {}).every(([k, v]) => row[k] === v);
}

export const db = {
  /** Insert a row, auto-assigning id + timestamps. */
  insert(table, values) {
    const data = read();
    const row = {
      id: values.id || randomUUID(),
      ...values,
      created_at: values.created_at || nowIso(),
      updated_at: nowIso(),
    };
    data[table] = data[table] || [];
    data[table].push(row);
    write(data);
    return row;
  },

  /** Return all rows matching a partial equality filter. */
  findMany(table, where = {}) {
    const data = read();
    return (data[table] || []).filter((r) => matches(r, where));
  },

  /** Return the first row matching a filter, or null. */
  findOne(table, where = {}) {
    const data = read();
    return (data[table] || []).find((r) => matches(r, where)) || null;
  },

  /** Patch the first row matching the filter. */
  update(table, where, patch) {
    const data = read();
    const rows = data[table] || [];
    const idx = rows.findIndex((r) => matches(r, where));
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updated_at: nowIso() };
    write(data);
    return rows[idx];
  },

  /** Insert if no row matches the filter, otherwise patch it. */
  upsert(table, where, values) {
    const existing = this.findOne(table, where);
    if (existing) return this.update(table, where, values);
    return this.insert(table, { ...where, ...values });
  },

  /** Delete all rows matching the filter. Returns number removed. */
  remove(table, where) {
    const data = read();
    const before = (data[table] || []).length;
    data[table] = (data[table] || []).filter((r) => !matches(r, where));
    write(data);
    return before - data[table].length;
  },
};
