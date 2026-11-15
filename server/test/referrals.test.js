// Refer a friend (session 58).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { rewardReferral } = await import('../src/lib/referrals.js');
let n = 0;

// Sign up with an invite code and go as far as `stage`.
async function invited(code, stage = 'card') {
  n += 1;
  const agent = t.request.agent(t.app);
  const reg = await agent.post('/api/auth/register').send({
    email: `friend${n}@test.local`, password: 'Password123', displayName: `Friend ${n}`, accountType: 'individual', acceptTerms: true, ref: code,
  }).expect(201);
  agent.id = reg.body.user.id;
  await agent.post('/api/auth/verify-email').send({ code: reg.body.devCode }).expect(200);
  const sub = await t.kyc(agent, { idNumber: `REF-${n}-77${n}` }).expect(201);
  if (stage === 'kyc-only') return agent;
  await t.admin.post(`/api/admin/kyc/${sub.body.submission.id}/decision`).send({ decision: 'approved' }).expect(200);
  if (stage === 'approved') return agent;
  await agent.post('/api/payments/card').send({ token: 'tok_test_visa_4242_12_39' }).expect(201);
  return agent;
}
const balance = async (agent) => (await agent.get('/api/wallet')).body.balance;

test('every member gets one invite code and link', async () => {
  const u = await t.user();
  const a = (await u.get('/api/referrals').expect(200)).body;
  assert.match(a.code, /^[A-Z2-9]{8}$/);
  assert.match(a.link, new RegExp(`/register\\?ref=${a.code}$`));
  assert.equal((await u.get('/api/referrals')).body.code, a.code, 'the same code every time');
  assert.deepEqual([a.joined, a.verified, a.earned, a.reward, a.welcome, a.currency], [0, 0, 0, 1000, 500, 'BHD']);
});

test('the inviter is rewarded only when the friend is fully verified (email + ID check), and only once', async () => {
  const inviter = await t.user();
  const { code } = (await inviter.get('/api/referrals')).body;

  // Session 101: people no longer need a card, so the ID check is the last step.
  const pending = await invited(code.toLowerCase(), 'kyc-only'); // codes are not case-sensitive
  let r = (await inviter.get('/api/referrals')).body;
  assert.deepEqual([r.joined, r.verified, r.earned], [1, 0, 0], 'ID check not approved yet: no reward');
  assert.equal(await balance(inviter), 0);

  const sub = t.db.prepare('SELECT id FROM kyc_submissions WHERE user_id = ?').get(pending.id);
  await t.admin.post(`/api/admin/kyc/${sub.id}/decision`).send({ decision: 'approved' }).expect(200);
  r = (await inviter.get('/api/referrals')).body;
  assert.deepEqual([r.verified, r.earned], [1, 1000]);
  assert.equal(await balance(inviter), 1000);
  assert.equal(await balance(pending), 500, 'the friend gets a welcome credit');
  assert.ok((await inviter.get('/api/notifications')).body.notifications.some((x) => x.kind === 'referral-reward'));

  // Adding a card later, or calling it again, pays nothing more.
  await pending.post('/api/payments/card').send({ token: 'tok_test_visa_4242_12_39' }).expect(201);
  assert.equal(rewardReferral(t.db, pending.id), false);
  assert.equal(await balance(inviter), 1000);

  // A second friend: rewarded too, once.
  await invited(code, 'approved');
  assert.equal(await balance(inviter), 2000);
});

test('an unknown code is ignored, and nobody is rewarded', async () => {
  const friend = await invited('NOTACODE');
  assert.equal(t.db.prepare('SELECT referred_by FROM users WHERE id = ?').get(friend.id).referred_by, null);
  assert.equal(await balance(friend), 0);
});
