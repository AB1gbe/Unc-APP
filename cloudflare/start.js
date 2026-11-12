// Starts the normal Unc server inside the Durable Object (session 79).
import { httpServerHandler } from 'cloudflare:node';
import { openDb, cleanupExpired } from '../server/src/db.js';
import { createApp } from '../server/src/app.js';
import { ensureAdmin, seedDemo } from '../server/src/seed.js';
import { runExpiry } from '../server/src/lib/expiry.js';
import { runDeletions } from '../server/src/lib/deletion.js';
import { askDidYouGetIt } from '../server/src/lib/notify.js';
import { runInstallmentReminders } from '../server/src/lib/installments.js';
import fs from 'node:fs';

const PORT = 8787;
const DEMO_PHOTOS = ['ps5-wanted.jpg', 'oak-table.jpg', 'wardrobe.jpg', 'offer-ps5-boxed.jpg', 'offer-ps5-disc.jpg', 'charger-case.jpg',
  'story-found-it.jpg', 'avatar-sam.jpg', 'avatar-riverside.jpg', 'avatar-alex.jpg', 'cover-riverside.jpg',
  'cover-furniture.jpg', 'avatar-furniture.jpg', 'cover-autoparts.jpg', 'avatar-autoparts.jpg', 'cover-phonefix.jpg', 'avatar-phonefix.jpg'];

export async function start(env) {
  const db = openDb(process.env.DB_FILE || '/data/unc.sqlite');
  // The admin account is only created once the owner has set their own
  // ADMIN_PASSWORD secret: the default password is public (session 79).
  if (env.ADMIN_PASSWORD) await ensureAdmin(db);
  else console.warn('ADMIN_PASSWORD is not set: no admin account yet. Add it in the dashboard (Settings → Variables and Secrets).');
  // A test site starts with the demo data (SEED_DEMO=1), once.
  if (env.SEED_DEMO === '1' && !db.prepare(`SELECT 1 FROM users WHERE email = 'buyer@demo.local'`).get()) {
    const { DEMO_REQUESTS } = await import('../server/src/demo-requests.js');
    const names = [...DEMO_PHOTOS, ...DEMO_REQUESTS.map((r) => r[7])];
    for (const name of names) {
      const res = await env.ASSETS.fetch(new Request(`https://assets.local/demo-photos/${name}`));
      if (res.ok) fs.writeFileSync(`${process.env.DEMO_PHOTOS_DIR}/${name}`, new Uint8Array(await res.arrayBuffer()));
    }
    await seedDemo(db);
  }
  const app = createApp(db);
  app.listen(PORT);
  const handler = httpServerHandler({ port: PORT });
  return {
    handle: (request) => handler.fetch(request),
    hourly: () => { cleanupExpired(db); runExpiry(db); runDeletions(db); askDidYouGetIt(db); runInstallmentReminders(db); },
  };
}
