// Away mode (session 37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

test('an away seller gets no alerts or favourite heads-ups, and others see "away until"', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  await seller.post('/api/alerts').send({ category: 'Electronics' }).expect(201);
  await buyer.put(`/api/members/${seller.id}/favourite`).expect(200);
  await seller.patch('/api/auth/me').send({ awayUntil: day(-1) }).expect(400);
  await seller.patch('/api/auth/me').send({ awayUntil: day(61) }).expect(400);
  assert.equal((await seller.patch('/api/auth/me').send({ awayUntil: day(5) }).expect(200)).body.user.awayUntil, day(5));

  await t.listing(buyer, { title: 'Need a speaker, away test', category: 'Electronics' });
  const kinds = (await seller.get('/api/notifications')).body.notifications.map((n) => n.kind);
  assert.ok(!kinds.includes('alert-match') && !kinds.includes('favourite-request'));
  assert.equal((await buyer.get(`/api/members/${seller.id}`)).body.member.activity.awayUntil, day(5));

  // Back: everything as before.
  assert.equal((await seller.patch('/api/auth/me').send({ awayUntil: null }).expect(200)).body.user.awayUntil, null);
  await t.listing(buyer, { title: 'Need a radio, away test', category: 'Electronics' });
  assert.ok((await seller.get('/api/notifications')).body.notifications.some((n) => n.kind === 'favourite-request'));
});

test('messages that arrived while away do not make the reply time slow', async () => {
  const seller = await t.user();
  const buyers = [await t.user(), await t.user(), await t.user()];
  const convs = [];
  for (const [i, b] of buyers.entries()) {
    const l = await t.listing(b, { title: `Need a chair number ${i}, reply test` });
    const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
    await b.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Is it still available?' }).expect(201);
    await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Yes it is' }).expect(201);
    convs.push(conv.id);
  }
  // Make every buyer question 3 days old, answered just now: slow.
  for (const id of convs) {
    t.db.prepare(`UPDATE messages SET created_at = datetime('now', '-3 days') WHERE conversation_id = ? AND sender_id <> ?`).run(id, seller.id);
  }
  t.db.prepare(`UPDATE messages SET created_at = datetime('now', '-4 days') WHERE conversation_id IN (${convs.join(',')}) AND sender_id = ? AND body = 'I have one'`).run(seller.id);
  const replyTime = async () => (await buyers[0].get(`/api/members/${seller.id}`)).body.member.activity.replyTime;
  assert.equal(await replyTime(), 'days');
  // ...but the seller was away then: those don't count, so there's not enough to judge.
  t.db.prepare(`INSERT INTO away_periods (user_id, starts_at, ends_at) VALUES (?, datetime('now', '-5 days'), datetime('now', '-1 hour'))`).run(seller.id);
  assert.equal(await replyTime(), null);
});
