// NOTE (session 64): real Pexels photos replaced these drawings; see
// scripts/fetch-photos.mjs. Running this script draws over the photos in
// client/public/art/ again, so only run it to go back to drawings.
// Draws the pictures used around the app (session 62): the three "How Unc works" steps, one tile per category and the
// Help page pictures. Same style as the demo photos (emoji objects with a
// soft shadow on a deep colour), so no rights issues and they look
// the same on every phone. Saved into client/public/art/, which is
// committed. Re-run only to change the pictures:
//   node scripts/make-art.mjs
import { chromium } from 'playwright';

const OUT = new URL('../client/public/art/', import.meta.url).pathname;

// Session 62, second pass: calm, grown-up tiles like the owner's example:
// a deep, muted colour and ONE object, no pastel, no clutter.
const TONES = {
  brown: ['#5e4430', '#a8835a'], slate: ['#232a35', '#4a586c'], plum: ['#33233a', '#6c4868'],
  teal: ['#1a3433', '#3d6a64'], olive: ['#33361f', '#6a6d43'], navy: ['#1b2540', '#3d5180'],
  rust: ['#4f261b', '#9a5a40'], sand: ['#6d5d47', '#b39d7a'],
};
// [file, width, height, tone, emoji, size %]
const T = (file, tone, emoji, size = 36, w = 480, h = 360) => [file, w, h, TONES[tone], emoji, size];
const ART = [
  T('step-post.jpg', 'navy', '📝', 38),
  T('step-offers.jpg', 'teal', '💬', 36),
  T('step-deal.jpg', 'brown', '🤝', 40),
  T('cat-electronics.jpg', 'slate', '🎧'), T('cat-phones.jpg', 'navy', '📱'), T('cat-computers.jpg', 'slate', '💻'),
  T('cat-home.jpg', 'brown', '🛋️'), T('cat-appliances.jpg', 'teal', '☕'), T('cat-vehicles.jpg', 'rust', '🚗'),
  T('cat-fashion.jpg', 'plum', '👟'), T('cat-beauty.jpg', 'plum', '💄'), T('cat-sports.jpg', 'olive', '🚲'),
  T('cat-toys.jpg', 'sand', '🧸'), T('cat-books.jpg', 'rust', '📚'), T('cat-tools.jpg', 'slate', '🛠️'),
  T('cat-garden.jpg', 'olive', '🪴'), T('cat-pets.jpg', 'sand', '🐶'), T('cat-services.jpg', 'teal', '🔧'),
  T('cat-other.jpg', 'brown', '🎁'),
  T('help-start.jpg', 'navy', '🧭'), T('help-offers.jpg', 'teal', '🤝'), T('help-safety.jpg', 'slate', '🛡️'),
  T('help-payments.jpg', 'brown', '💳'), T('help-account.jpg', 'plum', '🔐'),
  T('help-team.jpg', 'brown', '💬', 46, 300, 300),
];

const scene = ([, w, h, [c1, c2], emoji, size]) => `
  <div id="art" style="position:relative;width:${w}px;height:${h}px;overflow:hidden;
       background:linear-gradient(135deg, ${c1} 0%, ${c2} 100%)">
    <div style="position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 45%, rgba(255,255,255,.10), rgba(255,255,255,0) 70%)"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
         font:${Math.round((Math.min(w, h) * size) / 100)}px 'Noto Color Emoji','Segoe UI Emoji',sans-serif;line-height:1;
         filter:drop-shadow(0 ${Math.round(h / 40)}px ${Math.round(h / 22)}px rgba(0,0,0,.35))">${emoji}</div>
  </div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const art of ART) {
  await page.setContent(`<body style="margin:0;background:transparent">${scene(art)}</body>`);
  await page.locator('#art').screenshot({ path: `${OUT}${art[0]}`, type: 'jpeg', quality: 82 });
  console.log('wrote', art[0]);
}
await browser.close();
