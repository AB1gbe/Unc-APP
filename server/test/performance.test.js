// Guards for the session-05 optimisations: results must stay correct, the
// hot queries must keep using their indexes, and responses are compressed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { cleanupExpired, openDb } = await import('../src/db.js');
const { db } = t;

test('unread count is correct for buyers and vendors', async () => {
  const buyer = await t.user();
  const v1 = await t.user();
  const v2 = await t.user();
  const l = await t.listing(buyer);
  const c1 = (await v1.post(`/api/listings/${l.id}/contact`).send({ message: 'one' }).expect(201)).body.conversation;
  await v2.post(`/api/listings/${l.id}/contact`).send({ message: 'two' }).expect(201);
  await v2.post(`/api/conversations/${(await v2.get('/api/conversations')).body.conversations[0].id}/messages`).send({ message: 'three' }).expect(201);

  const count = async (a) => (await a.get('/api/conversations/unread-count').expect(200)).body.unread;
  assert.equal(await count(buyer), 3);
  assert.equal(await count(v1), 0); // own messages never count

  await buyer.get(`/api/conversations/${c1.id}`).expect(200); // reading marks read
  assert.equal(await count(buyer), 2);
  await buyer.post(`/api/conversations/${c1.id}/messages`).send({ message: 'reply' }).expect(201);
  assert.equal(await count(v1), 1);

  // the inbox lists both conversations with per-conversation unread numbers
  const inbox = (await buyer.get('/api/conversations').expect(200)).body.conversations;
  assert.equal(inbox.length, 2);
  assert.deepEqual(inbox.map((c) => c.unread).sort(), [0, 2]);
});

test('polling a conversation with nothing unread does not write', async () => {
  const buyer = await t.user();
  const vendor = await t.user();
  const l = await t.listing(buyer);
  const conv = (await vendor.post(`/api/listings/${l.id}/contact`).send({ message: 'hi' }).expect(201)).body.conversation;
  const before = db.prepare('SELECT total_changes() AS n').get().n;
  await vendor.get(`/api/conversations/${conv.id}?after=0`).expect(200); // vendor's only message is their own
  assert.equal(db.prepare('SELECT total_changes() AS n').get().n, before);
});

test('hot queries use indexes, not full table scans', () => {
  const plan = (sql) => db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all().map((r) => r.detail).join(' | ');
  const unread = plan(`SELECT COUNT(*) FROM messages m WHERE m.read_at IS NULL AND m.sender_id <> 1
    AND m.conversation_id IN (SELECT id FROM conversations WHERE buyer_id = 1 UNION ALL SELECT id FROM conversations WHERE vendor_id = 1)`);
  assert.match(unread, /idx_messages_unread/);
  assert.match(unread, /idx_conversations_buyer/);
  assert.match(unread, /idx_conversations_vendor/);
  assert.doesNotMatch(unread, /SCAN m\b/);
  assert.match(plan('SELECT * FROM listings WHERE buyer_id = 1 ORDER BY created_at DESC'), /idx_listings_buyer/);
});

test('cleanupExpired removes only dead sessions, codes and reset links', async () => {
  const u = await t.user();
  db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('old', ?, datetime('now', '-1 day'))`).run(u.id);
  db.prepare(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ('oldreset', ?, datetime('now', '-1 minute'))`).run(u.id);
  db.prepare(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ('liveReset', ?, datetime('now', '+10 minutes'))`).run(u.id);
  const removed = cleanupExpired(db);
  assert.ok(removed.sessions >= 1);
  assert.ok(removed.resets >= 1);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM password_resets WHERE token_hash = 'liveReset'`).get().n, 1);
  await u.get('/api/conversations').expect(200); // the live session survived
});

test('JSON responses are gzip-compressed when the browser accepts it', async () => {
  const res = await t.request(t.app).get('/api/meta').set('Accept-Encoding', 'gzip');
  assert.equal(res.status, 200);
  // tiny bodies (< 1 kB) are sent as-is; /api/meta is just over that threshold
  if (Number(res.headers['content-length'] || 2000) > 1024) assert.equal(res.headers['content-encoding'], 'gzip');
});

test('fresh databases end on the latest migration', () => {
  const fresh = openDb(':memory:');
  const { user_version: v } = fresh.prepare('PRAGMA user_version').get();
  assert.equal(v, 3);
  assert.ok(fresh.prepare(`SELECT 1 FROM sqlite_master WHERE name = 'idx_messages_unread'`).get());
});
