// Creates the admin account (always) and, when run directly with
// `npm run seed`, some demo users and requests so the app isn't empty.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { openDb, TO_BHD_SQL } from './db.js';
import { DEMO_ADS } from './demo-ads.js';
import { hashPassword } from './lib/crypto.js';
import { DEMO_BUYERS, DEMO_REQUESTS } from './demo-requests.js';
import { TERMS_VERSION } from './lib/terms.js';
import { AVATAR_DIR, CHAT_DIR, COVER_DIR, LISTING_DIR, STORY_DIR, saveFiles } from './lib/uploads.js';

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

// Example photos (session 54): illustrations in server/demo-photos/ (made by
// scripts/make-demo-photos.mjs), stored exactly like a member's upload:
// checked, and saved under a new random name.
const DEMO_PHOTOS = process.env.DEMO_PHOTOS_DIR || fileURLToPath(new URL('../demo-photos/', import.meta.url));
const demoPhoto = (dir, name) => saveFiles(dir(), [{ file: { buffer: fs.readFileSync(path.join(DEMO_PHOTOS, name)), fieldname: 'image' } }]).names[0];

function addDemoPhotos(db) {
  const userId = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
  // Profile photos and the shop's cover, unless already set.
  for (const [email, file] of [['buyer@demo.local', 'avatar-sam.jpg'], ['vendor@demo.local', 'avatar-riverside.jpg'], ['freelancer@demo.local', 'avatar-alex.jpg']]) {
    if (!db.prepare('SELECT avatar FROM users WHERE email = ?').get(email).avatar) {
      db.prepare('UPDATE users SET avatar = ? WHERE email = ?').run(demoPhoto(AVATAR_DIR, file), email);
    }
  }
  if (!db.prepare('SELECT cover FROM users WHERE email = ?').get('vendor@demo.local').cover) {
    db.prepare('UPDATE users SET cover = ? WHERE email = ?').run(demoPhoto(COVER_DIR, 'cover-riverside.jpg'), 'vendor@demo.local');
  }
  // A photo on each demo request that has none.
  const buyer = userId('buyer@demo.local');
  for (const [title, file] of [['Looking for a used PS5%', 'ps5-wanted.jpg'], ['Need a solid oak dining table%', 'oak-table.jpg'],
    ['Someone to assemble IKEA wardrobe%', 'wardrobe.jpg'], ['Wanted: iPhone 13 charger%', 'charger-case.jpg']]) {
    const l = db.prepare('SELECT id FROM listings WHERE buyer_id = ? AND title LIKE ?').get(buyer, title);
    if (l && !db.prepare('SELECT 1 FROM listing_images WHERE listing_id = ?').get(l.id)) {
      db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(l.id, demoPhoto(LISTING_DIR, file));
    }
  }
  // The two PS5 offers each come with a photo of the item (private to that chat).
  for (const [email, file] of [['vendor@demo.local', 'offer-ps5-boxed.jpg'], ['freelancer@demo.local', 'offer-ps5-disc.jpg']]) {
    const m = db.prepare(`
      SELECT m.id FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN listings l ON l.id = c.listing_id
      WHERE l.buyer_id = ? AND l.title LIKE 'Looking for a used PS5%' AND m.sender_id = ? AND m.offer_price IS NOT NULL AND m.image IS NULL
      ORDER BY m.id LIMIT 1
    `).get(buyer, userId(email));
    if (m) db.prepare('UPDATE messages SET image = ? WHERE id = ?').run(demoPhoto(CHAT_DIR, file), m.id);
  }
  // And the "found it" story gets its photo.
  const story = db.prepare('SELECT id FROM stories WHERE author_id = ? AND image IS NULL').get(buyer);
  if (story) db.prepare('UPDATE stories SET image = ? WHERE id = ?').run(demoPhoto(STORY_DIR, 'story-found-it.jpg'), story.id);
}

export async function seedDemo(db) {
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
  // More verified shops (session 72: Unc puts businesses first).
  const DEMO_SHOPS = [
    ['furniture@demo.local', 'Muharraq Home & Furniture', 'Muharraq', 'Road 1105, Muharraq', 'Solid wood dining sets, sofas and majlis furniture. Delivery and assembly across Bahrain.', ['Home & Furniture'], 'cover-furniture.jpg', 'avatar-furniture.jpg'],
    ['autoparts@demo.local', 'Riffa Auto Parts', 'East Riffa', 'Building 120, East Riffa', 'New and used parts for Japanese and American cars. We find what others don\'t stock.', ['Vehicles & Parts', 'Tools & DIY'], 'cover-autoparts.jpg', 'avatar-autoparts.jpg'],
    ['phonefix@demo.local', 'Manama Phone Fix', 'Manama', 'Manama Souq', 'Screens, batteries and repairs for all phones, same day. Original and tested parts.', ['Phones & Tablets', 'Electronics', 'Services'], 'cover-phonefix.jpg', 'avatar-phonefix.jpg'],
  ];
  for (const [email, name, city] of DEMO_SHOPS) mk(email, name, 'business', city);
  for (const [email, name, city] of DEMO_BUYERS) mk(email, name, 'individual', city);
  // Demo members have a test payment card (session 40), like everyone who joins.
  for (const email of ['buyer@demo.local', 'vendor@demo.local', 'freelancer@demo.local', ...DEMO_SHOPS.map((x) => x[0]), ...DEMO_BUYERS.map((x) => x[0])]) {
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
  // The wardrobe request is 28 days old, so the demo shows "⏳ Closes in 2 days" (session 56).
  db.prepare(`UPDATE listings SET created_at = datetime('now', '-28 days') WHERE buyer_id = ? AND title LIKE 'Someone to assemble IKEA wardrobe%' AND renewed_at IS NULL AND created_at > datetime('now', '-27 days')`).run(buyer);
  // Profiles: a few words and interests, so demo profiles aren't empty.
  const profile = db.prepare(`UPDATE users SET bio = COALESCE(bio, ?), interests = CASE WHEN interests = '[]' THEN ? ELSE interests END, onboarded_at = COALESCE(onboarded_at, datetime('now')) WHERE email = ?`);
  profile.run('Always hunting for good second-hand electronics and furniture.', JSON.stringify(['Electronics', 'Home & Furniture']), 'buyer@demo.local');
  profile.run('Family electronics shop since 2010. Phones, consoles and accessories, original parts only.', JSON.stringify(['Electronics', 'Phones & Tablets', 'Computers']), 'vendor@demo.local');
  profile.run('I find hard-to-get items and car parts for people. Quick and honest.', JSON.stringify(['Vehicles & Parts', 'Tools & DIY', 'Services']), 'freelancer@demo.local');
  // The demo shop has a shop page: its area and opening hours (closed Fridays).
  const hours = Array.from({ length: 7 }, (_, d) => (d === 5 ? null : { open: '09:00', close: '21:00' }));
  db.prepare('UPDATE users SET shop_area = COALESCE(shop_area, ?), shop_hours = COALESCE(shop_hours, ?) WHERE email = ?')
    .run('Block 428, Seef', JSON.stringify(hours), 'vendor@demo.local');
  for (const [email, , , area, bio, interests, cover, avatar] of DEMO_SHOPS) {
    profile.run(bio, JSON.stringify(interests), email);
    db.prepare('UPDATE users SET shop_area = COALESCE(shop_area, ?), shop_hours = COALESCE(shop_hours, ?) WHERE email = ?').run(area, JSON.stringify(hours), email);
    const u = db.prepare('SELECT cover, avatar FROM users WHERE email = ?').get(email);
    if (!u.cover) db.prepare('UPDATE users SET cover = ? WHERE email = ?').run(demoPhoto(COVER_DIR, cover), email);
    if (!u.avatar) db.prepare('UPDATE users SET avatar = ? WHERE email = ?').run(demoPhoto(AVATAR_DIR, avatar), email);
  }

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
  // Example requests in every category (session 72), each with a photo,
  // spread over the last two weeks and over three demo buyers.
  const buyers = DEMO_BUYERS.map(([email]) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id);
  DEMO_REQUESTS.forEach(([title, description, category, min, max, city, daysAgo, photo], n) => {
    const who = buyers[n % buyers.length];
    if (db.prepare('SELECT 1 FROM listings WHERE buyer_id = ? AND title = ?').get(who, title)) return;
    const id = Number(db.prepare(`
      INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, city, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `).run(who, title, description, category, min, max, city, `-${daysAgo} days`, `-${daysAgo} days`).lastInsertRowid);
    db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(id, demoPhoto(LISTING_DIR, photo));
  });
  // Demo prices are written in dollars above; turn them into Bahraini Dinar (session 80).
  db.exec(TO_BHD_SQL);
  // Housing and Jobs ads (session 82), already in BD.
  for (const [email, section, category, title, description, price, priceMax, city, daysAgo, bedrooms, furnished, jobType, condition = 'any', photo] of DEMO_ADS) {
    const who = db.prepare('SELECT id FROM users WHERE email = ?').get(email)?.id;
    if (!who) continue;
    const old = db.prepare('SELECT id FROM listings WHERE buyer_id = ? AND title = ?').get(who, title);
    if (old) {
      // A demo ad made before it had a photo (session 85: housing photos) gets it now.
      if (photo && !db.prepare('SELECT 1 FROM listing_images WHERE listing_id = ?').get(old.id)) {
        db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(old.id, demoPhoto(LISTING_DIR, photo));
      }
      continue;
    }
    const id = Number(db.prepare(`
      INSERT INTO listings (buyer_id, section, title, description, category, budget_min, budget_max, currency, city, bedrooms, furnished, job_type, item_condition, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'BHD', ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `).run(who, section, title, description, category, price, priceMax, city, bedrooms, furnished, jobType, condition, `-${daysAgo} days`, `-${daysAgo} days`).lastInsertRowid);
    if (photo) db.prepare('INSERT INTO listing_images (listing_id, file) VALUES (?, ?)').run(id, demoPhoto(LISTING_DIR, photo));
  }
  // Everything the seed made is sample data (session 77): labelled "Sample"
  // and left out of live counters and the activity list.
  const demoIds = db.prepare(`SELECT id FROM users WHERE email LIKE '%@demo.local'`).all().map((u) => u.id);
  db.prepare(`UPDATE listings SET sample = 1 WHERE buyer_id IN (${demoIds.map(() => '?').join(',')})`).run(...demoIds);
  for (const [like, cond] of [['Looking for a used PS5%', 'used'], ['iPhone 14 Pro%', 'used'], ['MacBook Air%', 'used'], ['Front-load washing%', 'used'],
    ['Car tyres%', 'new'], ['Oud perfume%', 'new'], ['Split AC%', 'new'], ['Sony noise%', 'used']]) {
    db.prepare(`UPDATE listings SET item_condition = ? WHERE title LIKE ? AND item_condition = 'any'`).run(cond, like);
  }
  addDemoPhotos(db);
  console.log('Demo data ready (with example photos). Logins (password Password123): buyer@demo.local, vendor@demo.local, freelancer@demo.local, furniture@demo.local, autoparts@demo.local, phonefix@demo.local, fatima@demo.local, hussain@demo.local, noor@demo.local');
}

if (import.meta.url?.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDb();
  await ensureAdmin(db);
  await seedDemo(db);
}
