// Blocking and scam warnings (session 31).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { scamSignals } from '../../client/src/scam.js';

const t = await setup();

test('a blocked seller can no longer offer or message; the buyer stops seeing their requests', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l1 = await t.listing(buyer, { title: 'Need a lamp, blocked test' });
  const conv = (await seller.post(`/api/listings/${l1.id}/contact`).send({ message: 'Got one' }).expect(201)).body.conversation;
  const sellersRequest = await t.listing(seller, { title: 'Seller also wants a chair' });

  await buyer.post(`/api/members/${buyer.id}/block`).expect(400);
  await buyer.post(`/api/members/${seller.id}/block`).expect(200);
  assert.deepEqual((await buyer.get('/api/blocks').expect(200)).body.members.map((m) => m.id), [seller.id]);

  await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Hello?' }).expect(409);
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Hi' }).expect(409, /can't message/);
  const l2 = await t.listing(buyer, { title: 'Need a mirror, blocked test' });
  await seller.post(`/api/listings/${l2.id}/contact`).send({ message: 'I have one' }).expect(403);
  // and the other way round: the buyer can't offer on the blocked member's request
  await buyer.post(`/api/listings/${sellersRequest.id}/contact`).send({ message: 'I have one' }).expect(403);

  const c = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation;
  assert.deepEqual([c.blocked, c.iBlocked], [true, true]);
  const s = (await seller.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation;
  assert.deepEqual([s.blocked, s.iBlocked], [true, false], 'the seller only sees that replies are off');

  const browse = (await buyer.get('/api/listings').expect(200)).body.listings.map((l) => l.id);
  assert.ok(!browse.includes(sellersRequest.id), "the blocked member's requests are hidden");
  assert.ok((await t.request(t.app).get('/api/listings')).body.listings.some((l) => l.id === sellersRequest.id), 'still public for others');

  await buyer.delete(`/api/members/${seller.id}/block`).expect(200);
  await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Hello again' }).expect(201);
});

test('blocked members get no favourite heads-up or alert about the blocker\'s requests', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  await seller.post('/api/alerts').send({ category: 'Electronics' }).expect(201);
  await buyer.put(`/api/members/${seller.id}/favourite`).expect(200);
  await buyer.post(`/api/members/${seller.id}/block`).expect(200);
  assert.equal((await buyer.get(`/api/members/${seller.id}`)).body.member.favourite, false, 'blocking removes the favourite');
  await t.listing(buyer, { title: 'Need a phone, block test', category: 'Electronics' });
  const kinds = (await seller.get('/api/notifications')).body.notifications.map((n) => n.kind);
  assert.ok(!kinds.includes('alert-match') && !kinds.includes('favourite-request'));
});

test('scam warnings spot pay-first, bank account numbers and links, in English and Arabic', () => {
  assert.deepEqual(scamSignals('Please send a deposit first and I will ship it'), ['payment']);
  assert.deepEqual(scamSignals('ادفع عربون ٢٠ دينار'), ['payment']);
  assert.deepEqual(scamSignals('My IBAN is BH67 BMAG 0000 1299 1234 56'), ['iban']);
  assert.deepEqual(scamSignals('See photos at www.cheap-ps5.biz'), ['link']);
  assert.deepEqual(scamSignals('Transfer to BH67BMAG00001299123456 at http://x.co'), ['payment', 'iban', 'link']);
  for (const ok of ['Hi! I have a PS5 disc edition, 6 months old.', 'Can we meet at Seef Mall at 5?', 'مرحبا، متى نلتقي؟', 'Price 380, 2 controllers']) {
    assert.deepEqual(scamSignals(ok), [], ok);
  }
});
