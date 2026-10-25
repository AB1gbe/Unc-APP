import { config } from './config.js';
import { cleanupExpired, openDb } from './db.js';
import { createApp } from './app.js';
import { listen } from './lib/listen.js';
import { ensureAdmin } from './seed.js';
import { runExpiry } from './lib/expiry.js';
import { runDeletions } from './lib/deletion.js';
import { askDidYouGetIt } from './lib/notify.js';
import { runInstallmentReminders } from './lib/installments.js';

const db = openDb();
await ensureAdmin(db);
cleanupExpired(db);
runExpiry(db);
runDeletions(db);
askDidYouGetIt(db);
runInstallmentReminders(db);
// .unref() lets the process exit normally even though this timer exists.
setInterval(() => { cleanupExpired(db); runExpiry(db); runDeletions(db); askDidYouGetIt(db); runInstallmentReminders(db); }, 60 * 60 * 1000).unref();
try {
  await listen(createApp(db), config.port);
  console.log(`Unc API listening on http://localhost:${config.port}`);
} catch (err) {
  console.error(`\nCould not start Unc: ${err.message}\n`);
  process.exit(1);
}
