// Proof photos with the chat's code (session 34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG, setup } from './helpers.js';

const t = await setup();

test('each chat has its own code; the buyer asks, the seller sends a proof photo', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a camera, proof test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  const other = (await (await t.user()).post(`/api/listings/${l.id}/contact`).send({ message: 'Me too' }).expect(201)).body.conversation;

  const code = (await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.proofCode;
  assert.match(code, /^UNC-\d{4}$/);
  assert.equal((await seller.get(`/api/conversations/${conv.id}`)).body.conversation.proofCode, code, 'both sides see the same code');
  const otherCode = (await buyer.get(`/api/conversations/${other.id}`)).body.conversation.proofCode;
  assert.notEqual(otherCode, code, 'every chat has its own code');

  await seller.post(`/api/conversations/${conv.id}/proof-request`).expect(403);
  const ask = (await buyer.post(`/api/conversations/${conv.id}/proof-request`).expect(201)).body.message;
  assert.equal(ask.kind, 'proof-ask');
  await buyer.post(`/api/conversations/${conv.id}/proof-request`).expect(409, /already asked/);
  assert.equal((await seller.get('/api/conversations')).body.conversations.find((c) => c.id === conv.id).lastKind, 'proof-ask');

  // Only the seller, and only with a photo.
  await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'here', proof: true }).expect(400);
  await buyer.post(`/api/conversations/${conv.id}/messages`).field('proof', '1').attach('image', PNG, 'p.png').expect(400);
  const sent = (await seller.post(`/api/conversations/${conv.id}/messages`).field('proof', '1').attach('image', PNG, 'p.png').expect(201)).body.message;
  assert.equal(sent.proof, true);
  const plain = (await seller.post(`/api/conversations/${conv.id}/messages`).attach('image', PNG, 'q.png').expect(201)).body.message;
  assert.equal(plain.proof, false);

  // Compare offers shows which sellers sent one; the buyer may ask again.
  const compare = (await buyer.get(`/api/listings/${l.id}/conversations`)).body.conversations;
  assert.deepEqual(Object.fromEntries(compare.map((c) => [c.id, c.compare.hasProof])), { [conv.id]: true, [other.id]: false });
  await buyer.post(`/api/conversations/${conv.id}/proof-request`).expect(201);
});
