// A stand-in for Node's `node:sqlite` on Cloudflare (session 79). Unc's
// code calls db.prepare(sql).get/all/run and db.exec; here they run on the
// Durable Object's own SQLite (ctx.storage.sql), which is synchronous too.
// Differences handled here:
// - BEGIN/COMMIT/ROLLBACK are not allowed: tx() in server/src/db.js uses
//   db.transactionSync(fn) when it exists (one atomic Durable Object step).
// - PRAGMA user_version is kept in a small table; other PRAGMAs are skipped
//   (foreign keys are always on in Durable Objects).
import { store } from './storage.js';

const sql = () => {
  if (!store.sql) throw new Error('Durable Object storage is not ready');
  return store.sql;
};
const asParam = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);
const plain = (row) => (row ? { ...row } : undefined);

class Statement {
  constructor(text) { this.text = text; }
  all(...params) { return sql().exec(this.text, ...params.map(asParam)).toArray().map(plain); }
  get(...params) { return this.all(...params)[0]; }
  run(...params) {
    const s = sql();
    s.exec(this.text, ...params.map(asParam)).toArray();
    const info = s.exec('SELECT changes() AS changes, last_insert_rowid() AS id').one();
    return { changes: info.changes, lastInsertRowid: info.id };
  }
  iterate(...params) { return this.all(...params)[Symbol.iterator](); }
}

export class DatabaseSync {
  constructor() {
    sql().exec('CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value INTEGER)');
  }
  prepare(text) {
    const m = /^\s*PRAGMA\s+user_version\s*$/i.exec(text);
    if (m) return { get: () => ({ user_version: sql().exec(`SELECT value FROM _meta WHERE key = 'user_version'`).toArray()[0]?.value ?? 0 }) };
    return new Statement(text);
  }
  exec(text) {
    const set = /^\s*PRAGMA\s+user_version\s*=\s*(\d+)\s*;?\s*$/i.exec(text);
    if (set) { sql().exec(`INSERT INTO _meta (key, value) VALUES ('user_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, Number(set[1])); return; }
    if (/^\s*(BEGIN|COMMIT|ROLLBACK|PRAGMA)\b/i.test(text)) return; // handled by transactionSync / not needed
    sql().exec(text);
  }
  transactionSync(fn) { return store.storage.transactionSync(fn); }
  close() {}
}
export default { DatabaseSync };
