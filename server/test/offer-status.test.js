// Offers on a request page (session 77): stock and pickup/delivery on an
// offer, and the seller seeing where their offer stands.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('an offer carries stock and hand-over; the seller sees sent → seen → accepted', async () => {
  const buyer = await t.user();
  const shop = await t.user('approved', 'business');
  const l = await t.listing(buyer, { title: 'Washing machine 8kg' });
  const conv = (await shop.post(`/api/listings/${l.id}/contact`).send({ message: 'LG 8kg, delivered and installed', offerPrice: 140, stock: 'in-stock', delivery: 'both', warranty: '6m' }).expect(201)).body.conversation;
  const other = await t.user('approved', 'business');
  await other.post(`/api/listings/${l.id}/contact`).send({ message: 'bad stock value', offerPrice: 1, stock: 'maybe' }).expect(400);

  let mine = (await shop.get(`/api/listings/${l.id}`).expect(200)).body.listing.myOffer;
  assert.equal(mine.status, 'sent');

  const msgs = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.messages; // opening marks it read
  const offer = msgs.find((m) => m.offerPrice === 140);
  assert.equal(offer.details.stock, 'in-stock');
  assert.equal(offer.details.delivery, 'both');
  mine = (await shop.get(`/api/listings/${l.id}`)).body.listing.myOffer;
  assert.equal(mine.status, 'seen');
  assert.ok(mine.seenAt);

  await buyer.post(`/api/conversations/${conv.id}/messages/${offer.id}/respond`).send({ action: 'accept' }).expect(201);
  assert.equal((await shop.get(`/api/listings/${l.id}`)).body.listing.myOffer.status, 'accepted');
  // The buyer and visitors never get myOffer.
  assert.equal((await buyer.get(`/api/listings/${l.id}`)).body.listing.myOffer, undefined);
});
