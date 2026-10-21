// "Active now", reply time and "Seen by N people" (session 20).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { activityQueries } = await import('../src/lib/activity.js');
const activity = activityQueries(t.db);

test('last seen is recorded, and shown only to logged-in members', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer);
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Hi there' }).expect(201)).body.conversation;
  const other = (await seller.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation.otherActivity;
  assert.ok(other.lastSeenAt, 'the buyer was just active');
  assert.equal(other.replyTime, null, 'not enough conversations yet');

  const asMember = (await seller.get(`/api/members/${buyer.id}`).expect(200)).body.member;
  assert.ok(asMember.activity.lastSeenAt);
  const asVisitor = (await t.request(t.app).get(`/api/members/${buyer.id}`).expect(200)).body.member;
  assert.equal(asVisitor.activity, undefined, 'strangers do not see when someone was online');
  assert.ok((await seller.get(`/api/listings/${l.id}`).expect(200)).body.listing.buyer.activity.lastSeenAt);
  assert.equal((await t.request(t.app).get(`/api/listings/${l.id}`).expect(200)).body.listing.buyer.activity, undefined);
});

test('reply time: the median over at least 3 conversations, in buckets', async () => {
  const buyer = await t.user();
  const sellers = [await t.user(), await t.user(), await t.user()];
  const minutesToReply = [10, 30, 200]; // median 30 -> "within an hour"
  for (const [i, s] of sellers.entries()) {
    const l = await t.listing(buyer, { title: `Need item number ${i + 1}` });
    const conv = (await s.post(`/api/listings/${l.id}/contact`).send({ message: 'I have it' }).expect(201)).body.conversation;
    await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Great' }).expect(201);
    // Move the seller's first message back in time so the gap is real.
    t.db.prepare(`UPDATE messages SET created_at = datetime(created_at, ?) WHERE conversation_id = ? AND sender_id = ?`)
      .run(`-${minutesToReply[i]} minutes`, conv.id, s.id);
    if (i < 2) assert.equal(activity.replyTime(buyer.id), null, 'fewer than 3 is not enough');
  }
  assert.equal(activity.replyTime(buyer.id), 'hour');
  t.db.prepare(`UPDATE messages SET created_at = datetime(created_at, '-10 hours') WHERE sender_id IN (?, ?, ?)`).run(...sellers.map((s) => s.id));
  assert.equal(activity.replyTime(buyer.id), 'day');
});

test('"Seen by N people": each logged-in member once, never the buyer, only the buyer sees it', async () => {
  const buyer = await t.user();
  const a = await t.user();
  const b = await t.user();
  const l = await t.listing(buyer);
  await a.get(`/api/listings/${l.id}`).expect(200);
  await a.get(`/api/listings/${l.id}`).expect(200);
  await b.get(`/api/listings/${l.id}`).expect(200);
  await buyer.get(`/api/listings/${l.id}`).expect(200);
  await t.request(t.app).get(`/api/listings/${l.id}`).expect(200);
  assert.equal((await buyer.get(`/api/listings/${l.id}`).expect(200)).body.listing.viewCount, 2);
  assert.equal((await a.get(`/api/listings/${l.id}`).expect(200)).body.listing.viewCount, undefined);
  const mine = (await buyer.get('/api/listings/mine').expect(200)).body.listings.find((x) => x.id === l.id);
  assert.equal(mine.viewCount, 2);
});

test('"Hide when I\'m online": nobody sees it, nothing is stored, and it can be turned back off', async () => {
  const shy = await t.user();
  const other = await t.user();
  const lastSeen = () => t.db.prepare('SELECT last_seen_at FROM users WHERE id = ?').get(shy.id).last_seen_at;
  assert.equal((await shy.get('/api/auth/me').expect(200)).body.user.hideActivity, false, 'off by default');
  assert.ok(lastSeen());

  await shy.patch('/api/auth/me').send({ hideActivity: 'yes' }).expect(400);
  const me = (await shy.patch('/api/auth/me').send({ hideActivity: true }).expect(200)).body.user;
  assert.equal(me.hideActivity, true);
  assert.equal(lastSeen(), null, 'the stored visit is forgotten');
  await shy.get('/api/listings/mine').expect(200);
  assert.equal(lastSeen(), null, 'new visits are not recorded');
  assert.equal((await other.get(`/api/members/${shy.id}`).expect(200)).body.member.activity.lastSeenAt, null);

  // Even an old value left in the database is never shown.
  t.db.prepare(`UPDATE users SET last_seen_at = datetime('now') WHERE id = ?`).run(shy.id);
  assert.equal(activity.summaryFor(shy.id).lastSeenAt, null);

  await shy.patch('/api/auth/me').send({ hideActivity: false }).expect(200);
  t.db.prepare('UPDATE users SET last_seen_at = NULL WHERE id = ?').run(shy.id);
  await shy.get('/api/listings/mine').expect(200);
  assert.ok(lastSeen(), 'recorded again once switched off');
  assert.ok((await other.get(`/api/members/${shy.id}`).expect(200)).body.member.activity.lastSeenAt);
});
