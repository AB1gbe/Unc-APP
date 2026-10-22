// Screen-size check: logs in as the demo buyer and opens the main pages at
// five sizes (small Android, iPhone, iPad, laptop, big screen), in English
// AND Arabic. Fails if, on any page:
//   - anything is wider than the screen (sideways scrolling),
//   - the top bar is taller than 70 px on phones/tablets,
//   - a button, link, input or chip is shorter than 40 px on a touch screen.
// Needs the app on :4000 with demo data: `npm run seed` first.
// Screenshots -> e2e/screenshots/device-*.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const SIZES = [[360, 740, 'android', true], [390, 844, 'iphone', true], [768, 1024, 'ipad', true], [1024, 768, 'laptop', false], [1440, 900, 'desktop', false]];
const PAGES = ['/', '/browse', '/my-requests', '/messages', '/account', '/requests/new', '/notifications', '/alerts'];
const problems = [];

const browser = await chromium.launch();
const login = await (await browser.newContext()).newPage();
await login.goto(BASE + '/login');
await login.fill('#email', 'buyer@demo.local'); await login.fill('#password', 'Password123');
await login.click('form button.btn.block'); await login.waitForURL(BASE + '/');
const state = await login.context().storageState();
// also open one request and one conversation of the demo buyer
const ids = await login.evaluate(async () => {
  const mine = await (await fetch('/api/listings/mine')).json();
  const convs = await (await fetch('/api/conversations')).json();
  // Prefer the request with the most offers, so "Compare offers" is checked too.
  const most = [...mine.listings].sort((a, b) => (b.offerCount ?? 0) - (a.offerCount ?? 0))[0];
  return { listing: most?.id, conv: convs.conversations[0]?.id, shop: convs.conversations[0]?.other.id };
});
if (ids.listing) PAGES.push(`/requests/${ids.listing}`);
if (ids.conv) PAGES.push(`/messages/${ids.conv}`);
if (ids.shop) PAGES.push(`/members/${ids.shop}`); // the demo shop's page (cover, hours)

for (const lang of ['en', 'ar']) {
  for (const [width, height, name, touch] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width, height }, storageState: state, hasTouch: touch, isMobile: touch && width < 800, locale: lang === 'ar' ? 'ar-BH' : 'en-US' });
    await ctx.addInitScript((l) => localStorage.setItem('unc.language', l), lang);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(`${lang} ${name}: page error ${e.message}`));
    for (const p of PAGES) {
      await page.goto(BASE + p);
      await page.waitForTimeout(400);
      const r = await page.evaluate((isTouch) => {
        const small = [];
        if (isTouch) {
          for (const el of document.querySelectorAll('a.btn, button, .nav a, .tabbar a, input:not([type=radio]):not([type=checkbox]):not([hidden]), select, textarea, .chip')) {
            const rc = el.getBoundingClientRect();
            if (rc.width && rc.height && rc.height < 40) small.push(`"${(el.innerText || el.placeholder || el.tagName).trim().slice(0, 20)}" ${Math.round(rc.height)}px`);
          }
        }
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          header: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
          small: [...new Set(small)],
        };
      }, touch);
      const where = `${lang} ${name} ${p}`;
      if (r.overflow) problems.push(`${where}: sideways overflow`);
      if (touch && r.header > 70) problems.push(`${where}: top bar ${r.header}px tall`);
      if (r.small.length) problems.push(`${where}: small tap targets ${r.small.slice(0, 4).join(', ')}`);
      await page.screenshot({ path: `${OUT}/device-${lang}-${name}${p.replace(/\W+/g, '-')}.png` });
    }
    await ctx.close();
  }
}
await browser.close();
if (problems.length) {
  console.log(`DEVICES: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`DEVICES OK (${SIZES.length} sizes × 2 languages × ${PAGES.length} pages)`);
