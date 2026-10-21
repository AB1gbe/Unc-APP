// End-to-end smoke test: drives a real browser through the whole journey
// (sign up -> email code -> KYC -> admin approval -> post request -> vendor
// offer -> buyer reply) and saves screenshots to e2e/screenshots/.
//
// Needs the app running on :4000 with a FRESH database and the default admin
// login. See docs/Build Guide/Step 12 - End-to-end check.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
const browser = await chromium.launch();
const img = `${OUT}/fake-id.png`;
{ const p = await browser.newPage(); await p.setContent('<div style="width:300px;height:200px;background:#cde">ID CARD</div>'); await p.screenshot({ path: img }); await p.close(); }

async function onboard(name, email, type) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto(BASE + '/register');
  if (type === 'business') await p.check('input[value=business]');
  await p.fill('#displayName', name); await p.fill('#email', email); await p.fill('#password', 'Password123'); await p.fill('#city', 'Austin');
  await shot(p, `01-register-${type}`);
  await p.click('button:has-text("Create account")');
  await p.waitForURL('**/verify-email');
  const code = (await p.textContent('.alert.info b')).trim();
  await shot(p, '02-verify-email');
  await p.fill('#code', code); await p.click('button:has-text("Confirm email")');
  await p.waitForURL('**/verification');
  await p.click('button:has-text("Start verification")');
  await p.fill('#legalName', name + ' Legal'); await p.fill('#dateOfBirth', '1990-04-03'); await p.fill('#country', 'United States');
  await p.selectOption('#idType', 'national_id'); await p.fill('#idNumber', 'ID' + Math.floor(Math.random() * 1e9));
  if (type === 'business') { await p.fill('#businessName', name + ' LLC'); await p.fill('#businessRegNumber', 'REG-55'); await p.setInputFiles('#businessDoc', img); }
  await p.setInputFiles('#docFront', img); await p.setInputFiles('#docBack', img); await p.setInputFiles('#selfie', img);
  await shot(p, `03-kyc-form-${type}`);
  await p.click('button:has-text("Submit for verification")');
  await p.waitForSelector('text=We\'re checking your documents');
  await shot(p, '04-kyc-pending');
  return p;
}

async function adminApproveAll() {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/login'); await p.fill('#email', process.env.ADMIN_EMAIL || 'admin@unc.local'); await p.fill('#password', process.env.ADMIN_PASSWORD || 'ChangeMe123!');
  await p.click('button:has-text("Log in")'); await p.waitForURL(BASE + '/');
  await p.goto(BASE + '/admin');
  await p.waitForSelector('text=Identity verification');
  await shot(p, '05-admin-queue');
  while (await p.locator('a:has-text("Review")').count()) {
    await p.locator('a:has-text("Review")').first().click();
    await p.waitForSelector('button:has-text("Approve")');
    await shot(p, '06-admin-review');
    await p.click('button:has-text("Approve")');
    await p.waitForURL(BASE + '/admin'); await p.waitForTimeout(300);
  }
  return p;
}

const buyer = await onboard('Sam Buyer', 'sam@x.test', 'individual');
const vendor = await onboard('Riverside Electronics', 'shop@x.test', 'business');
const admin = await adminApproveAll();

await buyer.reload(); await buyer.goto(BASE + '/requests/new');
await buyer.fill('#title', 'Looking for a used PS5 with two controllers');
await buyer.selectOption('#category', 'Electronics');
await buyer.fill('#description', 'Disc edition preferred, must work perfectly. Original box is a bonus.');
await buyer.fill('input[aria-label="Minimum budget"]', '300'); await buyer.fill('input[aria-label="Maximum budget"]', '420');
await buyer.fill('#neededBy', '2026-12-01');
await buyer.setInputFiles('#images', img);
await shot(buyer, '07-new-request');
await buyer.click('button:has-text("Post request")');
await buyer.waitForSelector('text=Your request');
await shot(buyer, '08-request-owner-view');
const listingUrl = buyer.url();

await vendor.goto(BASE + '/');
await vendor.waitForSelector('.card h3');
await shot(vendor, '09-browse');
await vendor.goto(listingUrl);
await vendor.fill('#offerPrice', '380'); await vendor.fill('#message', 'Hi! I have a PS5 disc edition with 2 controllers, boxed, 6 months old.');
await shot(vendor, '10-make-offer');
await vendor.click('button:has-text("Send offer")');
await vendor.waitForURL('**/messages/*');
await vendor.waitForSelector('.bubble');

await buyer.goto(BASE + '/messages');
await buyer.waitForSelector('.inbox-item');
await shot(buyer, '11-buyer-inbox');
await buyer.click('.inbox-item');
await buyer.waitForSelector('.bubble');
await buyer.fill('.chat-form textarea', 'Sounds great — can you do $350 if I pick up today?');
await buyer.click('.chat-form button');
await vendor.waitForSelector('text=can you do $350', { timeout: 8000 });
await shot(vendor, '12-vendor-chat');
await shot(buyer, '13-buyer-chat');

// Ratings: buyer marks the request fulfilled, picking this seller -> both rate
await buyer.goto(listingUrl);
await buyer.click('button:has-text("I found it")');
await buyer.waitForSelector('text=Who did you buy from?');
await buyer.check('.choice:has-text("Riverside Electronics") input');
await shot(buyer, '21-pick-seller');
await buyer.click('button:has-text("Mark fulfilled")');
await buyer.waitForSelector('text=Bought from');
await buyer.click('text=Rate them');
await buyer.waitForSelector('text=Deal done!');
await buyer.click('.star-input label:nth-of-type(5)');
await buyer.fill('.deal-banner textarea', 'Exactly as described, quick pickup.');
await shot(buyer, '22-rate-form');
await buyer.click('button:has-text("Submit rating")');
await buyer.waitForSelector('text=Waiting for Riverside Electronics to rate you');
await shot(buyer, '23-rated-waiting');

await vendor.reload();
await vendor.waitForSelector('text=has already rated you');
await vendor.click('.star-input label:nth-of-type(4)');
await vendor.click('button:has-text("Submit rating")');
await vendor.waitForSelector('text=They rated you');
await shot(vendor, '24-both-rated');

await buyer.click('.chat-head a[href^="/members/"]');
await buyer.waitForSelector('text=Exactly as described');
await shot(buyer, '25-profile');

// mobile view
const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m.newPage(); await mp.goto(BASE + '/'); await mp.waitForSelector('.hero'); await shot(mp, '14-mobile-home');
console.log('E2E OK');
await browser.close();
