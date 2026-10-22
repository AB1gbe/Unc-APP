// The owner dashboard (session 37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('admins see requests, offers and deals per day, the share answered and time to first offer', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const a = await t.listing(buyer, { title: 'Old request with an offer', category: 'Electronics', city: 'Manama' });
  const b = await t.listing(buyer, { title: 'Old request without an offer', category: 'Electronics', city: 'Riffa' });
  await t.listing(buyer, { title: 'Brand new request today', category: 'Garden', city: 'Austin' });
  // a and b were posted two days ago; a got its first offer 3 hours after posting.
  t.db.prepare(`UPDATE listings SET created_at = datetime('now', '-2 days') WHERE id IN (?, ?)`).run(a.id, b.id);
  const conv = (await seller.post(`/api/listings/${a.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  t.db.prepare(`UPDATE conversations SET created_at = datetime('now', '-2 days', '+3 hours') WHERE id = ?`).run(conv.id);
  await buyer.post(`/api/listings/${a.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);

  await buyer.get('/api/admin/metrics').expect(403);
  const m = (await t.admin.get('/api/admin/metrics?days=7').expect(200)).body;
  assert.equal(m.days, 7);
  assert.equal(m.daily.length, 7);
  assert.deepEqual(m.totals, { requests: 3, offers: 1, deals: 1, members: m.totals.members });
  assert.equal(m.daily.at(-3).requests, 2, 'two requests two days ago');
  assert.equal(m.answeredShare, 50, "today's request is too new to count");
  assert.equal(m.firstOfferHours, 3);
  assert.deepEqual(m.categories[0], { name: 'Electronics', n: 2 });
  assert.deepEqual(m.areas.map((x) => x.name).sort(), ['Capital', 'Other', 'Southern']);
  assert.equal((await t.admin.get('/api/admin/metrics?days=12345').expect(200)).body.days, 30, 'unknown ranges fall back to 30 days');
});
