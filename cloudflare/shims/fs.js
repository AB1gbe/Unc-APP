// A stand-in for Node's `fs` on Cloudflare (session 79), for the few calls
// Unc makes: uploaded photos and videos, and the push keys file. Files are
// rows in the Durable Object's SQLite (table _files), so they survive
// restarts. Folders don't really exist: mkdirSync does nothing.
import { Buffer } from 'node:buffer';
import { store } from './storage.js';

const s = () => store.sql;
let ready = false;
const table = () => {
  if (!ready) { s().exec('CREATE TABLE IF NOT EXISTS _files (path TEXT PRIMARY KEY, data BLOB NOT NULL)'); ready = true; }
  return s();
};
const norm = (p) => String(p).replace(/\\/g, '/').replace(/\/+/g, '/');
const missing = (p) => Object.assign(new Error(`ENOENT: no such file, '${p}'`), { code: 'ENOENT' });

export function existsSync(p) { return Boolean(table().exec('SELECT 1 FROM _files WHERE path = ?', norm(p)).toArray()[0]); }
export function mkdirSync() {}
export function writeFileSync(p, data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  table().exec('INSERT INTO _files (path, data) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET data = excluded.data', norm(p), bytes);
}
export function readFileSync(p, enc) {
  const row = table().exec('SELECT data FROM _files WHERE path = ?', norm(p)).toArray()[0];
  if (!row) throw missing(p);
  const buf = Buffer.from(row.data);
  return enc ? buf.toString(typeof enc === 'string' ? enc : enc.encoding) : buf;
}
export function rmSync(p) { table().exec('DELETE FROM _files WHERE path = ?', norm(p)); }
export const unlinkSync = rmSync;
export function statSync(p) {
  const row = table().exec('SELECT length(data) AS size FROM _files WHERE path = ?', norm(p)).toArray()[0];
  if (!row) throw missing(p);
  return { size: row.size, isFile: () => true, isDirectory: () => false, mtime: new Date(0) };
}
export function readdirSync() { return []; }
// Only checked with instanceof by some libraries (e.g. `destroy`); never created.
export class ReadStream {}
export class WriteStream {}
export function createReadStream() { throw new Error('createReadStream is not available on Cloudflare'); }
export function stat(p, cb) { try { cb(null, statSync(p)); } catch (e) { cb(e); } }
export const promises = {};
export default { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, unlinkSync, statSync, readdirSync, promises, ReadStream, WriteStream, createReadStream, stat };
