import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const buyer = await t.user();
const vendor = await t.user();
const otherVendor = await t.user();
const outsider = await t.user();
const listing = await t.listing(buyer);

test('there is no way to message a user directly', async () => {
  for (const path of ['/api/messages', '/api/conversations', `/api/users/${buyer.id}/messages`]) {
    const res = await vendor.post(path).send({ message: 'hi', userId: buyer.id });
    assert.ok([404, 405].includes(res.status), `${path} -> ${res.status}`);
  }
});

test('a vendor contacts the buyer about a specific listing', async () => {
  const res = await vendor.post(`/api/listings/${listing.id}/contact`).send({ message: 'I have one', offerPrice: 250 }).expect(201);
  assert.equal(res.body.conversation.listing.id, listing.id);
  assert.equal(res.body.conversation.myRole, 'vendor');
});

test('contacting twice about the same listing returns the existing conversation', async () => {
  const res = await vendor.post(`/api/listings/${listing.id}/contact`).send({ message: 'again' });
  assert.equal(res.status, 409);
  assert.ok(res.body.conversationId);
});

test('buyers cannot make offers on their own listing', async () => {
  await buyer.post(`/api/listings/${listing.id}/contact`).send({ message: 'me' }).expect(403);
});

test('unverified vendors cannot contact buyers', async () => {
  const u = await t.user('email');
  const res = await u.post(`/api/listings/${listing.id}/contact`).send({ message: 'hi' });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'KYC_REQUIRED');
});

test('buyer sees the conversation, replies, and outsiders cannot read it', async () => {
  const inbox = await buyer.get('/api/conversations').expect(200);
  assert.equal(inbox.body.conversations.length, 1);
  const conv = inbox.body.conversations[0];
  assert.equal(conv.myRole, 'buyer');
  assert.equal(conv.unread, 1);

  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Great, still available?' }).expect(201);
  const thread = await vendor.get(`/api/conversations/${conv.id}`).expect(200);
  assert.equal(thread.body.messages.length, 2);
  assert.equal(thread.body.messages[0].offerPrice, 250);

  await outsider.get(`/api/conversations/${conv.id}`).expect(404);
  await outsider.post(`/api/conversations/${conv.id}/messages`).send({ message: 'sneaky' }).expect(404);
});

test('each vendor gets their own separate conversation', async () => {
  await otherVendor.post(`/api/listings/${listing.id}/contact`).send({ message: 'Me too' }).expect(201);
  const list = await buyer.get(`/api/listings/${listing.id}/conversations`).expect(200);
  assert.equal(list.body.conversations.length, 2);
  const vendorInbox = await vendor.get('/api/conversations').expect(200);
  assert.equal(vendorInbox.body.conversations.length, 1);
});

test('closing the listing makes conversations read-only and blocks new contacts', async () => {
  await buyer.post(`/api/listings/${listing.id}/status`).send({ status: 'fulfilled' }).expect(200);
  const inbox = await vendor.get('/api/conversations').expect(200);
  const conv = inbox.body.conversations[0];
  assert.equal(conv.readOnly, true);
  await vendor.post(`/api/conversations/${conv.id}/messages`).send({ message: 'hello?' }).expect(409);
  await outsider.post(`/api/listings/${listing.id}/contact`).send({ message: 'late' }).expect(409);
  // and it disappears from public browse
  const browse = await t.request(t.app).get('/api/listings').expect(200);
  assert.ok(!browse.body.listings.some((l) => l.id === listing.id));
});

test('only the owner can change a listing', async () => {
  await vendor.post(`/api/listings/${listing.id}/status`).send({ status: 'open' }).expect(403);
});

test('participants can report a conversation and admins see it', async () => {
  const inbox = await buyer.get('/api/conversations').expect(200);
  await buyer.post('/api/reports').send({ conversationId: inbox.body.conversations[0].id, reason: 'Asked me to pay off-platform' }).expect(201);
  await outsider.post('/api/reports').send({ conversationId: inbox.body.conversations[0].id, reason: 'nosy outsider' }).expect(404);
  const reps = await t.admin.get('/api/admin/reports').expect(200);
  assert.equal(reps.body.reports.length, 1);
});

test('banned users lose access immediately', async () => {
  await t.admin.post(`/api/admin/users/${otherVendor.id}/ban`).send({ banned: true }).expect(200);
  await otherVendor.get('/api/conversations').expect(401);
});
