// "Still looking?" expiry and request tips (session 31).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { requestTips } from '../../client/src/tips.js';

const t = await setup();
const { runExpiry } = await import('../src/lib/expiry.js');
const age = (id, days) => t.db.prepare(`UPDATE listings SET created_at = datetime('now', ?) WHERE id = ?`).run(`-${days} days`, id);
const kinds = async (a) => (await a.get('/api/notifications')).body.notifications.map((n) => n.kind);

test('a reminder 3 days before, once; "keep it open" starts again; after 30 days it closes', async () => {
  const buyer = await t.user();
  const l = await t.listing(buyer, { title: 'Need a lamp, expiry test' });
  let d = (await buyer.get(`/api/listings/${l.id}`)).body.listing;
  assert.ok(d.expiresAt > d.createdAt, 'the buyer sees when it closes');

  age(l.id, 28);
  runExpiry(t.db);
  runExpiry(t.db); // a second run doesn't remind again
  assert.equal((await kinds(buyer)).filter((k) => k === 'expiring').length, 1);

  await buyer.post(`/api/listings/${l.id}/renew`).expect(200);
  runExpiry(t.db);
  d = (await buyer.get(`/api/listings/${l.id}`)).body.listing;
  assert.equal(d.status, 'open');

  t.db.prepare(`UPDATE listings SET renewed_at = datetime('now', '-31 days') WHERE id = ?`).run(l.id);
  assert.deepEqual(runExpiry(t.db), { reminded: 0, expired: 1 });
  d = (await buyer.get(`/api/listings/${l.id}`)).body.listing;
  assert.equal(d.status, 'closed');
  assert.ok(d.expiredAt);
  assert.ok((await kinds(buyer)).includes('expired'));
  await buyer.post(`/api/listings/${l.id}/renew`).expect(409); // closed: reopen instead

  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'open' }).expect(200);
  assert.deepEqual(runExpiry(t.db), { reminded: 0, expired: 0 }, 'reopening starts a fresh 30 days');
  const other = await t.user();
  await other.post(`/api/listings/${l.id}/renew`).expect(403);
});

test('tips: photo, details, budget, quiet, share', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const base = { images: ['x'], description: 'Rectangular oak table for six, light scratches are fine.', budgetMin: 100, budgetMax: 300, createdAt: '2026-10-21 12:00:00', status: 'open' };
  assert.deepEqual(requestTips(base, { offers: 1, views: 3, now }), []);
  assert.deepEqual(requestTips({ ...base, images: [] }, { offers: 1, views: 3, now }), ['photo']);
  assert.deepEqual(requestTips({ ...base, description: 'Table' }, { offers: 1, views: 3, now }), ['details']);
  assert.deepEqual(requestTips({ ...base, budgetMin: null, budgetMax: null }, { offers: 1, views: 3, now }), ['budget']);
  assert.deepEqual(requestTips({ ...base, createdAt: '2026-10-19 12:00:00' }, { offers: 0, views: 5, now }), ['quiet']);
  assert.deepEqual(requestTips(base, { offers: 0, views: 0, now }), ['share']);
  assert.deepEqual(requestTips({ ...base, status: 'closed', images: [] }, { offers: 0, views: 0, now }), [], 'only for open requests');
  assert.equal(requestTips({ ...base, images: [], description: 'x', budgetMin: null, budgetMax: null }, { offers: 0, views: 0, now }).length, 2, 'at most 2 at a time');
});
