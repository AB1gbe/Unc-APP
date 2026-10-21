import { config } from './config.js';
import { cleanupExpired, openDb } from './db.js';
import { createApp } from './app.js';
import { ensureAdmin } from './seed.js';

const db = openDb();
await ensureAdmin(db);
cleanupExpired(db);
// .unref() lets the process exit normally even though this timer exists.
setInterval(() => cleanupExpired(db), 60 * 60 * 1000).unref();
createApp(db).listen(config.port, () => {
  console.log(`Unc API listening on http://localhost:${config.port}`);
});
