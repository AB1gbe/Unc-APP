// Thank-you note to the other sellers, and "Something went wrong" after a deal (session 34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { runExpiry } = await import('../src/lib/expiry.js');
const kinds = async (agent) => (await agent.get('/api/notifications')).body.notifications.map((n) => n.kind);

test('when the buyer picks one seller, the others get a polite note; closing tells everyone', async () => {
  const buyer = await t.user();
  const [a, b, c] = [await t.user(), await t.user(), await t.user()];
  const l = await t.listing(buyer, { title: 'Need a blender, closing test' });
  const convA = (await a.post(`/api/listings/${l.id}/contact`).send({ message: 'Have one' }).expect(201)).body.conversation;
  await b.post(`/api/listings/${l.id}/contact`).send({ message: 'Me too' }).expect(201);
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: convA.id }).expect(200);
  assert.ok((await kinds(a)).includes('deal') && !(await kinds(a)).includes('found-elsewhere'), 'the picked seller gets the deal, not a thank-you');
  assert.ok((await kinds(b)).includes('found-elsewhere'));
  // Changing the deal later doesn't send it again.
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'closed' }).expect(200);
  assert.equal((await kinds(b)).filter((k) => k === 'found-elsewhere' || k === 'request-closed').length, 1);

  const l2 = await t.listing(buyer, { title: 'Need a toaster, closing test' });
  await c.post(`/api/listings/${l2.id}/contact`).send({ message: 'Have one' }).expect(201);
  await buyer.post(`/api/listings/${l2.id}/status`).send({ status: 'closed' }).expect(200);
  const note = (await c.get('/api/notifications')).body.notifications.find((n) => n.kind === 'request-closed');
  assert.equal(note.listing.id, l2.id);
  assert.ok(note.conversationId);
});

test('a request that closes after 30 days thanks its sellers too', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a heater, expiry closing test' });
  await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Have one' }).expect(201);
  t.db.prepare(`UPDATE listings SET created_at = datetime('now', '-31 days') WHERE id = ?`).run(l.id);
  runExpiry(t.db);
  assert.ok((await kinds(seller)).includes('request-closed'));
});

test('either side of a deal can say something went wrong; it reaches the admins with the chat', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const outsider = await t.user();
  const l = await t.listing(buyer, { title: 'Need a drill, problem test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Have one' }).expect(201)).body.conversation;
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  const dealId = (await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.id;

  const problem = { kind: 'no-show', details: 'We agreed on Saturday at Seef Mall and they never came.' };
  await outsider.post(`/api/deals/${dealId}/problem`).send(problem).expect(404);
  await buyer.post(`/api/deals/${dealId}/problem`).send({ ...problem, kind: 'angry' }).expect(400);
  await buyer.post(`/api/deals/${dealId}/problem`).send({ ...problem, details: 'short' }).expect(400);
  await buyer.post(`/api/deals/${dealId}/problem`).send(problem).expect(201);
  await buyer.post(`/api/deals/${dealId}/problem`).send(problem).expect(409);
  assert.equal((await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.myProblem, 'open');
  assert.equal((await seller.get(`/api/conversations/${conv.id}`)).body.conversation.deal.myProblem, null, 'the other side is not told');

  const report = (await t.admin.get('/api/admin/reports')).body.reports.find((r) => r.deal_id === dealId);
  assert.equal(report.kind, 'no-show');
  assert.equal(report.conversation_id, conv.id);
  const thread = (await t.admin.get(`/api/admin/reports/${report.id}/conversation`).expect(200)).body;
  assert.equal(thread.messages[0].body, 'Have one');
  await t.admin.post(`/api/admin/reports/${report.id}/resolve`).expect(200);
  assert.equal((await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.myProblem, 'resolved');
  await buyer.post(`/api/deals/${dealId}/problem`).send(problem).expect(201); // can tell us again after that
});
