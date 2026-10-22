// Report follow-up and "Raise my budget" (session 37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const kinds = async (agent) => (await agent.get('/api/notifications')).body.notifications.map((n) => n.kind);

test('the reporter hears that the team acted (or found nothing), without details', async () => {
  const buyer = await t.user();
  const reporter = await t.user();
  const l = await t.listing(buyer, { title: 'Suspicious request, report test' });
  await reporter.post('/api/reports').send({ listingId: l.id, reason: 'Looks like a scam' }).expect(201);
  await reporter.post('/api/reports').send({ listingId: l.id, reason: 'Second report, same thing' }).expect(201);
  const [r1, r2] = (await t.admin.get('/api/admin/reports')).body.reports.filter((r) => r.listing_id === l.id);
  await t.admin.post(`/api/admin/reports/${r1.id}/resolve`).send({ outcome: 'maybe' }).expect(400);
  await t.admin.post(`/api/admin/reports/${r1.id}/resolve`).send({ outcome: 'action' }).expect(200);
  await t.admin.post(`/api/admin/reports/${r2.id}/resolve`).send({ outcome: 'nothing' }).expect(200);
  const notes = (await reporter.get('/api/notifications')).body.notifications;
  assert.deepEqual(notes.map((n) => n.kind).sort(), ['kyc_approved', 'report-action', 'report-no-action']);
  assert.equal(notes.find((n) => n.kind === 'report-action').listing.id, l.id);
  assert.equal(notes.find((n) => n.kind === 'report-action').actor, null, 'nothing about the other person');
  // Resolving again doesn't notify twice; without an outcome nobody is told.
  await t.admin.post(`/api/admin/reports/${r1.id}/resolve`).send({ outcome: 'action' }).expect(200);
  assert.equal((await kinds(reporter)).filter((k) => k === 'report-action').length, 1);
  assert.equal((await kinds(buyer)).some((k) => k.startsWith('report')), false);
});

test('raising the budget tells sellers who looked or saved it, once a day', async () => {
  const buyer = await t.user();
  const [looker, saver, offered, never] = [await t.user(), await t.user(), await t.user(), await t.user()];
  const l = await t.listing(buyer, { title: 'Need a bike, budget test', budgetMin: 100, budgetMax: 200 });
  await looker.get(`/api/listings/${l.id}`).expect(200);
  await saver.put(`/api/listings/${l.id}/save`).expect(200);
  await offered.get(`/api/listings/${l.id}`).expect(200);
  await offered.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201);

  await looker.post(`/api/listings/${l.id}/budget`).send({ budgetMax: 300 }).expect(403);
  await buyer.post(`/api/listings/${l.id}/budget`).send({ budgetMax: 150 }).expect(400, /higher/);
  const res = (await buyer.post(`/api/listings/${l.id}/budget`).send({ budgetMax: 300 }).expect(200)).body;
  assert.equal(res.listing.budgetMax, 300);
  assert.equal(res.told, 2);
  assert.ok((await kinds(looker)).includes('budget-raised'));
  assert.ok((await kinds(saver)).includes('budget-raised'));
  assert.ok(!(await kinds(offered)).includes('budget-raised'), 'sellers already talking to the buyer know');
  assert.ok(!(await kinds(never)).includes('budget-raised'));
  await buyer.post(`/api/listings/${l.id}/budget`).send({ budgetMax: 400 }).expect(409, /once a day/);
});
