// Photos in chat (private) and managing request photos (session 13).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';

const t = await setup();

async function chat() {
  const buyer = await t.user();
  const vendor = await t.user();
  const l = await t.listing(buyer);
  const conv = (await vendor.post(`/api/listings/${l.id}/contact`).field('message', 'Here is mine').attach('image', PNG, 'item.png').expect(201)).body.conversation;
  return { buyer, vendor, l, conv };
}

test('an offer and a reply can carry a photo; text is optional with a photo', async () => {
  const { buyer, conv } = await chat();
  await buyer.post(`/api/conversations/${conv.id}/messages`).attach('image', PNG, 'mine.png').expect(201);
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({}).expect(400); // nothing at all
  const msgs = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.messages;
  assert.equal(msgs.length, 2);
  assert.ok(msgs.every((m) => /^\/api\/conversations\/\d+\/images\/[\w-]+\.png$/.test(m.imageUrl)));
  assert.equal(msgs[1].body, '');
});

test('chat photos are private to the two people in the conversation', async () => {
  const { buyer, vendor, conv } = await chat();
  const url = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0].imageUrl;
  await buyer.get(url).expect(200);
  await vendor.get(url).expect(200);
  const outsider = await t.user();
  await outsider.get(url).expect(404);
  await t.request(t.app).get(url).expect(401);
  await t.request(t.app).get(`/uploads/chat/${url.split('/').pop()}`).expect(404); // never served statically
});

test("a photo from one conversation can't be opened through another", async () => {
  const a = await chat();
  const b = await chat();
  const fileA = (await a.buyer.get(`/api/conversations/${a.conv.id}`)).body.messages[0].imageUrl.split('/').pop();
  // b's buyer is a participant of b, but the file belongs to a
  await b.buyer.get(`/api/conversations/${b.conv.id}/images/${fileA}`).expect(404);
});

test('a non-image file is rejected in chat', async () => {
  const { buyer, conv } = await chat();
  await buyer.post(`/api/conversations/${conv.id}/messages`).field('message', 'hi').attach('image', Buffer.from('nope'), 'x.png').expect(400);
});

test('request photos: add up to 6, remove one; only the owner', async () => {
  const buyer = await t.user();
  const l = await t.listing(buyer);
  let r = buyer.post(`/api/listings/${l.id}/images`);
  for (let i = 0; i < 4; i++) r = r.attach('images', PNG, `${i}.png`);
  const after4 = (await r.expect(201)).body.listing;
  assert.equal(after4.photos.length, 4);
  let tooMany = buyer.post(`/api/listings/${l.id}/images`);
  for (let i = 0; i < 3; i++) tooMany = tooMany.attach('images', PNG, `${i}.png`);
  assert.equal((await tooMany).status, 400); // 4 + 3 > 6
  const other = await t.user();
  await other.post(`/api/listings/${l.id}/images`).attach('images', PNG, 'x.png').expect(403);
  await other.delete(`/api/listings/${l.id}/images/${after4.photos[0].id}`).expect(403);
  const removed = (await buyer.delete(`/api/listings/${l.id}/images/${after4.photos[0].id}`).expect(200)).body.listing;
  assert.equal(removed.photos.length, 3);
  await t.request(t.app).get(after4.photos[0].url).expect(404); // file deleted
});

test('reported conversations: admins can see their photos (through the report)', async () => {
  const { buyer, conv } = await chat();
  await buyer.post('/api/reports').send({ conversationId: conv.id, reason: 'Suspicious photo' }).expect(201);
  const rep = (await t.admin.get('/api/admin/reports')).body.reports.find((x) => x.conversation_id === conv.id);
  const thread = (await t.admin.get(`/api/admin/reports/${rep.id}/conversation`).expect(200)).body;
  await t.admin.get(thread.messages[0].imageUrl).expect(200);
  await buyer.get(thread.messages[0].imageUrl).expect(403); // admin route is admins-only
});
