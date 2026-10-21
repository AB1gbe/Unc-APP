// Draws the app icon and saves the PNG sizes phones need for "Add to Home
// Screen" into client/public/icons/. Re-run after changing the logo/colours:
//   node scripts/make-icons.mjs
// (Uses Playwright's browser to render the HTML below into images.)
import { chromium } from 'playwright';

const OUT = new URL('../client/public/icons/', import.meta.url).pathname;
const draw = (size, maskable) => `<div style="width:${size}px;height:${size}px;background:#2f6fed;display:grid;place-items:center;
  font:800 ${Math.round(size * (maskable ? 0.34 : 0.42))}px system-ui,Arial,sans-serif;color:#fff;letter-spacing:-.04em">un<span style="color:#ffd166">c</span></div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
// maskable: phones may crop it into a circle, so the logo is drawn smaller.
for (const [name, size, maskable] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180], ['icon-512-maskable', 512, true]]) {
  await page.setContent(`<body style="margin:0">${draw(size, maskable)}</body>`);
  await page.locator('div').screenshot({ path: `${OUT}${name}.png` });
  console.log('wrote', `${OUT}${name}.png`);
}
await browser.close();
