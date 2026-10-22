// "Who may contact me" and "Show only my first name" (session 34).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { shortName } from '../../shared/names.js';

const t = await setup();

test('shortName keeps the first name and the first letter of the last', () => {
  assert.equal(shortName('Sam Buyer'), 'Sam B.');
  assert.equal(shortName('  Mary  Ann  Smith '), 'Mary S.');
  assert.equal(shortName('محمد علي'), 'محمد ع.');
  assert.equal(shortName('Riverside'), 'Riverside');
});

test('a request can be open to shops only, well-rated sellers only, or favourite sellers only', async () => {
  const buyer = await t.user();
  const person = await t.user();
  const shop = await t.user('approved', 'business');

  const shopsOnly = await t.listing(buyer, { title: 'Need a printer, shops only', contactRule: 'shops' });
  assert.equal(shopsOnly.contactRule, 'shops');
  assert.equal((await person.get(`/api/listings/${shopsOnly.id}`)).body.listing.contactBlocked, 'shops');
  await person.post(`/api/listings/${shopsOnly.id}/contact`).send({ message: 'I have one' }).expect(403, /Only shops/);
  assert.equal((await shop.get(`/api/listings/${shopsOnly.id}`)).body.listing.contactBlocked, null);
  await shop.post(`/api/listings/${shopsOnly.id}/contact`).send({ message: 'We have one' }).expect(201);

  const favesOnly = await t.listing(buyer, { title: 'Need a desk, favourites only', contactRule: 'favourites' });
  await person.post(`/api/listings/${favesOnly.id}/contact`).send({ message: 'I have one' }).expect(403, /favourite/);
  await buyer.put(`/api/members/${person.id}/favourite`).expect(200);
  await person.post(`/api/listings/${favesOnly.id}/contact`).send({ message: 'I have one' }).expect(201);

  // 4★ or more: give the shop a finished, rated deal straight in the database.
  const ratedOnly = await t.listing(buyer, { title: 'Need a lamp, rated sellers only', contactRule: 'rated' });
  const other = await t.user();
  await shop.post(`/api/listings/${ratedOnly.id}/contact`).send({ message: 'We have one' }).expect(403, /4★/);
  const old = await t.listing(other, { title: 'Old request for a rated deal' });
  const conv = (await shop.post(`/api/listings/${old.id}/contact`).send({ message: 'Here you go' }).expect(201)).body.conversation;
  await other.post(`/api/listings/${old.id}/status`).send({ status: 'fulfilled', conversationId: conv.id }).expect(200);
  const deal = t.db.prepare('SELECT id FROM deals WHERE conversation_id = ?').get(conv.id);
  await other.post(`/api/deals/${deal.id}/rating`).send({ stars: 5 }).expect(201);
  await shop.post(`/api/deals/${deal.id}/rating`).send({ stars: 5 }).expect(201);
  await shop.post(`/api/listings/${ratedOnly.id}/contact`).send({ message: 'We have one' }).expect(201);

  // "Requests for you" leaves out the ones you can't answer.
  const forYou = (await person.get('/api/listings/for-you')).body.listings.map((l) => l.id);
  assert.ok(!forYou.includes(shopsOnly.id) && !forYou.includes(ratedOnly.id));

  await buyer.post('/api/listings').send({
    title: 'Bad rule test request', description: 'Any road bike in good condition', category: 'Sports & Outdoors', city: 'Austin', contactRule: 'friends',
  }).expect(400);
});

test('favourite sellers and alerts are not told about requests they may not answer', async () => {
  const buyer = await t.user();
  const person = await t.user();
  await person.post('/api/alerts').send({ category: 'Electronics' }).expect(201);
  await buyer.put(`/api/members/${person.id}/favourite`).expect(200);
  await t.listing(buyer, { title: 'Need a tablet, shops only', category: 'Electronics', contactRule: 'shops' });
  const kinds = (await person.get('/api/notifications')).body.notifications.map((n) => n.kind);
  assert.ok(!kinds.includes('alert-match') && !kinds.includes('favourite-request'), kinds.join());
});

test('"Show only my first name": others see "User N." until the buyer writes in the chat', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const shop = await t.user('approved', 'business');
  await shop.patch('/api/auth/me').send({ shortName: true }).expect(400, /Shops/);
  await buyer.patch('/api/auth/me').send({ shortName: 'yes' }).expect(400);
  const me = (await buyer.patch('/api/auth/me').send({ shortName: true }).expect(200)).body.user;
  assert.equal(me.shortName, true);
  const full = me.displayName; // "User N"
  const short = shortName(full);
  assert.notEqual(full, short);

  const l = await t.listing(buyer, { title: 'Need a kettle, name test' });
  assert.equal((await seller.get(`/api/listings/${l.id}`)).body.listing.buyer.displayName, short);
  assert.equal((await t.request(t.app).get('/api/listings')).body.listings.find((x) => x.id === l.id).buyer.displayName, short);
  assert.equal((await seller.get(`/api/members/${buyer.id}`)).body.member.displayName, short);
  assert.equal((await buyer.get(`/api/members/${buyer.id}`)).body.member.displayName, full, 'you still see your own full name');

  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have a kettle' }).expect(201)).body.conversation;
  assert.equal(conv.other.displayName, short);
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Great, thanks' }).expect(201);
  assert.equal((await seller.get(`/api/conversations/${conv.id}`)).body.conversation.other.displayName, full, 'full name once the buyer replied');
  assert.equal((await seller.get('/api/conversations')).body.conversations.find((c) => c.id === conv.id).other.displayName, full);
});
