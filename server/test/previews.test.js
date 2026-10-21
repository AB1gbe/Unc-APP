// Link previews for WhatsApp & co. (session 20): request pages carry Open
// Graph tags with the title, price, city and first photo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A tiny stand-in for the built website, set BEFORE the app loads.
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'unc-dist-'));
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html><head><title>Unc — Ask for it. Get offers.</title></head><body><div id="root"></div></body></html>');
process.env.CLIENT_DIST = dist;
const { setup, PNG } = await import('./helpers.js');
const t = await setup();
const page = async (p) => (await t.request(t.app).get(p).expect(200).expect('Content-Type', /html/)).text;
const meta = (html, prop) => html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1];

test('an open request: its own title, price, city and photo', async () => {
  const buyer = await t.user();
  const res = await buyer.post('/api/listings')
    .field('title', 'Looking for a "vintage" lamp <b>').field('description', 'Brass, working').field('category', 'Home & Furniture')
    .field('budgetMin', '20').field('budgetMax', '60').field('currency', 'USD').field('city', 'Manama')
    .attach('images', PNG, 'lamp.png').expect(201);
  const html = await page(`/requests/${res.body.listing.id}`);
  assert.equal(meta(html, 'og:title'), 'Looking for a &quot;vintage&quot; lamp &lt;b&gt;', 'member text is escaped');
  assert.match(meta(html, 'og:description'), /\$20 – \$60 · Manama · Have one\? Make an offer on Unc\./);
  assert.match(meta(html, 'og:image'), /^http:\/\/localhost:5173\/uploads\/listings\/.+\.png$/);
  assert.equal(meta(html, 'twitter:card'), 'summary_large_image');
  assert.match(html, /<title>Looking for a &quot;vintage&quot; lamp &lt;b&gt; · Unc<\/title>/);
  assert.match(html, /<div id="root"><\/div>/, 'still the normal app page');
});

test('Arabic buyers get an Arabic preview; closed or unknown requests and other pages get the general one', async () => {
  const buyer = await t.user();
  await buyer.put('/api/auth/language').send({ language: 'ar' }).expect(200);
  const l = await t.listing(buyer, { title: 'Need a bicycle pump', city: 'Riffa' });
  assert.match(meta(await page(`/requests/${l.id}`), 'og:description'), /لديك واحد؟/);
  assert.equal(meta(await page(`/requests/${l.id}`), 'twitter:card'), 'summary', 'no photo -> small card with the app icon');

  await buyer.post(`/api/listings/${l.id}/status`).send({ status: 'closed' }).expect(200);
  for (const p of [`/requests/${l.id}`, '/requests/999999', '/', '/browse']) {
    const html = await page(p);
    assert.equal(meta(html, 'og:title'), 'Unc — Ask for it. Get offers.', p);
    assert.match(meta(html, 'og:image'), /\/icons\/icon-512\.png$/);
  }
});
