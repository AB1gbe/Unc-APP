// Payment card when joining (session 40), with the showcase 'test' provider.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();

test('a card is added from a token; Unc keeps only brand, last 4 and expiry', async () => {
  const u = await t.user('email');
  assert.equal((await u.get('/api/auth/me')).body.user.hasCard, false);
  await u.post('/api/payments/card').send({ token: '4242424242424242' }).expect(400, /could not be read/);
  await u.post('/api/payments/card').send({ token: 'tok_test_visa_4242_01_20' }).expect(400, /expired/);
  await u.post('/api/payments/card').send({ token: 'tok_test_visa_0002_12_39' }).expect(402, /declined/);
  const card = (await u.post('/api/payments/card').send({ token: 'tok_test_mastercard_4444_12_39' }).expect(201)).body.card;
  assert.deepEqual({ ...card, addedAt: undefined }, { brand: 'mastercard', last4: '4444', expMonth: 12, expYear: 2039, addedAt: undefined });
  assert.equal((await u.get('/api/auth/me')).body.user.hasCard, true);
  assert.equal((await u.get('/api/payments/card')).body.provider, 'test');
  // Replacing it keeps one card per member.
  await u.post('/api/payments/card').send({ token: 'tok_test_visa_1111_06_38' }).expect(201);
  assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM payment_cards WHERE user_id = ?').get(u.id).n, 1);
  const cols = Object.keys(t.db.prepare('SELECT * FROM payment_cards LIMIT 1').get());
  assert.ok(!cols.some((c) => /number|pan|cvc|cvv/.test(c)), 'no column could hold a card number');
});

test('without a card, a verified member cannot offer or post', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a lamp, card test' });
  t.db.prepare('UPDATE users SET card_added_at = NULL WHERE id = ?').run(seller.id);
  t.db.prepare('DELETE FROM payment_cards WHERE user_id = ?').run(seller.id);
  const res = await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(403);
  assert.equal(res.body.code, 'CARD_REQUIRED');
});

test('the card form helpers: Luhn check, brand, expiry, and a token without the number', async () => {
  const { brandOf, luhnOk, readExpiry, testToken } = await import('../../client/src/cards.js');
  assert.equal(luhnOk('4242 4242 4242 4242'), true);
  assert.equal(luhnOk('4242 4242 4242 4241'), false);
  assert.equal(brandOf('5555 5555 5555 4444'), 'mastercard');
  assert.deepEqual(readExpiry('12/29'), { month: 12, year: 2029 });
  assert.equal(readExpiry('13/29'), null);
  const token = testToken('4242 4242 4242 4242', '12/39');
  assert.equal(token, 'tok_test_visa_4242_12_39');
  assert.ok(!token.includes('424242424242'), 'the full number is not in the token');
});
