// Short videos in chats (session 58).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG, setup } from './helpers.js';

const t = await setup();
// The first bytes of an MP4 ("ftyp") and an iPhone MOV ("ftypqt  ").
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(64)]);
const MOV = Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from('ftypqt  '), Buffer.alloc(64)]);

test('a seller can send a short video with an offer; only the two people in the chat can watch it', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const outsider = await t.user();
  const l = await t.listing(buyer, { title: 'Need a drone, video test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).field('message', 'Here it is flying').field('offerPrice', '200')
    .attach('video', MP4, 'clip.mp4').expect(201)).body.conversation;
  const first = (await buyer.get(`/api/conversations/${conv.id}`)).body.messages[0];
  assert.match(first.videoUrl, new RegExp(`^/api/conversations/${conv.id}/videos/.+\\.mp4$`));
  const res = await buyer.get(first.videoUrl).expect(200);
  assert.match(res.headers['content-type'], /video\/mp4/);
  await seller.get(first.videoUrl).expect(200);
  await outsider.get(first.videoUrl).expect(404);
  await t.request(t.app).get(first.videoUrl).expect(401);
  assert.equal((await buyer.get(`/api/listings/${l.id}/conversations`)).body.conversations[0].compare.hasVideo, true);

  // In the chat: a video alone (no text) is fine; iPhone MOV too.
  const m = (await buyer.post(`/api/conversations/${conv.id}/messages`).attach('video', MOV, 'IMG_0001.MOV').expect(201)).body.message;
  assert.match(m.videoUrl, /\.mov$/);
  assert.equal((await seller.get('/api/conversations')).body.conversations[0].lastVideo, true);
  // A photo with a video in the same message works too.
  await seller.post(`/api/conversations/${conv.id}/messages`).attach('image', PNG, 'p.png').attach('video', MP4, 'v.mp4').expect(201);
});

test('only real videos, and a photo still may not be over 5 MB', async () => {
  const buyer = await t.user();
  const seller = await t.user();
  const l = await t.listing(buyer, { title: 'Need a speaker, video test' });
  const conv = (await seller.post(`/api/listings/${l.id}/contact`).send({ message: 'I have one' }).expect(201)).body.conversation;
  await seller.post(`/api/conversations/${conv.id}/messages`).attach('video', PNG, 'fake.mp4').expect(400, /MP4, MOV or WebM/);
  await seller.post(`/api/conversations/${conv.id}/messages`).attach('video', Buffer.from('#!/bin/sh echo hi'), 'x.mp4').expect(400);
  const bigPhoto = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
  await seller.post(`/api/conversations/${conv.id}/messages`).attach('image', bigPhoto, 'big.png').expect(413, /5 MB/);
  const bigVideo = Buffer.concat([MP4, Buffer.alloc(26 * 1024 * 1024)]);
  await seller.post(`/api/conversations/${conv.id}/messages`).attach('video', bigVideo, 'big.mp4').expect(413, /25 MB/);
});

test('photos and audio from the same file family are not videos (M110)', async () => {
  const { sniffVideo } = await import('../src/lib/uploads.js');
  const head = (brand) => Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftyp' + brand), Buffer.alloc(16)]);
  assert.equal(sniffVideo(head('heic')), null, 'iPhone HEIC photo');
  assert.equal(sniffVideo(head('mif1')), null, 'HEIF photo');
  assert.equal(sniffVideo(head('M4A ')), null, 'M4A audio');
  assert.equal(sniffVideo(head('avif')), null, 'AVIF photo');
  assert.equal(sniffVideo(head('isom')).ext, '.mp4');
  assert.equal(sniffVideo(head('mp42')).ext, '.mp4');
  assert.equal(sniffVideo(head('qt  ')).ext, '.mov');
});

