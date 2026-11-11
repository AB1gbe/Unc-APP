// NOTE (session 64): real Pexels photos replaced these drawings; see
// scripts/fetch-photos.mjs. Running this script draws over the photos in
// server/demo-photos/ again, so only run it to go back to drawings.
// Draws the example photos used by `npm run seed` (session 54): request
// photos, offer photos, profile photos, a shop cover and a "found it"
// story. They are simple illustrations (emoji on a soft studio background),
// not real photos, so there are no rights issues. Saved as JPEGs into
// server/demo-photos/, which is committed: the owner's PC doesn't need a
// browser to seed. Re-run only to change the pictures:
//   node scripts/make-demo-photos.mjs
// (Uses Playwright's browser, like scripts/make-icons.mjs.)
import { chromium } from 'playwright';

const OUT = new URL('../server/demo-photos/', import.meta.url).pathname;

// [file, width, height, background colours, objects: [emoji, size %, x %, y %, turn°]]
const PHOTOS = [
  ['ps5-wanted.jpg', 1200, 900, ['#3d5180', '#1b2540'], [['🎮', 34, 36, 54, -12], ['🎮', 26, 66, 60, 10], ['💿', 18, 62, 30, 0]]],
  ['oak-table.jpg', 1200, 900, ['#a8835a', '#5e4430'], [['TABLE', 0, 50, 62, 0], ['🪑', 24, 17, 64, 0], ['🪑', 24, 83, 64, 0]]],
  ['wardrobe.jpg', 1200, 900, ['#3d6a64', '#1a3433'], [['🚪', 34, 38, 52, 0], ['🚪', 34, 62, 52, 0], ['🧰', 14, 84, 80, 0]]],
  ['offer-ps5-boxed.jpg', 1200, 900, ['#4a586c', '#232a35'], [['📦', 40, 40, 58, 0], ['🎮', 24, 70, 62, -8], ['🎮', 18, 74, 36, 14]]],
  ['offer-ps5-disc.jpg', 1200, 900, ['#6c4868', '#33233a'], [['🎮', 32, 42, 56, 8], ['💿', 22, 70, 52, 0]]],
  ['charger-case.jpg', 1200, 900, ['#3d5180', '#1b2540'], [['📱', 36, 40, 54, -6], ['🔌', 24, 68, 60, 12]]],
  ['story-found-it.jpg', 1200, 900, ['#b39d7a', '#6d5d47'], [['🛍️', 34, 40, 56, -6], ['📱', 22, 66, 50, 10], ['🎉', 16, 76, 24, 0]]],
  ['avatar-sam.jpg', 512, 512, ['#4a586c', '#232a35'], [['🧑🏽', 62, 50, 54, 0]]],
  ['avatar-riverside.jpg', 512, 512, ['#9a5a40', '#4f261b'], [['🏪', 60, 50, 54, 0]]],
  ['avatar-alex.jpg', 512, 512, ['#3d6a64', '#1a3433'], [['🧑🏻‍🔧', 62, 50, 54, 0]]],
  ['cover-riverside.jpg', 1600, 600, ['#2a1d16', '#5e4430'], [['📱', 22, 18, 56, -8], ['🎮', 24, 38, 56, 6], ['💻', 24, 60, 56, 0], ['🎧', 22, 82, 56, -6]]],
];

// No emoji looks like a dining table, so 'TABLE' draws one: an oak top and four legs.
const TABLE = `<div style="position:relative;width:560px;height:300px">
  <div style="position:absolute;left:0;right:0;top:40px;height:46px;border-radius:10px;background:linear-gradient(#c8945a,#a46b35);box-shadow:inset 0 -8px 0 rgba(0,0,0,.12)"></div>
  <div style="position:absolute;left:10px;right:10px;top:20px;height:34px;border-radius:12px;background:linear-gradient(90deg,#d9a86c,#e8bd83 40%,#cf9a5d)"></div>
  ${[30, 110, 430, 510].map((x, i) => `<div style="position:absolute;left:${x}px;top:${i % 3 ? 86 : 80}px;width:22px;height:${i % 3 ? 190 : 210}px;border-radius:4px;background:linear-gradient(90deg,#9a6230,#b97a42)"></div>`).join('')}
</div>`;

const scene = ([, w, h, [c1, c2], objects]) => `
  <div id="photo" style="position:relative;width:${w}px;height:${h}px;overflow:hidden;
       background:radial-gradient(ellipse at 50% 30%, ${c1} 0%, ${c2} 100%)">
    <div style="position:absolute;left:10%;right:10%;bottom:${h > w ? 10 : 9}%;height:9%;border-radius:50%;
         background:radial-gradient(ellipse, rgba(0,0,0,.35), rgba(0,0,0,0) 70%)"></div>
    ${objects.map(([emoji, size, x, y, turn]) => `
      <div style="position:absolute;left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${turn}deg);
           font:${Math.round((Math.min(w, h) * size) / 100)}px 'Noto Color Emoji','Segoe UI Emoji',sans-serif;line-height:1;
           filter:drop-shadow(0 ${Math.round(h / 60)}px ${Math.round(h / 40)}px rgba(0,0,0,.25))">${emoji === 'TABLE' ? TABLE : emoji}</div>`).join('')}
  </div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const photo of PHOTOS) {
  await page.setContent(`<body style="margin:0">${scene(photo)}</body>`);
  await page.locator('#photo').screenshot({ path: `${OUT}${photo[0]}`, type: 'jpeg', quality: 82 });
  console.log('wrote', `${OUT}${photo[0]}`);
}
await browser.close();
