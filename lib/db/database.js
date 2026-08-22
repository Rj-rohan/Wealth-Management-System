// PostgreSQL database access layer (server-only).
import "server-only";
import { randomUUID } from "node:crypto";
import { query } from "./postgres";
import { ensureDbInitialized } from "./init";

function nowIso() {
  return new Date().toISOString();
}

export const db = {
  async ensureInit() {
    await ensureDbInitialized();
  },

  async raw(text, params = []) {
    await ensureDbInitialized();
    return query(text, params);
  },

  /** Insert a row into table */
  async insert(table, values) {
    await ensureDbInitialized();
    const id = values.id || randomUUID();
    const row = {
      id,
      ...values,
      created_at: values.created_at || nowIso(),
      updated_at: values.updated_at || nowIso(),
    };

    const keys = Object.keys(row);
    const cols = keys.map((k) => `"${k}"`).join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const vals = keys.map((k) => {
      const val = row[k];
      if (val !== null && typeof val === "object" && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val;
    });

    const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *;`;
    const res = await query(sql, vals);
    return res.rows[0];
  },

  async insertAsync(table, values) {
    return this.insert(table, values);
  },

  /** Find multiple rows */
  async findMany(table, where = {}, orderBy = "") {
    await ensureDbInitialized();
    const keys = Object.keys(where);
    let sql = `SELECT * FROM "${table}"`;
    const vals = [];

    if (keys.length > 0) {
      const clauses = keys.map((k, i) => {
        vals.push(where[k]);
        return `"${k}" = $${i + 1}`;
      });
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    const res = await query(sql, vals);
    return res.rows;
  },

  async findManyAsync(table, where = {}, orderBy = "") {
    return this.findMany(table, where, orderBy);
  },

  /** Find one row */
  async findOne(table, where = {}) {
    await ensureDbInitialized();
    const keys = Object.keys(where);
    let sql = `SELECT * FROM "${table}"`;
    const vals = [];

    if (keys.length > 0) {
      const clauses = keys.map((k, i) => {
        vals.push(where[k]);
        return `"${k}" = $${i + 1}`;
      });
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }

    sql += ` LIMIT 1;`;
    const res = await query(sql, vals);
    return res.rows[0] || null;
  },

  async findOneAsync(table, where = {}) {
    return this.findOne(table, where);
  },

  /** Update rows matching where */
  async update(table, where, patch) {
    await ensureDbInitialized();
    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
      return this.findOne(table, where);
    }

    const updatedPatch = {
      ...patch,
      updated_at: nowIso(),
    };
    const allPatchKeys = Object.keys(updatedPatch);

    const setClauses = [];
    const vals = [];

    allPatchKeys.forEach((k) => {
      vals.push(
        updatedPatch[k] !== null && typeof updatedPatch[k] === "object" && !(updatedPatch[k] instanceof Date)
          ? JSON.stringify(updatedPatch[k])
          : updatedPatch[k]
      );
      setClauses.push(`"${k}" = $${vals.length}`);
    });

    const whereKeys = Object.keys(where);
    const whereClauses = whereKeys.map((k) => {
      vals.push(where[k]);
      return `"${k}" = $${vals.length}`;
    });

    const sql = `UPDATE "${table}" SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")} RETURNING *;`;
    const res = await query(sql, vals);
    return res.rows[0] || null;
  },

  async updateAsync(table, where, patch) {
    return this.update(table, where, patch);
  },

  /** Upsert */
  async upsert(table, where, values) {
    await ensureDbInitialized();
    const existing = await this.findOne(table, where);
    if (existing) {
      return this.update(table, where, values);
    }
    return this.insert(table, { ...where, ...values });
  },

  /** Remove */
  async remove(table, where) {
    await ensureDbInitialized();
    const keys = Object.keys(where);
    if (keys.length === 0) return 0;

    const vals = [];
    const clauses = keys.map((k, i) => {
      vals.push(where[k]);
      return `"${k}" = $${i + 1}`;
    });

    const sql = `DELETE FROM "${table}" WHERE ${clauses.join(" AND ")} RETURNING *;`;
    const res = await query(sql, vals);
    return res.rowCount || 0;
  },

  async removeAsync(table, where) {
    return this.remove(table, where);
  },
};
