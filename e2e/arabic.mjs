// Arabic end-to-end check: the whole journey in an Arabic browser, with
// Arabic content. On every page it checks:
//   1. the page is right-to-left,
//   2. nothing overflows sideways (desktop AND phone width),
//   3. no English UI text leaks through (any Latin word that isn't on the
//      ALLOWED list fails the run).
// Screenshots -> e2e/screenshots/ar-*.png
// Needs the app on :4000 with a FRESH database (see docs/Build Guide/Step 12).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const ADMIN = [process.env.ADMIN_EMAIL || 'admin@unc.local', process.env.ADMIN_PASSWORD || 'ChangeMe123!'];
// Latin text that is SUPPOSED to appear on Arabic pages.
const ALLOWED = new Set(['Unc', 'unc', 'un', 'c', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PDF', 'JPG', 'PNG', 'WEBP', 'English', 'iPhone', 'GB']);

const browser = await chromium.launch();
const problems = [];
const img = `${OUT}/ar-fake-id.png`;
{ const p = await browser.newPage(); await p.setContent('<div style="width:300px;height:200px;background:#cde">ID</div>'); await p.screenshot({ path: img }); await p.close(); }

async function newUser() {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, locale: 'ar-BH' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  return p;
}

async function check(p, name) {
  await p.waitForTimeout(400);
  const info = await p.evaluate(() => ({
    dir: document.documentElement.dir,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    // visible text, minus email addresses
    text: document.body.innerText.replace(/\S+@\S+/g, ''),
  }));
  if (info.dir !== 'rtl') problems.push(`${name}: dir=${info.dir}`);
  if (info.overflow) problems.push(`${name}: horizontal overflow`);
  const latin = [...new Set(info.text.match(/[A-Za-z]{2,}/g) || [])].filter((w) => !ALLOWED.has(w));
  if (latin.length) problems.push(`${name}: English text on page: ${latin.join(', ')}`);
  await p.screenshot({ path: `${OUT}/ar-${name}.png`, fullPage: true });
  // same page at phone width
  const vp = p.viewportSize();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) problems.push(`${name}: horizontal overflow on phone`);
  await p.screenshot({ path: `${OUT}/ar-${name}-phone.png`, fullPage: true });
  await p.setViewportSize(vp);
}

async function onboard(p, { name, email, business, idNumber }) {
  await p.goto(BASE + '/register');
  await check(p, 'register');
  if (business) await p.check('input[value=business]');
  await p.fill('#displayName', name); await p.fill('#email', email); await p.fill('#password', 'Password123'); await p.fill('#city', 'المنامة');
  await p.click('form button.btn.block');
  await p.waitForURL('**/verify-email');
  await check(p, 'verify-email');
  await p.fill('#code', (await p.textContent('.alert.info b')).trim());
  await p.click('form button.btn.block');
  await p.waitForURL('**/verification');
  await check(p, 'verification-start');
  await p.click('.card button.btn.block');
  await p.fill('#legalName', name); await p.fill('#dateOfBirth', '1992-03-04'); await p.fill('#country', 'البحرين');
  await p.selectOption('#idType', 'national_id'); await p.fill('#idNumber', idNumber);
  if (business) { await p.fill('#businessName', name + ' ذ.م.م'); await p.fill('#businessRegNumber', '12345-1'); await p.setInputFiles('#businessDoc', img); }
  await p.setInputFiles('#docFront', img); await p.setInputFiles('#docBack', img); await p.setInputFiles('#selfie', img);
  await check(p, business ? 'kyc-form-business' : 'kyc-form');
  await p.click('form button.btn.block');
  await p.waitForSelector('.card .badge.warn');
  await check(p, 'kyc-pending');
}

const buyer = await newUser();
await onboard(buyer, { name: 'سارة أحمد', email: 'sara@ar.test', idNumber: '880101234' });
const vendor = await newUser();
await onboard(vendor, { name: 'متجر الخليج للإلكترونيات', email: 'shop@ar.test', business: true, idNumber: '770202345' });

// admin approves both (in Arabic)
const admin = await newUser();
await admin.goto(BASE + '/login'); await admin.fill('#email', ADMIN[0]); await admin.fill('#password', ADMIN[1]);
await check(admin, 'login');
await admin.click('form button.btn.block'); await admin.waitForURL(BASE + '/');
await admin.goto(BASE + '/admin'); await admin.waitForSelector('table');
await check(admin, 'admin');
let first = true;
while (await admin.locator('table a.btn.sm').count()) {
  await admin.locator('table a.btn.sm').first().click();
  await admin.waitForSelector('button.btn.ok');
  if (first) { await check(admin, 'admin-kyc-review'); first = false; }
  await admin.click('button.btn.ok'); await admin.waitForURL(BASE + '/admin'); await admin.waitForTimeout(300);
}

// buyer posts a request in Arabic
await buyer.goto(BASE + '/requests/new');
await buyer.fill('#title', 'أبحث عن جهاز بلايستيشن 5 مستعمل');
await buyer.selectOption('#category', { index: 1 });
await buyer.fill('#description', 'بحالة ممتازة مع يدّين تحكم، ويفضّل مع الكرتون الأصلي.');
await buyer.fill('#city', 'المنامة');
await buyer.locator('.field-row input[type=number]').first().fill('120');
await check(buyer, 'new-request');
await buyer.click('form button.btn.block');
await buyer.waitForURL(/\/requests\/\d+$/);
const listingUrl = buyer.url();
await check(buyer, 'request-owner');

// vendor makes an offer
await vendor.goto(BASE + '/');
await vendor.waitForSelector('.grid .card');
await check(vendor, 'browse');
await vendor.goto(listingUrl);
await check(vendor, 'request-vendor');
await vendor.fill('#offerPrice', '140'); await vendor.fill('#message', 'مرحبًا، لدي جهاز بحالة الوكالة مع يدّين. متى يناسبك الاستلام؟');
await vendor.click('form button.btn.block');
await vendor.waitForURL('**/messages/*');
await vendor.waitForSelector('.bubble');

// buyer replies
await buyer.goto(BASE + '/messages');
await buyer.waitForSelector('.inbox-item');
await check(buyer, 'inbox');
await buyer.click('.inbox-item');
await buyer.waitForSelector('.bubble');
await buyer.fill('.chat-form textarea', 'ممتاز، هل يمكن بـ 130 دينار؟');
await buyer.click('.chat-form button');
await buyer.waitForSelector('.bubble.mine');
await check(buyer, 'conversation');

// deal + ratings
await buyer.goto(listingUrl);
await buyer.click('.btn.ok.block');
await buyer.waitForSelector('.choice input');
await buyer.locator('.choice input').first().check();
await check(buyer, 'pick-seller');
await buyer.click('form .btn.ok');
await buyer.waitForSelector('a[href^="/messages/"]');
await buyer.click('.card p a[href^="/messages/"]');
await buyer.waitForSelector('.deal-banner .star-input');
await buyer.click('.star-input label:nth-of-type(5)');
await buyer.fill('.deal-banner textarea', 'تعامل راقٍ وسريع، أنصح به.');
await check(buyer, 'rate');
await buyer.click('.deal-banner button.btn');
await buyer.waitForSelector('.deal-banner .stars');
await vendor.reload(); await vendor.waitForSelector('.deal-banner .star-input');
await vendor.click('.star-input label:nth-of-type(5)'); await vendor.click('.deal-banner button.btn');
await vendor.waitForSelector('.deal-banner .stars');
await check(vendor, 'rated');
await buyer.reload();
await buyer.click('.chat-head a[href^="/members/"]');
await buyer.waitForSelector('.review');
await check(buyer, 'profile');

for (const [pg, path] of [[buyer, '/my-requests'], [buyer, '/account'], [buyer, '/verification'], [buyer, '/forgot-password'], [buyer, '/no-such-page']]) {
  await pg.goto(BASE + path);
  await check(pg, path.slice(1));
}

await browser.close();
if (problems.length) {
  console.log(`ARABIC E2E: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('ARABIC E2E OK');
