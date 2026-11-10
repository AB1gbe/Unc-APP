// Get Help (session 60): members ask the Unc team; admins answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { runDeletions } = await import('../src/lib/deletion.js');
const ask = (agent, message = 'How do I get my shop verified faster?', topic = 'verification') =>
  agent.post('/api/support').send({ topic, message });

test('a member asks, an admin answers, the member is told and can follow up', async () => {
  const m = await t.user('email'); // help is open before identity checks too
  const q = (await ask(m).expect(201)).body.ticket;
  assert.equal(q.status, 'open');
  assert.deepEqual(q.messages.map((x) => x.fromTeam), [false]);

  const list = (await t.admin.get('/api/support/admin').expect(200)).body.tickets;
  const seen = list.find((x) => x.id === q.id);
  assert.ok(seen, 'admins see open questions');
  assert.equal(seen.member.id, m.id);

  await t.admin.post(`/api/support/admin/${q.id}/reply`).send({ message: 'Upload a clear CR copy and we review within a day.' }).expect(200);
  const mine = (await m.get('/api/support').expect(200)).body.tickets[0];
  assert.equal(mine.status, 'answered');
  assert.deepEqual(mine.messages.map((x) => x.fromTeam), [false, true]);
  assert.ok((await m.get('/api/notifications')).body.notifications.some((x) => x.kind === 'support-reply'));

  await m.post(`/api/support/${q.id}/messages`).send({ message: 'Thanks, done.' }).expect(201);
  assert.equal((await m.get('/api/support')).body.tickets[0].status, 'open', 'a follow-up puts it back in the queue');

  await m.post(`/api/support/${q.id}/close`).expect(200);
  await m.post(`/api/support/${q.id}/messages`).send({ message: 'One more thing' }).expect(409);
});

test('members only ever see their own questions, and only admins can answer', async () => {
  const a = await t.user();
  const b = await t.user();
  const q = (await ask(a).expect(201)).body.ticket;
  assert.equal((await b.get('/api/support')).body.tickets.length, 0);
  await b.post(`/api/support/${q.id}/messages`).send({ message: 'hello there' }).expect(404);
  await b.post(`/api/support/${q.id}/close`).expect(404);
  await b.get('/api/support/admin').expect(403);
  await b.post(`/api/support/admin/${q.id}/reply`).send({ message: 'I am not staff' }).expect(403);
  await t.request(t.app).post('/api/support').send({ topic: 'other', message: 'no login here at all' }).expect(401);
});

test('checks the topic, the length and the number of open questions', async () => {
  const m = await t.user();
  await ask(m, 'too short').expect(400);
  await ask(m, 'A real question about something', 'gossip').expect(400);
  for (let i = 0; i < 3; i += 1) await ask(m).expect(201);
  await ask(m).expect(409);
  const first = (await m.get('/api/support')).body.tickets.at(-1);
  await m.post(`/api/support/${first.id}/close`).expect(200);
  await ask(m).expect(201);
  // Admins can't reopen the closed one either: that would make it 4 open.
  await t.admin.post(`/api/support/admin/${first.id}/reply`).send({ message: 'Late answer' }).expect(409);
  assert.equal(t.db.prepare(`SELECT COUNT(*) AS n FROM support_tickets WHERE user_id = ? AND status <> 'closed'`).get(m.id).n, 3);
});

test('questions are in "Download my data" and go when the account is deleted', async () => {
  const m = await t.user();
  await ask(m).expect(201);
  const data = (await m.get('/api/auth/me/export').expect(200)).body;
  assert.equal(data.helpQuestions.length, 1);
  await m.post('/api/auth/me/delete').send({ password: 'Password123' }).expect(200);
  t.db.prepare(`UPDATE users SET delete_requested_at = datetime('now', '-8 days') WHERE id = ?`).run(m.id);
  runDeletions(t.db);
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM support_tickets WHERE user_id = ?').get(m.id).n, 0);
});
