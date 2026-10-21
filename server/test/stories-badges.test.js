// "Found it" stories and earned badges (session 20).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';

const t = await setup();

// A finished deal between a new buyer and seller.
async function deal() {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a desk lamp' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  const d = (await buyer.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation.deal;
  return { buyer, seller, conv, dealId: d.id };
}

test('either side shares a story once; it shows on Home and both profiles; the author can remove it', async () => {
  const { buyer, seller, conv, dealId } = await deal();
  assert.equal((await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.myStory, false);
  await buyer.post(`/api/deals/${dealId}/story`).field('story', 'Got it in an hour, thanks!').attach('image', PNG, 'lamp.png').expect(201);
  await buyer.post(`/api/deals/${dealId}/story`).field('story', 'Again').expect(409);
  await seller.post(`/api/deals/${dealId}/story`).send({ story: 'Lovely buyer, smooth deal.' }).expect(201);
  assert.equal((await buyer.get(`/api/conversations/${conv.id}`)).body.conversation.deal.myStory, true);

  const stories = (await t.request(t.app).get('/api/stories').expect(200)).body.stories;
  const mine = stories.find((s) => s.author.id === buyer.id);
  assert.equal(mine.body, 'Got it in an hour, thanks!');
  assert.equal(mine.other.id, seller.id);
  assert.equal(mine.listingTitle, 'Need a desk lamp');
  await t.request(t.app).get(mine.imageUrl).expect(200); // public photo

  const profile = (await t.request(t.app).get(`/api/members/${seller.id}`).expect(200)).body;
  assert.equal(profile.stories.length, 2, 'stories by and about the seller');

  await seller.delete(`/api/stories/${mine.id}`).expect(404); // not the author
  await buyer.delete(`/api/stories/${mine.id}`).expect(200);
  await t.request(t.app).get(mine.imageUrl).expect(404); // photo removed too
});

test('only people in the deal, real text; admins can hide a story', async () => {
  const { buyer, dealId } = await deal();
  const stranger = await t.user();
  await stranger.post(`/api/deals/${dealId}/story`).send({ story: 'I was not there' }).expect(404);
  await buyer.post(`/api/deals/${dealId}/story`).send({ story: 'ok' }).expect(400);
  await buyer.post(`/api/deals/${dealId}/story`).send({ story: 'x'.repeat(281) }).expect(400);
  await buyer.post(`/api/deals/${dealId}/story`).send({ story: 'Great experience overall' }).expect(201);
  const id = (await t.request(t.app).get('/api/stories')).body.stories.find((s) => s.author.id === buyer.id).id;
  await buyer.post(`/api/admin/stories/${id}/hide`).expect(403);
  await t.admin.post(`/api/admin/stories/${id}/hide`).expect(200);
  assert.ok(!(await t.request(t.app).get('/api/stories')).body.stories.some((s) => s.id === id));
});

test('badges are earned from real activity', async () => {
  const { buyer, seller } = await deal();
  const badges = async (u) => (await t.request(t.app).get(`/api/members/${u.id}`).expect(200)).body.member.badges;
  assert.deepEqual(await badges(seller), ['new'], 'a new member with one deal');

  // 5 deals as the seller, rated 5★ by 3 buyers -> Top finder.
  const pro = await t.user();
  for (let i = 0; i < 5; i++) {
    const b = await t.user();
    const l = await t.listing(b, { title: `Need item ${i}` });
    const conv = (await pro.post(`/api/listings/${l.id}/contact`).send({ message: 'Have it' }).expect(201)).body.conversation;
    await b.post(`/api/listings/${l.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
    const d = (await b.get(`/api/conversations/${conv.id}`)).body.conversation.deal;
    if (i < 3) {
      await b.post(`/api/deals/${d.id}/rating`).send({ stars: 5 }).expect(201);
      await pro.post(`/api/deals/${d.id}/rating`).send({ stars: 5 }).expect(201); // both rated -> visible
    }
  }
  assert.ok((await badges(pro)).includes('top-finder'));
  t.db.prepare(`UPDATE users SET created_at = datetime('now', '-60 days') WHERE id = ?`).run(pro.id);
  assert.ok(!(await badges(pro)).includes('new'), 'no longer new after 30 days');
  assert.ok(!(await badges(buyer)).includes('trusted'), 'one deal is not enough');
});
