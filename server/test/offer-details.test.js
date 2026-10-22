// Offer details: condition, warranty, returns, valid until (session 34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

test('a seller adds details to a price; the buyer sees them in the chat and in Compare offers', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a phone, details test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({
    message: 'Like new, boxed', offerPrice: 200, condition: 'like-new', warranty: '3m', returns: '3d', validUntil: day(5),
  }).expect(201)).body.conversation;
  const first = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  assert.deepEqual(first.details, { condition: 'like-new', warranty: '3m', returns: '3d', validUntil: day(5), expired: false });
  const compare = (await buyer.get(`/api/listings/${l.id}/conversations`)).body.conversations[0].compare;
  assert.equal(compare.details.warranty, '3m');

  // Wrong values, no price, a buyer, or a date too far away are refused.
  const send = (agent, body) => agent.post(`/api/conversations/${conv.id}/messages`).send(body);
  await send(seller, { offerPrice: 190, condition: 'mint' }).expect(400);
  await send(seller, { message: 'hello', warranty: '3m' }).expect(400, /price/);
  await send(buyer, { offerPrice: 150, condition: 'new' }).expect(400);
  await send(seller, { offerPrice: 190, validUntil: day(-1) }).expect(400, /60 days/);
  await send(seller, { offerPrice: 190, validUntil: day(61) }).expect(400);
  const plain = (await send(seller, { offerPrice: 190 }).expect(201)).body.message;
  assert.equal(plain.details, null);
});

test('an expired price can no longer be accepted', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a radio, expiry test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Got one', offerPrice: 50, validUntil: day(1) }).expect(201)).body.conversation;
  const msg = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  t.db.prepare('UPDATE messages SET offer_valid_until = ? WHERE id = ?').run(day(-1), msg.id); // two days later…
  const again = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  assert.equal(again.details.expired, true);
  await buyer.post(`/api/conversations/${conv.id}/messages/${msg.id}/respond`).send({ action: 'accept' }).expect(409, /expired/);
  await buyer.post(`/api/conversations/${conv.id}/messages/${msg.id}/respond`).send({ action: 'decline' }).expect(201);
});
