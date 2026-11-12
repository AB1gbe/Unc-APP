// Prices are in Bahraini Dinar (session 80): one formatter for the app,
// emails and link previews, only BHD accepted, and old prices converted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { formatMoney } from '../../shared/money.js';
import { setup } from './helpers.js';

const t = await setup();
const { openDb, TO_BHD_SQL } = await import('../src/db.js');

test('prices read "BD 120" in English and "120 د.ب" in Arabic', () => {
  assert.equal(formatMoney(120), 'BD 120');
  assert.equal(formatMoney(1250), 'BD 1,250');
  assert.equal(formatMoney(120, { lang: 'ar' }), '120 د.ب');
  assert.equal(formatMoney(1.5, { exact: true }), 'BD 1.500');
  assert.equal(formatMoney(0.25), 'BD 0.250', 'fils keep three decimals');
  assert.equal(formatMoney(null), null);
});

test('a new request is in BHD; another currency is refused', async () => {
  const buyer = await t.user();
  const l = await t.listing(buyer, { title: 'Need a kettle' });
  assert.equal(l.currency, 'BHD');
  await buyer.post('/api/listings').send({ title: 'Need a toaster', description: 'Two slots, any brand', category: 'Electronics', city: 'Manama', currency: 'USD' }).expect(400);
  await buyer.post('/api/listings').send({ title: 'Need a toaster', description: 'Two slots, any brand', category: 'Electronics', city: 'Manama', currency: 'BHD' }).expect(201);
});

test('old dollar prices become dinar, rounded to whole BD', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unc-bhd-'));
  const db = openDb(path.join(dir, 'x.db'));
  db.prepare(`INSERT INTO users (email, password_hash, display_name, account_type) VALUES ('a@x', 'h', 'A', 'individual'), ('b@x', 'h', 'B', 'business')`).run();
  const id = (cur, min, max) => Number(db.prepare(`INSERT INTO listings (buyer_id, title, description, category, budget_min, budget_max, currency, city)
    VALUES (1, 'T', 'Description', 'Electronics', ?, ?, ?, 'Manama')`).run(min, max, cur).lastInsertRowid);
  const usd = id('USD', 300, 1000);
  const bhd = id('BHD', 40, 60);
  const conv = Number(db.prepare('INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (?, 1, 2)').run(usd).lastInsertRowid);
  db.prepare(`INSERT INTO messages (conversation_id, sender_id, body, offer_price) VALUES (?, 2, 'Offer', 20)`).run(conv);
  db.exec(TO_BHD_SQL);
  assert.deepEqual({ ...db.prepare('SELECT budget_min, budget_max, currency FROM listings WHERE id = ?').get(usd) }, { budget_min: 115, budget_max: 375, currency: 'BHD' });
  assert.deepEqual({ ...db.prepare('SELECT budget_min, budget_max FROM listings WHERE id = ?').get(bhd) }, { budget_min: 40, budget_max: 60 }, 'BHD prices stay');
  assert.equal(db.prepare('SELECT offer_price FROM messages').get().offer_price, 8);
  db.exec(TO_BHD_SQL);
  assert.equal(db.prepare('SELECT budget_max FROM listings WHERE id = ?').get(usd).budget_max, 375, 'running it twice changes nothing');
  db.close();
});
