// Makes one PDF with every tab and page of Unc (session 76): for each
// screen, a computer view and the phone view scrolled from top to bottom.
// Needs the app running on http://localhost:4000 with demo data:
//   (fresh database) npm run seed, then npm start, then in another window:
//   node scripts/make-screens-pdf.mjs
// Writes docs/Design/Unc screens.pdf. (Uses Playwright's browser.)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4000';
const OUT = fileURLToPath(new URL('../docs/Design/Unc screens.pdf', import.meta.url));
const PHONE_FRAMES = 4;
const browser = await chromium.launch();

async function contextFor(who, lang = 'en', phone = false) {
  const ctx = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((l) => { try { localStorage.setItem('unc.language', l); localStorage.setItem('unc.sidebar', 'open'); } catch {} }, lang);
  if (who) {
    const p = await ctx.newPage();
    await p.goto(BASE + '/login');
    await p.fill('#email', who[0]); await p.fill('#password', who[1]);
    await p.click('button.btn.block'); await p.waitForURL((u) => !u.pathname.startsWith('/login'));
    await p.close();
  }
  return ctx;
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // Scroll down and back so lazy photos load.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

const jpg = (buf) => `data:image/jpeg;base64,${buf.toString('base64')}`;

async function shots(ctxDesk, ctxPhone, path) {
  const d = await ctxDesk.newPage(); await d.goto(BASE + path); await settle(d);
  const desk = jpg(await d.screenshot({ type: 'jpeg', quality: 72 })); await d.close();
  const p = await ctxPhone.newPage(); await p.goto(BASE + path); await settle(p);
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const frames = [];
  for (let i = 0; i < PHONE_FRAMES; i++) {
    const y = Math.min(i * 760, Math.max(0, total - 844));
    if (i > 0 && y <= (i - 1) * 760) break; // reached the bottom
    await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(250);
    frames.push(jpg(await p.screenshot({ type: 'jpeg', quality: 70 })));
    if (y + 844 >= total) break;
  }
  await p.close();
  return { desk, frames };
}

// Logins (demo data). Admin uses the server defaults unless ADMIN_EMAIL/ADMIN_PASSWORD are set.
const BUYER = ['buyer@demo.local', 'Password123'];
const SHOP = ['vendor@demo.local', 'Password123'];
const ADMIN = [process.env.ADMIN_EMAIL || 'admin@unc.local', process.env.ADMIN_PASSWORD || 'ChangeMe123!'];

const sections = [];
async function section(title, who, lang, list) {
  const desk = await contextFor(who, lang); const phone = await contextFor(who, lang, true);
  const items = [];
  for (const [name, path, note] of list) {
    process.stdout.write(`${title}: ${name}\n`);
    items.push({ name, path, note, ...(await shots(desk, phone, path)) });
  }
  await desk.close(); await phone.close();
  sections.push({ title, items });
}

// Find real ids from the demo data.
const probe = await contextFor(BUYER);
const pg = await probe.newPage(); await pg.goto(BASE + '/');
const ids = await pg.evaluate(async () => {
  const j = (u) => fetch(u).then((r) => r.json());
  const mine = (await j('/api/listings/mine')).listings;
  const ps5 = mine.find((l) => l.title.startsWith('Looking for a used PS5')) || mine[0];
  const convs = (await j('/api/conversations')).conversations;
  const shops = (await j('/api/shops')).shops;
  const all = (await j('/api/listings')).listings;
  const other = all.find((l) => !mine.some((m) => m.id === l.id)) || all[0];
  return { ps5: ps5?.id, conv: convs[0]?.id, shop: shops[0]?.id, other: other?.id };
});
await probe.close();

await section('Visitors (not signed in)', null, 'en', [
  ['Home', '/', 'The calm home page: banner, verified shops, 4 categories, newest requests.'],
  ['Requests tab', '/browse', 'Search, all requests, activity list.'],
  ['Requests in one category', '/browse?category=Appliances', 'What "Browse by category" opens.'],
  ['Shops tab', '/shops', 'Verified shops and member stories.'],
  ['Categories tab', '/categories', 'Every category, with a search bar.'],
  ['A request', `/requests/${ids.other}`, 'What anyone sees before signing in.'],
  ['A shop page', `/members/${ids.shop}`, 'Cover, area, hours, ratings. No message button.'],
  ['Sign up', '/register', 'Business first, then person.'],
  ['Log in', '/login', ''],
  ['Forgot password', '/forgot-password', ''],
  ['Help', '/help', 'Common questions and "Contact the Unc team".'],
  ['Terms of use', '/terms', ''],
]);
await section('Buyer (signed in as Sam Buyer)', BUYER, 'en', [
  ['Home', '/', 'Needs your attention, your requests, requests you could help with.'],
  ['My requests', '/my-requests', ''],
  ['My request with offers', `/requests/${ids.ps5}`, 'Offers, Compare offers, tips, keep it open.'],
  ['Post a request', '/requests/new', ''],
  ['Messages', '/messages', 'One conversation per request.'],
  ['A chat', `/messages/${ids.conv}`, 'Offers, hidden numbers, deal, rating.'],
  ['Notifications', '/notifications', ''],
  ['Account', '/account', 'Profile, settings, your data.'],
  ['Request alerts', '/alerts', ''],
  ['Saved', '/saved', 'Saved requests and favourite sellers.'],
  ['Orders', '/orders', ''],
  ['Wallet', '/wallet', 'Unc credit.'],
  ['Invite friends', '/invite', ''],
  ['Payment card', '/payment-card', ''],
  ['What people ask for', '/demand', ''],
  ['Get help (signed in)', '/help', 'With the contact form and your questions.'],
]);
await section('Shop (signed in as Riverside Electronics)', SHOP, 'en', [
  ['Home', '/', 'Requests the shop could help with.'],
  ['A buyer\'s request', `/requests/${ids.ps5}`, 'The shop\'s view: make an offer.'],
  ['Messages', '/messages', ''],
  ['Account with shop page editor', '/account', 'Cover photo, area, opening hours.'],
]);
await section('Admin', ADMIN, 'en', [
  ['Admin', '/admin', 'Identity checks, reports, help questions, owner dashboard.'],
]);
await section('Arabic (right-to-left)', BUYER, 'ar', [
  ['الرئيسية · Home', '/', ''],
  ['الطلبات · Requests', '/browse', ''],
  ['المحلات · Shops', '/shops', ''],
  ['الفئات · Categories', '/categories', ''],
  ['المحادثة · Chat', `/messages/${ids.conv}`, ''],
  ['الحساب · Account', '/account', ''],
]);

const date = new Date().toISOString().slice(0, 10);
const count = sections.reduce((n, s) => n + s.items.length, 0);
const html = `<!doctype html><meta charset="utf-8"><style>
@page { size: 1600px 1000px; margin: 0; }
* { box-sizing: border-box; } body { margin: 0; background: #0b0c0f; color: #f2f2f4; font: 16px system-ui, sans-serif; }
.pg { width: 1600px; height: 1000px; padding: 36px 48px; page-break-after: always; overflow: hidden; position: relative; }
h1 { font-size: 64px; margin: 260px 0 12px; } h1 b { color: #ff7a4d; } .sub { color: #9ba1ab; font-size: 22px; }
h2 { font-size: 26px; margin: 0 0 4px; } .sec { color: #ff7a4d; font-size: 14px; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
.path { color: #9ba1ab; font: 14px ui-monospace, monospace; } .note { color: #c9ccd3; font-size: 15px; margin: 4px 0 0; }
.desk { margin-top: 18px; height: 800px; } .desk img { height: 100%; border: 1px solid #262a32; border-radius: 6px; }
.phones { margin-top: 18px; display: flex; gap: 24px; } .phones img { height: 800px; border: 1px solid #262a32; border-radius: 18px; }
.lbl { position: absolute; top: 40px; right: 48px; color: #9ba1ab; font-size: 14px; }
.toc { columns: 2; font-size: 16px; line-height: 1.7; margin-top: 18px; } .toc b { color: #ff7a4d; }
</style>
<div class="pg"><h1>un<b>c</b> — every tab and page</h1><div class="sub">${count} screens · computer and phone · ${date}</div></div>
<div class="pg"><h2>Contents</h2><div class="toc">${sections.map((s) => `<b>${s.title}</b><br>${s.items.map((i) => `· ${i.name}`).join('<br>')}<br><br>`).join('')}</div></div>
${sections.map((s) => s.items.map((i) => `
<div class="pg"><div class="sec">${s.title}</div><h2>${i.name}</h2><div class="path">${i.path}</div>${i.note ? `<p class="note">${i.note}</p>` : ''}<div class="lbl">Computer</div><div class="desk"><img src="${i.desk}"></div></div>
<div class="pg"><div class="sec">${s.title}</div><h2>${i.name}</h2><div class="path">${i.path}</div><div class="lbl">Phone, top to bottom</div><div class="phones">${i.frames.map((f) => `<img src="${f}">`).join('')}</div></div>`).join('')).join('')}`;
const pdfPage = await browser.newPage();
await pdfPage.setContent(html, { waitUntil: 'load' });
await pdfPage.pdf({ path: OUT, width: '1600px', height: '1000px', printBackground: true });
await browser.close();
console.log('wrote', OUT, `(${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB, ${count} screens)`);
