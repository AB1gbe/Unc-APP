// Link previews for WhatsApp & co. (session 20): request pages carry Open
// Graph tags with the title, price, city and first photo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A tiny stand-in for the built website, set BEFORE the app loads.
const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'unc-dist-'));
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html><head><meta name="description" content="old" /><title>Unc — Ask for it. Get offers.</title></head><body><div id="root"></div></body></html>');
process.env.CLIENT_DIST = dist;
const { setup, PNG } = await import('./helpers.js');
const t = await setup();
const page = async (p) => (await t.request(t.app).get(p).expect(200).expect('Content-Type', /html/)).text;
const meta = (html, prop) => html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`))?.[1];

test('an open request: its own title, price, city and photo', async () => {
  const buyer = await t.user();
  const res = await buyer.post('/api/listings')
    .field('title', 'Looking for a "vintage" lamp <b>').field('description', 'Brass, working').field('category', 'Home & Furniture')
    .field('budgetMin', '20').field('budgetMax', '60').field('currency', 'BHD').field('city', 'Manama')
    .attach('images', PNG, 'lamp.png').expect(201);
  const html = await page(`/requests/${res.body.listing.id}`);
  assert.equal(meta(html, 'og:title'), 'Looking for a &quot;vintage&quot; lamp &lt;b&gt;', 'member text is escaped');
  assert.match(meta(html, 'og:description'), /BD 20 – BD 60 · Manama · Have one\? Make an offer on Unc\./);
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
  for (const p of [`/requests/${l.id}`, '/requests/999999', '/', '/messages']) {
    const html = await page(p);
    assert.equal(meta(html, 'og:title'), 'Unc — Buy, sell and connect near you', p);
    assert.match(meta(html, 'og:image'), /\/icons\/icon-512\.png$/);
  }
});

// Session 103 (M162): every section, page titles for Google, and the same
// tags through /api/page-meta for the Cloudflare worker.
test('a For sale ad: one price, the description, and its own call to action', async () => {
  const seller = await t.user();
  const ad = (await seller.post('/api/listings').send({
    section: 'forsale', title: 'iPhone 14 Pro, 256GB', description: 'Battery 89%, always in a case, box and cable included.',
    category: 'Phones & Tablets', price: 230, condition: 'used', city: 'Sitra',
  }).expect(201)).body.listing;
  const html = await page(`/requests/${ad.id}`);
  assert.match(html, /<title>iPhone 14 Pro, 256GB · Unc<\/title>/);
  assert.equal(meta(html, 'og:description'), 'BD 230 · Sitra · For sale on Unc. Ask the seller in a private chat.');
  assert.match(meta(html, 'description'), /^BD 230 · Sitra · Battery 89%, always in a case/);
  assert.equal(html.match(/<meta name="description"/g).length, 1, 'the old description is replaced, not doubled');
  assert.match(html, /<link rel="canonical" href="http:\/\/localhost:5173\/requests\/\d+" \/>/);
  // The worker's version gives the same.
  const m = (await t.request(t.app).get(`/api/page-meta?path=/requests/${ad.id}`).expect(200)).body;
  assert.equal(m.title, 'iPhone 14 Pro, 256GB · Unc');
  assert.match(m.tags, /og:image/);
});

test('housing rent shows per month; section pages have their own titles', async () => {
  const landlord = await t.user();
  const flat = (await landlord.post('/api/listings').send({
    section: 'housing', title: '2 bedroom flat in Juffair', description: 'Sea view, bills not included, parking.',
    category: 'Flats & apartments', rent: 380, bedrooms: 2, city: 'Juffair',
  }).expect(201)).body.listing;
  assert.match(meta(await page(`/requests/${flat.id}`), 'og:description'), /^BD 380 \/ month · Juffair/);
  assert.match(await page('/for-sale'), /<title>Things for sale in Bahrain · Unc<\/title>/);
  assert.match(await page('/jobs'), /<title>Jobs in Bahrain · Unc<\/title>/);
  assert.equal((await t.request(t.app).get('/api/page-meta?path=/housing').expect(200)).body.title, 'Flats, rooms and villas for rent in Bahrain · Unc');
  assert.equal((await t.request(t.app).get('/api/page-meta?path=javascript:x').expect(200)).body.title, 'Unc — Buy, sell and connect near you');
});

test('robots.txt and sitemap.xml: real open ads only', async () => {
  const robots = (await t.request(t.app).get('/robots.txt').expect(200).expect('Content-Type', /text\/plain/)).text;
  assert.match(robots, /Sitemap: http:\/\/localhost:5173\/sitemap\.xml/);
  const buyer = await t.user();
  const open = await t.listing(buyer, { title: 'Need a sitemap lamp' });
  const closed = await t.listing(buyer, { title: 'Need a closed lamp' });
  await buyer.post(`/api/listings/${closed.id}/status`).send({ status: 'closed' }).expect(200);
  const sample = await t.listing(buyer, { title: 'Need a sample lamp' });
  t.db.prepare('UPDATE listings SET sample = 1 WHERE id = ?').run(sample.id);
  const xml = (await t.request(t.app).get('/sitemap.xml').expect(200).expect('Content-Type', /xml/)).text;
  assert.match(xml, new RegExp(`/requests/${open.id}</loc>`));
  assert.doesNotMatch(xml, new RegExp(`/requests/${closed.id}</loc>`));
  assert.doesNotMatch(xml, new RegExp(`/requests/${sample.id}</loc>`));
  assert.match(xml, /<loc>http:\/\/localhost:5173\/for-sale<\/loc>/);
});
