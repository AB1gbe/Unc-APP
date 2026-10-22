// Creates the admin account (always) and, when run directly with
// `npm run seed`, some demo users and requests so the app isn't empty.
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { openDb } from './db.js';
import { hashPassword } from './lib/crypto.js';
import { TERMS_VERSION } from './lib/terms.js';

export async function ensureAdmin(db) {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(config.adminEmail);
  if (exists) return exists.id;
  const info = db.prepare(`
    INSERT INTO users (email, password_hash, display_name, account_type, role, email_verified_at, kyc_status, terms_version, terms_accepted_at)
    VALUES (?, ?, 'Admin', 'individual', 'admin', datetime('now'), 'approved', ?, datetime('now'))
  `).run(config.adminEmail, await hashPassword(config.adminPassword), TERMS_VERSION);
  if (!config.isTest) console.log(`Created admin account ${config.adminEmail}`);
  return Number(info.lastInsertRowid);
}

async function seedDemo(db) {
  const pw = await hashPassword('Password123');
  const mk = (email, name, type, city) => {
    const found = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (found) return found.id;
    return Number(db.prepare(`
      INSERT INTO users (email, password_hash, display_name, account_type, city, email_verified_at, kyc_status, terms_version, terms_accepted_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'approved', ?, datetime('now'))
    `).run(email, pw, name, type, city, TERMS_VERSION).lastInsertRowid);
  };
  const buyer = mk('buyer@demo.local', 'Sam Buyer', 'individual', 'Juffair');
  mk('vendor@demo.local', 'Riverside Electronics', 'business', 'Seef');
  mk('freelancer@demo.local', 'Alex Finder', 'individual', 'Riffa');
  // Demo members have a test payment card (session 40), like everyone who joins.
  for (const email of ['buyer@demo.local', 'vendor@demo.local', 'freelancer@demo.local']) {
    const id = db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
    db.prepare(`INSERT OR IGNORE INTO payment_cards (user_id, provider, provider_ref, brand, last4, exp_month, exp_year) VALUES (?, 'test', 'tok_test_visa_4242_12_39', 'visa', '4242', 12, 2039)`).run(id);
    db.prepare(`UPDATE users SET card_added_at = COALESCE(card_added_at, datetime('now')) WHERE id = ?`).run(id);
  }

  if (!db.prepare('SELECT 1 FROM listings WHERE buyer_id = ?').get(buyer)) {
    const add = db.prepare(`
      INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, city, needed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    add.run(buyer, 'Looking for a used PS5 with 2 controllers', 'Disc edition preferred. Must work perfectly, original box is a bonus.', 'Electronics', 300, 400, 'Juffair', null);
    add.run(buyer, 'Need a solid oak dining table for 6', 'Rectangular, around 180cm. Light scratches are fine.', 'Home & Furniture', 200, 600, 'Juffair', null);
    add.run(buyer, 'Someone to assemble IKEA wardrobe', 'PAX wardrobe, 2 doors. This Saturday if possible.', 'Services', 50, 120, 'Juffair', null);
  }
  // Profiles: a few words and interests, so demo profiles aren't empty.
  const profile = db.prepare(`UPDATE users SET bio = COALESCE(bio, ?), interests = CASE WHEN interests = '[]' THEN ? ELSE interests END, onboarded_at = COALESCE(onboarded_at, datetime('now')) WHERE email = ?`);
  profile.run('Always hunting for good second-hand electronics and furniture.', JSON.stringify(['Electronics', 'Home & Furniture']), 'buyer@demo.local');
  profile.run('Family electronics shop since 2010. Phones, consoles and accessories, original parts only.', JSON.stringify(['Electronics', 'Phones & Tablets', 'Computers']), 'vendor@demo.local');
  profile.run('I find hard-to-get items and car parts for people. Quick and honest.', JSON.stringify(['Vehicles & Parts', 'Tools & DIY', 'Services']), 'freelancer@demo.local');
  // The demo shop has a shop page: its area and opening hours (closed Fridays).
  const hours = Array.from({ length: 7 }, (_, d) => (d === 5 ? null : { open: '09:00', close: '21:00' }));
  db.prepare('UPDATE users SET shop_area = COALESCE(shop_area, ?), shop_hours = COALESCE(shop_hours, ?) WHERE email = ?')
    .run('Block 428, Seef', JSON.stringify(hours), 'vendor@demo.local');

  // One finished, rated deal so profiles and star ratings have something to show.
  const shop = db.prepare('SELECT id FROM users WHERE email = ?').get('vendor@demo.local').id;
  if (!db.prepare('SELECT 1 FROM deals WHERE buyer_id = ? AND vendor_id = ?').get(buyer, shop)) {
    const listingId = Number(db.prepare(`
      INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, city, status)
      VALUES (?, 'Wanted: iPhone 13 charger and case', 'Original Apple charger and a clear case.', 'Phones & Tablets', 20, 60, 'Juffair', 'fulfilled')
    `).run(buyer).lastInsertRowid);
    const convId = Number(db.prepare('INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (?, ?, ?)').run(listingId, buyer, shop).lastInsertRowid);
    const msg = db.prepare('INSERT INTO messages (conversation_id, sender_id, body, offer_price, read_at) VALUES (?, ?, ?, ?, datetime(\'now\'))');
    msg.run(convId, shop, 'We have both in stock, boxed.', 45);
    msg.run(convId, buyer, 'Perfect, I will pick them up today.', null);
    const dealId = Number(db.prepare('INSERT INTO deals (listing_id, conversation_id, buyer_id, vendor_id) VALUES (?, ?, ?, ?)').run(listingId, convId, buyer, shop).lastInsertRowid);
    const rate = db.prepare('INSERT INTO ratings (deal_id, rater_id, ratee_id, stars, comment) VALUES (?, ?, ?, ?, ?)');
    rate.run(dealId, buyer, shop, 5, 'Friendly, fast, and exactly what I asked for.');
    rate.run(dealId, shop, buyer, 5, 'On time and easy to deal with.');
    db.prepare('INSERT INTO stories (deal_id, author_id, body) VALUES (?, ?, ?)')
      .run(dealId, buyer, 'Got the charger and case the same afternoon — thanks Riverside! 🙌');
  }
  // Two offers on the PS5 request, so "Compare offers" has something to show.
  const ps5 = db.prepare(`SELECT id FROM listings WHERE buyer_id = ? AND title LIKE 'Looking for a used PS5%'`).get(buyer)?.id;
  if (ps5 && !db.prepare('SELECT 1 FROM conversations WHERE listing_id = ?').get(ps5)) {
    const finder = db.prepare('SELECT id FROM users WHERE email = ?').get('freelancer@demo.local').id;
    // With offer details (session 34): the shop gives a warranty, the finder doesn't.
    for (const [seller, text, price, condition, warranty, returns] of [
      [shop, 'Disc edition, 2 controllers, boxed. 6 months old.', 380, 'like-new', '3m', '3d'],
      [finder, 'I can get a disc edition with 2 controllers by tomorrow.', 340, 'good', 'none', 'none'],
    ]) {
      const conv = Number(db.prepare('INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (?, ?, ?)').run(ps5, buyer, seller).lastInsertRowid);
      db.prepare('INSERT INTO messages (conversation_id, sender_id, body, offer_price, offer_condition, offer_warranty, offer_returns) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(conv, seller, text, price, condition, warranty, returns);
    }
  }
  console.log('Demo data ready. Logins (password Password123): buyer@demo.local, vendor@demo.local, freelancer@demo.local');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDb();
  await ensureAdmin(db);
  await seedDemo(db);
}
