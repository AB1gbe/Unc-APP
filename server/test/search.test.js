// Search (session 103): Arabic spellings, words in any order, English and
// Arabic twins, and % or _ typed by a member.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { normalizeSearch, searchTerms } from '../../shared/search.js';

const t = await setup();
const buyer = await t.user();
const want = (title, description = 'Good condition please, Manama area') => t.listing(buyer, { title, description });
const found = async (q) => (await t.request(t.app).get(`/api/listings?q=${encodeURIComponent(q)}`).expect(200)).body.listings.map((l) => l.title);

const a = await want('أبحث عن آيفون 14 برو بنفسجي');
const b = await want('Looking for an iPhone 14 Pro, deep purple');
const c = await want('مطلوب شقة مفروشة في الجفير');
const d = await want('Need a table, 100% solid wood');
const e = await want('Need a sofa_bed for a small room');

test('Arabic letters are brought to one spelling', () => {
  assert.equal(normalizeSearch('آيفون'), 'ايفون');
  assert.equal(normalizeSearch('شقة'), 'شقه');
  assert.equal(normalizeSearch('مُسْتَعْمَل'), 'مستعمل');
  assert.equal(normalizeSearch('٢٥٦'), '256');
  assert.deepEqual(searchTerms('الايفون ١٤'), [['الايفون', 'ايفون', 'iphone'], ['14']]);
});

test('Arabic spelling variants find each other', async () => {
  assert.ok((await found('ايفون')).includes(a.title), 'ا finds آ');
  assert.ok((await found('شقه مفروشه')).includes(c.title), 'ه finds ة');
  assert.ok((await found('ايفون ١٤')).includes(a.title), 'Arabic digits');
});

test('every word must match, in any order', async () => {
  const r = await found('purple iphone');
  assert.ok(r.includes(b.title));
  assert.ok(!(await found('purple samsung')).includes(b.title));
});

test('Arabic and English twins: "ايفون" also finds "iPhone", and the reverse', async () => {
  const r = await found('ايفون 14');
  assert.ok(r.includes(a.title) && r.includes(b.title), JSON.stringify(r));
  assert.ok((await found('iphone')).includes(a.title));
  assert.ok((await found('flat')).includes(c.title), 'flat → شقه');
});

test('% and _ are plain characters', async () => {
  assert.deepEqual(await found('100%'), [d.title]);
  assert.deepEqual(await found('sofa_bed'), [e.title]);
  assert.ok(!(await found('so_a')).includes(e.title));
});
