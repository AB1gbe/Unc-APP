// Draws the app icon and saves the PNG sizes phones need for "Add to Home
// Screen" into client/public/icons/. Re-run after changing the logo/colours:
//   node scripts/make-icons.mjs
// The logo (session 85, ADR-075) is client/public/icons/logo-mark.svg: a
// blue rounded tile with a white "u" and a yellow dot. Uses Playwright's
// browser to turn it into images.
import fs from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../client/public/icons/', import.meta.url).pathname;
const svg = fs.readFileSync(`${OUT}logo-mark.svg`, 'utf8');
// The "u" and the dot without the tile, for icons that fill the square.
const inner = svg.replace(/<rect[^>]*\/>/, '').replace('<svg ', '<svg width="100%" height="100%" ');

// rounded: the tile with its own round corners (browser tab, Android).
// full: a full blue square (iPhone rounds it itself), the mark at `scale`.
const draw = (size, kind, scale = 1) => kind === 'rounded'
  ? `<div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>`
  : `<div style="width:${size}px;height:${size}px;background:#1f5fd6;display:grid;place-items:center"><div style="width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px">${inner}</div></div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
// maskable: phones may crop it into a circle, so the mark is drawn smaller.
for (const [name, size, kind, scale] of [['icon-192', 192, 'rounded'], ['icon-512', 512, 'rounded'], ['apple-touch-icon', 180, 'full', 1], ['icon-512-maskable', 512, 'full', 0.72]]) {
  await page.setContent(`<body style="margin:0;background:transparent">${draw(size, kind, scale)}</body>`);
  await page.locator('body > div').screenshot({ path: `${OUT}${name}.png`, omitBackground: true });
  console.log('wrote', `${OUT}${name}.png`);
}
await browser.close();
