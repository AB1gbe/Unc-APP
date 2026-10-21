// Creates the admin account (always) and, when run directly with
// `npm run seed`, some demo users and requests so the app isn't empty.
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { openDb } from './db.js';
import { hashPassword } from './lib/crypto.js';

export async function ensureAdmin(db) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(config.adminEmail);
  if (exists) return exists.id;
  const info = db.prepare(`
    INSERT INTO users (email, password_hash, display_name, account_type, role, email_verified_at, kyc_status)
    VALUES (?, ?, 'Admin', 'individual', 'admin', datetime('now'), 'approved')
  `).run(config.adminEmail, await hashPassword(config.adminPassword));
  if (!config.isTest) console.log(`Created admin account ${config.adminEmail}`);
  return Number(info.lastInsertRowid);
}

async function seedDemo(db) {
  const pw = await hashPassword('Password123');
  const mk = (email, name, type, city) => {
    const found = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (found) return found.id;
    return Number(db.prepare(`
      INSERT INTO users (email, password_hash, display_name, account_type, city, email_verified_at, kyc_status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'approved')
    `).run(email, pw, name, type, city).lastInsertRowid);
  };
  const buyer = mk('buyer@demo.local', 'Sam Buyer', 'individual', 'Austin');
  mk('vendor@demo.local', 'Riverside Electronics', 'business', 'Austin');
  mk('freelancer@demo.local', 'Alex Finder', 'individual', 'Dallas');

  if (!db.prepare('SELECT 1 FROM listings WHERE buyer_id = ?').get(buyer)) {
    const add = db.prepare(`
      INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, city, needed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    add.run(buyer, 'Looking for a used PS5 with 2 controllers', 'Disc edition preferred. Must work perfectly, original box is a bonus.', 'Electronics', 300, 400, 'Austin', null);
    add.run(buyer, 'Need a solid oak dining table for 6', 'Rectangular, around 180cm. Light scratches are fine.', 'Home & Furniture', 200, 600, 'Austin', null);
    add.run(buyer, 'Someone to assemble IKEA wardrobe', 'PAX wardrobe, 2 doors. This Saturday if possible.', 'Services', 50, 120, 'Austin', null);
  }
  console.log('Demo data ready. Logins (password Password123): buyer@demo.local, vendor@demo.local, freelancer@demo.local');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDb();
  await ensureAdmin(db);
  await seedDemo(db);
}
