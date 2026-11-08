// Live counters and "Closes in N days" (session 56).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('the pulse counts real requests, offers and active members, and anyone can see it', async () => {
  const before = (await t.request(t.app).get('/api/feed/pulse').expect(200)).body;
  assert.deepEqual(Object.keys(before).sort(), ['active', 'offers', 'requests']);
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a fan, pulse test' });
  await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201);
  const old = await t.listing(buyer, { title: 'Older request, pulse test' });
  t.db.prepare(`UPDATE listings SET created_at = datetime('now', '-2 days') WHERE id = ?`).run(old.id);
  // The answer is cached for a minute; ask a fresh app to see the new numbers.
  const { feedRoutes } = await import('../src/routes/feed.js');
  const express = (await import('express')).default;
  const fresh = express().use('/pulse', feedRoutes(t.db));
  const now = (await t.request(fresh).get('/pulse/pulse').expect(200)).body;
  assert.equal(now.requests, before.requests + 1, 'only requests from the last 24 hours');
  assert.equal(now.offers, before.offers + 1);
  assert.ok(now.active >= 2, 'the two members who just used the app');
});

test('open requests say when they close; closed ones do not', async () => {
  const buyer = await t.user();
  const l = await t.listing(buyer, { title: 'Need a lamp, closing badge test' });
  t.db.prepare(`UPDATE listings SET created_at = datetime('now', '-28 days') WHERE id = ?`).run(l.id);
  const card = (await t.request(t.app).get('/api/listings').expect(200)).body.listings.find((x) => x.id === l.id);
  const daysLeft = (Date.parse(`${card.closesAt.replace(' ', 'T')}Z`) - Date.now()) / 86_400_000;
  assert.ok(daysLeft > 1.9 && daysLeft < 2.1, `about 2 days left, got ${daysLeft}`);
  await buyer.post(`/api/listings/${l.id}/renew`).expect(200);
  const renewed = (await buyer.get(`/api/listings/${l.id}`)).body.listing;
  assert.ok(Date.parse(`${renewed.closesAt.replace(' ', 'T')}Z`) - Date.now() > 29 * 86_400_000, '"Keep it open" moves it 30 days on');
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'closed' }).expect(200);
  assert.equal((await buyer.get(`/api/listings/${l.id}`)).body.listing.closesAt, undefined);
});

test('closingDays: only the last 3 days, "today" under 24 hours', async () => {
  const { closingDays } = await import('../../client/src/closing.js');
  const now = Date.parse('2026-11-08T12:00:00Z');
  assert.equal(closingDays('2026-11-08 20:00:00', now), 0);
  assert.equal(closingDays('2026-11-10 13:00:00', now), 2);
  assert.equal(closingDays('2026-11-11 11:00:00', now), 3, '2 days 23 hours rounds to 3');
  assert.equal(closingDays('2026-11-10 11:59:00', now), 2, '1 day 23 hours is "2 days", not "1" (M106)');
  assert.equal(closingDays('2026-11-09 13:00:00', now), 1);
  assert.equal(closingDays('2026-11-12 13:00:00', now), null, 'more than 3 days: no badge');
  assert.equal(closingDays('2026-11-08 11:00:00', now), null, 'already past');
  assert.equal(closingDays(undefined, now), null);
});
