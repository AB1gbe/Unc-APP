// Email to the buyer for every new offer (session 17).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';

const t = await setup();
const { outbox } = await import('../src/lib/mailer.js');
const me = async (a) => (await a.get('/api/auth/me').expect(200)).body.user;
const mailsTo = (email) => outbox.filter((m) => m.to === email);
// Subjects wrap member text in Unicode isolate marks (see emails.js).
const plain = (s) => s.replace(/[\u2068\u2069]/g, '');

test('a new offer emails the buyer with the seller, price, message and a link; not the seller', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const { email } = await me(buyer);
  const sellerEmail = (await me(seller)).email;
  const l = await t.listing(buyer, { title: 'Need a desk lamp', currency: 'USD' });
  const before = { buyer: mailsTo(email).length, seller: mailsTo(sellerEmail).length };

  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'Brass lamp, works <b>great</b>', offerPrice: 35 }).expect(201)).body.conversation;
  const mails = mailsTo(email);
  assert.equal(mails.length, before.buyer + 1);
  const m = mails.at(-1);
  assert.equal(plain(m.subject), 'New offer on “Need a desk lamp”');
  assert.match(plain(m.text), /User \d+ made an offer/);
  assert.match(m.text, /\$35/);
  assert.match(m.text, new RegExp(`/messages/${conv.id}`));
  assert.match(m.html, /works &lt;b&gt;great&lt;\/b&gt;/, 'member text is escaped in the HTML');
  assert.match(m.html, /\/account/, 'says where to turn these off');
  assert.equal(mailsTo(sellerEmail).length, before.seller, 'the seller gets nothing');

  // Replies in the conversation are not new offers.
  await buyer.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Still available?' }).expect(201);
  await seller.post(`/api/conversations/${conv.id}/messages`).send({ message: 'Yes' }).expect(201);
  assert.equal(mailsTo(email).length, before.buyer + 1);
});

test('Arabic buyers get it in Arabic, right-to-left', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  await buyer.put('/api/auth/language').send({ language: 'ar' }).expect(200);
  const l = await t.listing(buyer, { title: 'Need a bike pump' });
  await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201);
  const m = mailsTo((await me(buyer)).email).at(-1);
  assert.equal(plain(m.subject), 'عرض جديد على «Need a bike pump»');
  assert.match(m.html, /<html lang="ar" dir="rtl"/);
  // English member text inside the Arabic email keeps left-to-right, set
  // explicitly (email apps ignore dir="auto").
  assert.match(m.html, /<span dir="ltr">Need a bike pump<\/span>/);
  assert.match(m.html, /<blockquote dir="ltr"[^>]*>I have one</);
  assert.doesNotMatch(m.html, /dir="auto"|<bdi>/);
});

test('the switch: on by default, can be turned off, only real true/false', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const { email } = await me(buyer);
  assert.equal((await me(buyer)).emailOffers, true);

  await buyer.patch('/api/auth/me').send({ emailOffers: 'false' }).expect(400);
  const off = (await buyer.patch('/api/auth/me').send({ emailOffers: false }).expect(200)).body.user;
  assert.equal(off.emailOffers, false);
  const count = mailsTo(email).length;
  await seller.post(`/api/listings/${(await t.listing(buyer)).id}/contact`).send({ message: 'Offer while off' }).expect(201);
  assert.equal(mailsTo(email).length, count, 'no email while switched off');

  await buyer.patch('/api/auth/me').send({ emailOffers: true }).expect(200);
  await seller.post(`/api/listings/${(await t.listing(buyer)).id}/contact`).send({ message: 'Offer while on' }).expect(201);
  assert.equal(mailsTo(email).length, count + 1);
});

test('textDir: the first letter decides', async () => {
  const { textDir } = await import('../src/lib/emails.js');
  assert.equal(textDir('PS5 for sale'), 'ltr');
  assert.equal(textDir('5 كراسي للبيع'), 'rtl', 'digits are skipped');
  assert.equal(textDir('«مرحبا» hello'), 'rtl');
  assert.equal(textDir('123'), 'ltr');
});

