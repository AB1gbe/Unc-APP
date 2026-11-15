// The trust ladder (session 101, ADR-080): an email-confirmed member can
// reply to ads and chat; the ID check is needed to post and to make offers
// on Wanted requests; no card for people.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const flat = (o = {}) => ({ section: 'housing', title: `Flat in Juffair ${Math.random().toString(36).slice(2, 6)}`, description: 'Two bedrooms, sea view.', category: 'Flats & apartments', rent: 350, bedrooms: 2, city: 'Juffair', ...o });
const terms = (agent) => agent.post('/api/auth/terms').send({ accept: true }).expect(200);

test('email only: can reply to an ad and chat, but cannot post or offer on a request', async () => {
  const landlord = await t.user();
  const ad = (await landlord.post('/api/listings').send(flat()).expect(201)).body.listing;
  const request = await t.listing(landlord, { title: 'Need a ladder, ladder test' });
  const newbie = await t.user('email');
  await terms(newbie);
  const conv = (await newbie.post(`/api/listings/${ad.id}/contact`).send({ message: 'Is it still available?' }).expect(201)).body.conversation;
  await newbie.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Can I see it Saturday?' }).expect(201);
  await landlord.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Yes' }).expect(201);
  // The landlord sees the person isn't ID-checked.
  const seen = (await landlord.get(`/api/conversations/${conv.id}`).expect(200)).body.conversation;
  assert.equal(seen.other.verified, false);
  // Offers on Wanted requests and posting need the ID check.
  const offer = await newbie.post(`/api/listings/${request.id}/contact`).send({ message: 'I have one', offerPrice: 10 }).expect(403);
  assert.equal(offer.body.code, 'KYC_REQUIRED');
  const post = await newbie.post('/api/listings').send(flat()).expect(403);
  assert.equal(post.body.code, 'KYC_REQUIRED');
});

test('not confirmed email, or Terms not accepted: no reply', async () => {
  const landlord = await t.user();
  const ad = (await landlord.post('/api/listings').send(flat()).expect(201)).body.listing;
  const fresh = await t.user('registered');
  assert.equal((await fresh.post(`/api/listings/${ad.id}/contact`).send({ message: 'Hello there' }).expect(403)).body.code, 'EMAIL_UNVERIFIED');
});

test('members without the ID check can start 5 new chats a day', async () => {
  // One ad per landlord (each landlord may post 5 ads a day).
  const newAd = async () => (await (await t.user()).post('/api/listings').send(flat()).expect(201)).body.listing;
  const newbie = await t.user('email');
  await terms(newbie);
  for (let i = 0; i < 5; i += 1) {
    const ad = await newAd();
    await newbie.post(`/api/listings/${ad.id}/contact`).send({ message: 'Interested, thanks' }).expect(201);
  }
  const sixth = await newAd();
  await newbie.post(`/api/listings/${sixth.id}/contact`).send({ message: 'Interested, thanks' }).expect(429);
  // An ID-checked member has no such limit.
  const checked = await t.user();
  await checked.post(`/api/listings/${sixth.id}/contact`).send({ message: 'Interested, thanks' }).expect(201);
});

test('an advertiser can accept messages from ID-checked members only', async () => {
  const landlord = await t.user();
  const ad = (await landlord.post('/api/listings').send(flat({ contactRule: 'verified' })).expect(201)).body.listing;
  assert.equal(ad.contactRule, 'verified');
  const newbie = await t.user('email');
  await terms(newbie);
  const res = await newbie.post(`/api/listings/${ad.id}/contact`).send({ message: 'Hello, available?' }).expect(403);
  assert.equal(res.body.rule, 'verified');
  const checked = await t.user();
  await checked.post(`/api/listings/${ad.id}/contact`).send({ message: 'Hello, available?' }).expect(201);
});
