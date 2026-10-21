// Offer cards in the chat (session 20): accept / decline the other side's
// price with one tap, and counter-offers from the buyer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

async function chat() {
  const buyer = await t.user();
  const seller = await t.user();
  const listing = await t.listing(buyer);
  const conv = (await seller.post(`/api/listings/${listing.id}/contact`).send({ message: 'I have one', offerPrice: 300 }).expect(201)).body.conversation;
  const msgs = async (a = buyer) => (await a.get(`/api/conversations/${conv.id}`).expect(200)).body.messages;
  const respond = (a, messageId, action) => a.post(`/api/conversations/${conv.id}/messages/${messageId}/respond`).send({ action });
  return { buyer, seller, listing, conv, msgs, respond };
}

test('the buyer accepts the seller\'s offer: one tap, once', async () => {
  const { buyer, seller, msgs, respond } = await chat();
  const offer = (await msgs())[0];
  await respond(seller, offer.id, 'accept').expect(400); // not your own price
  const accepted = (await respond(buyer, offer.id, 'accept').expect(201)).body.message;
  assert.equal(accepted.kind, 'accept');
  assert.equal(accepted.replyTo, offer.id);
  assert.equal(accepted.body, '');
  await respond(buyer, offer.id, 'decline').expect(409); // already answered

  const inbox = (await seller.get('/api/conversations').expect(200)).body.conversations[0];
  assert.equal(inbox.lastKind, 'accept');
});

test('a buyer counter-offer (price, no text), declined by the seller; old prices can no longer be answered', async () => {
  const { buyer, seller, msgs, respond } = await chat();
  const offer = (await msgs())[0];
  const counter = (await buyer.post(`/api/conversations/${(await buyer.get('/api/conversations')).body.conversations[0].id}/messages`).send({ offerPrice: 250 }).expect(201)).body.message;
  assert.equal(counter.offerPrice, 250);
  assert.equal(counter.body, '');
  await respond(buyer, offer.id, 'accept').expect(409); // a newer price exists
  await respond(seller, counter.id, 'decline').expect(201);
  assert.deepEqual((await msgs(seller)).map((m) => m.kind), [null, null, 'decline']);
});

test('no answers on plain messages, closed requests, or for outsiders; no empty messages', async () => {
  const { buyer, seller, listing, conv, msgs, respond } = await chat();
  const plain = (await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Hello' }).expect(201)).body.message;
  await respond(buyer, plain.id, 'accept').expect(400);
  await respond(buyer, (await msgs())[0].id, 'maybe').expect(400);
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({}).expect(400);
  const stranger = await t.user();
  await respond(stranger, (await msgs())[0].id, 'accept').expect(404);
  await seller.post(`/api/conversations/${conv.id}/messages`).send({ offerPrice: 280 }).expect(201);
  await buyer.post(`/api/listings/${listing.id}/status`).send({ status: 'closed' }).expect(200);
  await respond(buyer, (await msgs()).at(-1).id, 'accept').expect(409);
});
