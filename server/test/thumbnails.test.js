// Thumbnails (session 102): the browser sends a small copy of each listing
// photo; grids use it, the ad page the full photo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, PNG } from './helpers.js';

const t = await setup();
const BIG = Buffer.concat([PNG, Buffer.alloc(200 * 1024)]); // a "thumbnail" that is too big

const post = (agent, title) => agent.post('/api/listings')
  .field('title', title).field('description', 'A test listing with photos').field('category', 'Electronics').field('city', 'Manama');

test('photos with thumbnails: both are saved and served, thumbs listed in the same order', async () => {
  const buyer = await t.user();
  const l = (await post(buyer, 'Need a camera, thumbs')
    .attach('images', PNG, 'a.png').attach('images', PNG, 'b.png')
    .attach('thumbs', PNG, 'a-small.png').attach('thumbs', PNG, 'b-small.png').expect(201)).body.listing;
  assert.equal(l.images.length, 2);
  assert.equal(l.thumbs.length, 2);
  assert.notEqual(l.thumbs[0], l.images[0]);
  for (const url of [...l.images, ...l.thumbs]) await t.request(t.app).get(url).expect(200);
  // In the list too.
  const listed = (await t.request(t.app).get('/api/listings?q=thumbs').expect(200)).body.listings.find((x) => x.id === l.id);
  assert.deepEqual(listed.thumbs, l.thumbs);
});

test('no thumbnail, or one that is too big: the full photo is used', async () => {
  const buyer = await t.user();
  const l = (await post(buyer, 'Need a tripod, no thumbs').attach('images', PNG, 'a.png').expect(201)).body.listing;
  assert.deepEqual(l.thumbs, l.images);
  const big = (await post(buyer, 'Need a lens, big thumb').attach('images', PNG, 'a.png').attach('thumbs', BIG, 'big.png').expect(201)).body.listing;
  assert.deepEqual(big.thumbs, big.images);
});

test('adding photos later and deleting one also handle the thumbnail', async () => {
  const buyer = await t.user();
  const l = (await post(buyer, 'Need a flash, later photos').expect(201)).body.listing;
  const added = (await buyer.post(`/api/listings/${l.id}/images`).attach('images', PNG, 'a.png').attach('thumbs', PNG, 's.png').expect(201)).body.listing;
  const thumbUrl = added.photos[0].thumbUrl;
  assert.notEqual(thumbUrl, added.photos[0].url);
  await buyer.delete(`/api/listings/${l.id}/images/${added.photos[0].id}`).expect(200);
  await t.request(t.app).get(thumbUrl).expect(404);
});
