import { config } from './config.js';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { ensureAdmin } from './seed.js';

const db = openDb();
await ensureAdmin(db);
createApp(db).listen(config.port, () => {
  console.log(`Unc API listening on http://localhost:${config.port}`);
});
