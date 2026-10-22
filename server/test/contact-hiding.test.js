// Keeping deals on Unc (session 40): contact details are hidden from the
// other person until a price is agreed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { maskContacts } from '../../shared/contact-mask.js';

const t = await setup();

test('maskContacts finds numbers (also Arabic or spelled out), emails, links and handles, but not prices or dates', () => {
  for (const s of ['call 3912 3456', '+973 3912-3456', '٣٩١٢٣٤٥٦', 'nine seven three three nine one two', 'a@b.co', 'wa.me/97339123456', 'www.x.com', '@riverside.bh', 'cheap-ps5.biz']) {
    assert.equal(maskContacts(s).found, true, s);
  }
  for (const s of ['Price 380, 2 controllers', 'Needed by 2026-12-01', 'Model CFI-1216A 825GB', 'مرحبا، متى نلتقي؟', '']) {
    assert.equal(maskContacts(s).found, false, s);
  }
  assert.equal(maskContacts('Call me on 3912 3456 tonight').text, 'Call me on 📵 tonight');
});

test('the other person sees 📵 until a price is accepted; then everything shows', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a camera, hiding test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one, WhatsApp me on 3912 3456', offerPrice: 100 }).expect(201)).body.conversation;
  const sent = (await seller.get(`/api/conversations/${conv.id}`)).body.messages[0];
  assert.equal(sent.body, 'I have one, WhatsApp me on 3912 3456', 'the sender sees their own text');
  assert.equal(sent.hiddenForOther, true);

  const seen = (await buyer.get(`/api/conversations/${conv.id}`)).body;
  assert.equal(seen.conversation.agreed, false);
  assert.equal(seen.messages[0].body, 'I have one, WhatsApp me on 📵');
  assert.equal(seen.messages[0].hiddenContact, true);
  assert.ok(!JSON.stringify(seen).includes('3912'), 'the number is nowhere in the answer');
  assert.ok(!JSON.stringify((await buyer.get('/api/conversations')).body).includes('3912'), 'inbox preview');
  assert.ok(!JSON.stringify((await buyer.get(`/api/listings/${l.id}/conversations`)).body).includes('3912'), 'compare offers');
  assert.equal(t.db.prepare('SELECT had_contact FROM messages WHERE conversation_id = ?').get(conv.id).had_contact, 1, 'counted');

  // Accepting the price: from then on, numbers show (people need to arrange pickup).
  await buyer.post(`/api/conversations/${conv.id}/messages/${seen.messages[0].id}/respond`).send({ action: 'accept' }).expect(201);
  const after = (await buyer.get(`/api/conversations/${conv.id}`)).body;
  assert.equal(after.conversation.agreed, true);
  assert.equal(after.messages[0].body, 'I have one, WhatsApp me on 3912 3456');
  assert.equal(after.messages[0].hiddenContact, false);
});
