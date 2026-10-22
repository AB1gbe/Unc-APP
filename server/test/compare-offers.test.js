// "Compare offers" (session 31): everything the buyer needs to choose.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';

const t = await setup();

test('each offer shows the latest price, agreed price, first photo and message, badges and unread count', async () => {
  const buyer = await t.user();
  const a = await t.user();
  const b = await t.user('approved', 'business');
  const l = await t.listing(buyer);
  const ca = (await a.post(`/api/listings/${l.id}/contact`).field('message', 'Blue one, like new').field('offerPrice', '200').attach('image', PNG, 'p.png').expect(201)).body.conversation;
  await a.post(`/api/conversations/${ca.id}/messages`).send({ offerPrice: 180 }).expect(201); // a lower price later
  const cb = (await b.post(`/api/listings/${l.id}/contact`).send({ message: 'Red one, boxed', offerPrice: 250 }).expect(201)).body.conversation;
  const msgs = (await buyer.get(`/api/conversations/${cb.id}`)).body.messages;
  await buyer.post(`/api/conversations/${cb.id}/messages/${msgs[0].id}/respond`).send({ action: 'accept' }).expect(201);

  const list = (await buyer.get(`/api/listings/${l.id}/conversations`).expect(200)).body.conversations;
  const byId = Object.fromEntries(list.map((c) => [c.id, c.compare]));
  assert.equal(byId[ca.id].price, 180, 'the latest price from that seller');
  assert.equal(byId[ca.id].agreedPrice, null);
  assert.equal(byId[ca.id].firstMessage, 'Blue one, like new');
  assert.match(byId[ca.id].photoUrl, new RegExp(`^/api/conversations/${ca.id}/images/`));
  await buyer.get(byId[ca.id].photoUrl).expect(200); // the buyer may open it
  assert.equal(byId[ca.id].unread, 2);
  assert.equal(byId[cb.id].agreedPrice, 250);
  assert.equal(byId[cb.id].photoUrl, null);
  assert.ok(byId[cb.id].badges.includes('new'));

  await a.get(`/api/listings/${l.id}/conversations`).expect(404); // sellers can't compare each other
});
