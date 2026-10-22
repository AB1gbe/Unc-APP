// "Download my data" and "Delete my account" (session 37).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PNG, setup } from './helpers.js';

const t = await setup();
const { runDeletions } = await import('../src/lib/deletion.js');
const { KYC_DIR } = await import('../src/lib/uploads.js');
const ago = (id, days) => t.db.prepare(`UPDATE users SET delete_requested_at = datetime('now', '-${days} days') WHERE id = ?`).run(id);

test('download my data: my profile, requests and my own messages, never a full ID number', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a lamp, export test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Seller words here' }).expect(201)).body.conversation;
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Buyer words here' }).expect(201);
  const res = await buyer.get('/api/auth/me/export').expect(200);
  assert.match(res.headers['content-disposition'], /attachment; filename="unc-my-data-/);
  const data = res.body;
  assert.equal(data.requests[0].title, 'Need a lamp, export test');
  assert.deepEqual(data.myMessages.map((m) => m.body), ['Buyer words here'], "the seller's messages are theirs, not mine");
  assert.equal(data.identityChecks[0].idNumberLast4.length, 4);
  assert.ok(!JSON.stringify(data).includes('password') && !JSON.stringify(data).includes('id_number_hash'));
});

test('delete my account: needs the password, can be cancelled, then everything personal is wiped after 7 days', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  await buyer.post('/api/auth/avatar').attach('avatar', PNG, 'a.png').expect(201);
  const l = await t.listing(buyer, { title: 'Need a desk, deletion test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  await buyer.post(`/api/conversations/${conv.id}/messages`).attach('image', PNG, 'p.png').expect(201);
  const kycFiles = t.db.prepare('SELECT doc_front, selfie FROM kyc_submissions WHERE user_id = ?').get(buyer.id);
  assert.ok(fs.existsSync(path.join(KYC_DIR(), kycFiles.doc_front)));

  const email = (await buyer.get('/api/auth/me')).body.user.email;
  await buyer.post('/api/auth/me/delete').send({ password: 'wrong-password1' }).expect(400);
  const me = (await buyer.post('/api/auth/me/delete').send({ password: 'Password123' }).expect(200)).body.user;
  assert.ok(me.deleteAt, 'the website shows when it will happen');
  assert.equal((await buyer.get(`/api/listings/${l.id}`)).body.listing.status, 'closed', 'open requests close straight away');
  assert.equal((await buyer.post('/api/auth/me/delete/cancel').expect(200)).body.user.deleteAt, null);

  await buyer.post('/api/auth/me/delete').send({ password: 'Password123' }).expect(200);
  ago(buyer.id, 6);
  assert.equal(runDeletions(t.db), 0, 'not before 7 days');
  ago(buyer.id, 8);
  assert.equal(runDeletions(t.db), 1);

  const row = t.db.prepare('SELECT * FROM users WHERE id = ?').get(buyer.id);
  assert.equal(row.display_name, 'Deleted member');
  assert.match(row.email, /@deleted\.invalid$/);
  assert.equal(row.avatar, null);
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM kyc_submissions WHERE user_id = ?').get(buyer.id).n, 0);
  assert.ok(!fs.existsSync(path.join(KYC_DIR(), kycFiles.doc_front)) && !fs.existsSync(path.join(KYC_DIR(), kycFiles.selfie)), 'ID photos are gone from disk');
  await buyer.get('/api/auth/me').expect(200).then((r) => assert.equal(r.body.user, null)); // logged out everywhere
  await t.request(t.app).post('/api/auth/login').send({ email, password: 'Password123' }).expect(401);
  // The seller's chat still makes sense, with the buyer as "Deleted member" and no photo.
  const c = (await seller.get(`/api/conversations/${conv.id}`).expect(200)).body;
  assert.equal(c.conversation.other.displayName, 'Deleted member');
  assert.ok(c.messages.every((m) => m.imageUrl === null || m.mine));
  await seller.get(`/api/members/${buyer.id}`).expect(404);
});

test('a banned member who deletes their account cannot verify a new one with the same ID', async () => {
  // A member verified with a known ID number.
  async function verified(idNumber) {
    const agent = await t.user('email');
    const sub = (await t.kyc(agent, { idNumber }).expect(201)).body.submission;
    await t.admin.post(`/api/admin/kyc/${sub.id}/decision`).send({ decision: 'approved' }).expect(200);
    return agent;
  }
  const bad = await verified('BAN-777001');
  await t.admin.post(`/api/admin/users/${bad.id}/ban`).send({ banned: true }).expect(200);
  ago(bad.id, 8);
  runDeletions(t.db);
  await t.kyc(await t.user('email'), { idNumber: 'BAN-777001' }).expect(409);

  // A normal member who deleted their account may come back later.
  const fine = await verified('OK-777002');
  ago(fine.id, 8);
  runDeletions(t.db);
  await t.kyc(await t.user('email'), { idNumber: 'OK-777002' }).expect(201);
});

test('admins cannot delete their account from the website', async () => {
  await t.admin.post('/api/auth/me/delete').send({ password: 'AdminPass123' }).expect(400);
});
