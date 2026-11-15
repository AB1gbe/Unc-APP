// Turns a backup from Admin → Download backup (session 102) into a new
// SQLite database file. It never overwrites an existing file.
// Windows cmd, in the Unc-APP folder:
//   node scripts/restore-backup.mjs unc-backup-2026-11-15.json restored.sqlite
// Then start Unc on it:  set DB_FILE=restored.sqlite  then  npm start
// (Photos and ID documents are not in the backup; sessions are not either,
// so everyone logs in again.)
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const [file, out] = process.argv.slice(2);
if (!file || !out) { console.error('Use: node scripts/restore-backup.mjs <backup.json> <new.sqlite>'); process.exit(1); }
if (fs.existsSync(out)) { console.error(`${out} already exists: choose a new file name.`); process.exit(1); }
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
if (backup.app !== 'unc') { console.error('This is not an Unc backup.'); process.exit(1); }

// Create an empty database with the same tables by running Unc's migrations.
process.env.DB_FILE = out;
const { openDb } = await import('../server/src/db.js');
const db = openDb(out);
db.exec('PRAGMA foreign_keys = OFF;');
db.exec('BEGIN');
let rows = 0;
for (const [name, list] of Object.entries(backup.tables)) {
  const exists = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(name);
  if (!exists) { console.warn(`skipped unknown table ${name}`); continue; }
  db.exec(`DELETE FROM "${name}"`); // e.g. the admin row the migrations/seed may have added
  for (const row of list) {
    const cols = Object.keys(row);
    db.prepare(`INSERT INTO "${name}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...cols.map((c) => row[c]));
    rows += 1;
  }
}
db.exec('COMMIT');
db.exec('PRAGMA foreign_keys = ON;');
const problems = db.prepare('PRAGMA foreign_key_check').all();
db.close();
console.log(`Restored ${rows} rows from ${Object.keys(backup.tables).length} tables into ${out} (made ${backup.createdAt}).${problems.length ? ` Warning: ${problems.length} broken links between rows.` : ''}`);
