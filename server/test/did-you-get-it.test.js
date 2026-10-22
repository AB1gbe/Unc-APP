// "Did you get it?" (session 40).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { askDidYouGetIt } = await import('../src/lib/notify.js');

test('3 days after an accepted price, the buyer is asked once to mark it found', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a kettle, got-it test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Got one', offerPrice: 20 }).expect(201)).body.conversation;
  const offer = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  await buyer.post(`/api/conversations/${conv.id}/messages/${offer.id}/respond`).send({ action: 'accept' }).expect(201);
  assert.equal(askDidYouGetIt(t.db), 0, 'not straight away');
  t.db.prepare(`UPDATE messages SET created_at = datetime('now', '-4 days') WHERE conversation_id = ? AND kind = 'accept'`).run(conv.id);
  assert.equal(askDidYouGetIt(t.db), 1);
  assert.equal(askDidYouGetIt(t.db), 0, 'only once');
  const note = (await buyer.get('/api/notifications')).body.notifications.find((n) => n.kind === 'did-you-get-it');
  assert.equal(note.listing.id, l.id);
  assert.equal(note.actor.id, seller.id);

  // Requests already marked found are never asked about.
  const l2 = await t.listing(buyer, { title: 'Need a toaster, got-it test' });
  const c2 = (await seller.post(`/api/listings/${l2.id}/contact`).send({ message: 'Got one', offerPrice: 30 }).expect(201)).body.conversation;
  const o2 = (await buyer.get(`/api/conversations/${c2.id}`)).body.messages[0];
  await buyer.post(`/api/conversations/${c2.id}/messages/${o2.id}/respond`).send({ action: 'accept' }).expect(201);
  await buyer.post(`/api/listings/${l2.id}/status`).send({ status: 'fulfilled', conversationId: c2.id }).expect(200);
  t.db.prepare(`UPDATE messages SET created_at = datetime('now', '-4 days') WHERE conversation_id = ? AND kind = 'accept'`).run(c2.id);
  assert.equal(askDidYouGetIt(t.db), 0);
});
