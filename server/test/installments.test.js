// Paying in parts, agreed between buyer and seller (session 40).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { dueDates, runInstallmentReminders, splitAmount } = await import('../src/lib/installments.js');
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const kinds = async (a) => (await a.get('/api/notifications')).body.notifications.map((n) => n.kind);

test('split and schedule: equal parts (remainder first), weekly or monthly dates', () => {
  assert.deepEqual(splitAmount(100, 3), [34, 33, 33]);
  assert.deepEqual(dueDates('2026-01-31', 3, 'month'), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.deepEqual(dueDates('2026-01-01', 3, '2weeks'), ['2026-01-01', '2026-01-15', '2026-01-29']);
});

async function agreedChat(price = 300) {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a laptop, installments test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one', offerPrice: price }).expect(201)).body.conversation;
  return { buyer, seller, conv };
}

test('a plan needs an agreed price; then it is proposed, accepted, paid and confirmed', async () => {
  const { buyer, seller, conv } = await agreedChat(300);
  const body = { parts: 3, every: 'month', firstDue: day(1) };
  await buyer.post(`/api/conversations/${conv.id}/plan`).send(body).expect(409, /Agree a price/);
  const offer = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  await buyer.post(`/api/conversations/${conv.id}/messages/${offer.id}/respond`).send({ action: 'accept' }).expect(201);

  await buyer.post(`/api/conversations/${conv.id}/plan`).send({ ...body, parts: 7 }).expect(400);
  await buyer.post(`/api/conversations/${conv.id}/plan`).send({ ...body, firstDue: day(40) }).expect(400);
  const plan = (await buyer.post(`/api/conversations/${conv.id}/plan`).send(body).expect(201)).body.plan;
  assert.equal(plan.status, 'proposed');
  assert.equal(plan.provider, 'seller');
  assert.deepEqual(plan.parts.map((p) => p.amount), [100, 100, 100]);
  await buyer.post(`/api/conversations/${conv.id}/plan`).send(body).expect(409, /already/);
  assert.ok((await kinds(seller)).includes('plan-proposed'));

  await buyer.post(`/api/plans/${plan.id}/respond`).send({ action: 'accept' }).expect(400, /own plan/);
  assert.equal((await seller.post(`/api/plans/${plan.id}/respond`).send({ action: 'accept' }).expect(200)).body.plan.status, 'active');

  await seller.post(`/api/plans/${plan.id}/parts/1/paid`).expect(403);
  await buyer.post(`/api/plans/${plan.id}/parts/1/paid`).expect(200);
  assert.ok((await kinds(seller)).includes('part-paid'));
  await buyer.post(`/api/plans/${plan.id}/parts/1/confirm`).expect(403);
  for (const n of [1, 2, 3]) await seller.post(`/api/plans/${plan.id}/parts/${n}/confirm`).expect(200);
  const done = (await buyer.get(`/api/conversations/${conv.id}/plan`)).body.plan;
  assert.equal(done.status, 'completed');
  assert.equal(done.paid, 300);

  // Outsiders see nothing.
  await (await t.user()).get(`/api/conversations/${conv.id}/plan`).expect(404);
});

test('reminders: the day before a part is due, and both sides when it is 3 days late', async () => {
  const { buyer, seller, conv } = await agreedChat(200);
  const offer = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  await buyer.post(`/api/conversations/${conv.id}/messages/${offer.id}/respond`).send({ action: 'accept' }).expect(201);
  const plan = (await seller.post(`/api/conversations/${conv.id}/plan`).send({ parts: 2, every: 'week', firstDue: day(1) }).expect(201)).body.plan;
  await buyer.post(`/api/plans/${plan.id}/respond`).send({ action: 'accept' }).expect(200);
  runInstallmentReminders(t.db);
  assert.equal((await kinds(buyer)).filter((k) => k === 'part-due').length, 1);
  runInstallmentReminders(t.db);
  assert.equal((await kinds(buyer)).filter((k) => k === 'part-due').length, 1, 'only once per part');

  t.db.prepare(`UPDATE installment_parts SET due_on = ? WHERE plan_id = ? AND n = 1`).run(day(-4), plan.id);
  runInstallmentReminders(t.db);
  assert.ok((await kinds(buyer)).includes('part-late') && (await kinds(seller)).includes('part-late'));
  assert.equal((await buyer.get(`/api/conversations/${conv.id}/plan`)).body.plan.parts[0].late, true);
});
