// Saved requests: "♥ Save for later" (session 13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const savedTitles = async (a) => (await a.get('/api/listings/saved').expect(200)).body.listings.map((l) => l.title);

test('save, list, unsave; the request page knows it is saved', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const a = await t.listing(buyer, { title: 'Saved request A' });
  const b = await t.listing(buyer, { title: 'Saved request B' });

  await seller.put(`/api/listings/${a.id}/save`).expect(200);
  await seller.put(`/api/listings/${b.id}/save`).expect(200);
  await seller.put(`/api/listings/${b.id}/save`).expect(200); // twice is fine
  assert.deepEqual((await savedTitles(seller)).sort(), ['Saved request A', 'Saved request B']);
  assert.equal((await seller.get(`/api/listings/${a.id}`).expect(200)).body.listing.saved, true);

  await seller.delete(`/api/listings/${a.id}/save`).expect(200);
  assert.deepEqual(await savedTitles(seller), ['Saved request B']);
  assert.equal((await seller.get(`/api/listings/${a.id}`).expect(200)).body.listing.saved, false);
  assert.deepEqual(await savedTitles(buyer), [], 'saved lists are per member');
});

test('closed requests drop off the saved list; own, missing and logged-out saves are refused', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Will be fulfilled' });
  await seller.put(`/api/listings/${l.id}/save`).expect(200);
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled' }).expect(200);
  assert.ok(!(await savedTitles(seller)).includes('Will be fulfilled'));
  await seller.put(`/api/listings/${l.id}/save`).expect(404);

  const own = await t.listing(buyer, { title: 'My own request' });
  await buyer.put(`/api/listings/${own.id}/save`).expect(400);
  await seller.put('/api/listings/999999/save').expect(404);
  await t.request(t.app).put(`/api/listings/${own.id}/save`).expect(401);
  await t.request(t.app).get('/api/listings/saved').expect(401);
});
