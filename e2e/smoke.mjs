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
// Test images: only the element is captured (not the whole white page).
{ const p = await browser.newPage(); await p.setContent('<div style="width:300px;height:200px;background:#cde">ID CARD</div>'); await p.locator('div').screenshot({ path: img }); await p.close(); }
const face = `${OUT}/fake-face.png`;
{ const p = await browser.newPage(); await p.setContent('<div style="width:240px;height:240px;background:linear-gradient(135deg,#2f6fed,#f5a623);color:#fff;font:700 96px sans-serif;display:grid;place-items:center">R</div>'); await p.locator('div').screenshot({ path: face }); await p.close(); }

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
  // Welcome step: photo, a few words, interests
  await p.waitForURL('**/welcome');
  await p.setInputFiles('.photo-edit input[type=file]', face);
  await p.waitForSelector('.photo-edit img.avatar');
  await p.fill('#bio', type === 'business' ? 'Family electronics shop in Austin since 2010.' : 'I like retro games and good coffee.');
  await p.click(`.chip:has-text("${type === 'business' ? 'Electronics' : 'Toys & Kids'}")`);
  await shot(p, `02b-welcome-${type}`);
  await p.click('button:has-text("Save and continue")');
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
await buyer.waitForSelector('.toast:has-text("Posted!")'); // celebration message
// Share: on a computer, a WhatsApp link with the request's address.
await buyer.click('.share > button');
const wa = await buyer.getAttribute('.share-menu a.whatsapp', 'href');
if (!wa.startsWith('https://wa.me/?text=') || !decodeURIComponent(wa).includes(buyer.url())) throw new Error(`bad WhatsApp link: ${wa}`);
await shot(buyer, '08b-share');
await buyer.click('.share > button'); // close the menu
await shot(buyer, '08-request-owner-view');
const listingUrl = buyer.url();

await vendor.goto(BASE + '/');
await vendor.waitForSelector('.card h3');
await shot(vendor, '09-browse');
await vendor.goto(listingUrl);
// Save it for later, see it on the Saved page and the home page, then come back.
await vendor.click('.save-btn'); await vendor.waitForSelector('.save-btn.on');
await vendor.goto(BASE + '/saved'); await vendor.waitForSelector('.card h3:has-text("PS5")');
await shot(vendor, '09b-saved');
await vendor.goto(BASE + '/'); await vendor.waitForSelector('h2:has-text("Saved for later")');
await vendor.goto(listingUrl); await vendor.waitForSelector('.save-btn.on');
await vendor.fill('#offerPrice', '380'); await vendor.fill('#message', 'Hi! I have a PS5 disc edition with 2 controllers, boxed, 6 months old.');
await vendor.setInputFiles('#offerPhoto', face); // photo of the item with the offer
await vendor.waitForSelector('.thumb img');
await shot(vendor, '10-make-offer');
await vendor.click('button:has-text("Send offer")');
await vendor.waitForURL('**/messages/*');
await vendor.waitForSelector('.bubble');

// The 🔔 shows the new offer; opening it clears the count.
await buyer.goto(BASE + '/'); await buyer.waitForSelector('.bell .unread-dot');
await buyer.click('.bell'); await buyer.waitForSelector('.inbox-item.unread:has-text("made an offer")');
await shot(buyer, '10b-notifications');
await buyer.waitForSelector('.bell .unread-dot', { state: 'detached' });

await buyer.goto(BASE + '/messages');
await buyer.waitForSelector('.inbox-item');
await shot(buyer, '11-buyer-inbox');
await buyer.click('.inbox-item');
await buyer.waitForSelector('.bubble');
// A quick-reply chip fills the message box.
await buyer.click('.quick-replies .chip:has-text("Where can we meet?")');
if ((await buyer.inputValue('.chat-form textarea')) !== 'Where can we meet?') throw new Error('quick reply did not fill the box');
await buyer.fill('.chat-form textarea', 'Sounds great — can you do $350 if I pick up today?');
await buyer.setInputFiles('.chat-form input[type=file]', img); // buyer sends a photo too
await buyer.waitForSelector('.attach-preview img');
await buyer.click('.chat-form button.btn');
await vendor.waitForSelector('text=can you do $350', { timeout: 8000 });
await vendor.waitForSelector('.bubble.mine .bubble-photo img'); // vendor's own offer photo
// open a photo full-screen and close it again
await vendor.click('.bubble.mine .bubble-photo');
await vendor.waitForSelector('.lightbox img');
await shot(vendor, '12b-photo-viewer');
await vendor.keyboard.press('Escape');
await vendor.waitForSelector('.lightbox', { state: 'detached' });
await vendor.waitForSelector('.chat-head .active-now'); // the buyer is online right now
await shot(vendor, '12-vendor-chat');
await shot(buyer, '13-buyer-chat');

// Offer cards: the buyer counters with $350, the seller accepts it.
await buyer.click('.offer-actions button:has-text("Counter")');
await buyer.fill('.offer-actions input', '350');
await buyer.click('.offer-actions button:has-text("Send")');
await vendor.waitForSelector('.offer-card:has-text("Counter-offer") button:has-text("Accept")', { timeout: 8000 });
await vendor.click('.offer-card button:has-text("Accept")');
await vendor.waitForSelector('.answer-line:has-text("You accepted")');
await buyer.waitForSelector('.answer-line:has-text("accepted")', { timeout: 8000 });
await buyer.waitForSelector('text=Got it? Mark the request as found');
await shot(buyer, '13b-offer-accepted');

// Ratings: buyer marks the request fulfilled, picking this seller -> both rate
await buyer.goto(listingUrl);
await buyer.waitForSelector('text=1 person looked at it'); // the seller opened it
await buyer.click('button:has-text("I found it")');
await buyer.waitForSelector('text=Who did you buy from?');
await buyer.check('.choice:has-text("Riverside Electronics") input');
await shot(buyer, '21-pick-seller');
await buyer.click('button:has-text("Yes, I found it")');
await buyer.waitForSelector('.toast:has-text("Found it!")');
await shot(buyer, '21b-found-it');
await buyer.waitForSelector('text=Bought from');
await buyer.click('text=Rate them');
await buyer.waitForSelector('text=Deal done!');
await buyer.click('.star-input label:nth-of-type(5)');
await buyer.fill('.deal-banner textarea', 'Exactly as described, quick pickup.');
await shot(buyer, '22-rate-form');
await buyer.click('button:has-text("Submit rating")');
await buyer.waitForSelector('text=Waiting for Riverside Electronics to rate you');
await shot(buyer, '23-rated-waiting');
// A "Found it" story with a photo (optional, public).
await buyer.fill('.story-form textarea', 'Got my PS5 the same day — thanks Riverside! 🎮');
await buyer.setInputFiles('#storyPhoto', face);
await buyer.waitForSelector('.story-form .thumb img');
await shot(buyer, '23b-story-form');
await buyer.click('.story-form button:has-text("Share publicly")');
await buyer.waitForSelector('.toast:has-text("Story shared")');
await buyer.waitForSelector('.story-form', { state: 'detached' });

await vendor.reload();
await vendor.waitForSelector('text=has already rated you');
await vendor.click('.star-input label:nth-of-type(4)');
await vendor.click('button:has-text("Submit rating")');
await vendor.waitForSelector('text=They rated you');
await shot(vendor, '24-both-rated');

await buyer.click('.chat-head a[href^="/members/"]');
await buyer.waitForSelector('text=Exactly as described');
await buyer.waitForSelector('.story:has-text("Got my PS5")'); // the story, on the seller's profile
await buyer.waitForSelector('.earned .badge'); // earned badges (🌱 New member)
await shot(buyer, '25-profile');
await buyer.goto(BASE + '/'); await buyer.waitForSelector('.story:has-text("Got my PS5")');
await shot(buyer, '26-home-stories');
// "Happening near you": the deal shows up anonymously, Austin first.
await buyer.waitForSelector('.feed li.near:has-text("Someone in Austin found what they needed in Electronics")');
if (await buyer.locator('.feed:has-text("Sam Buyer")').count()) throw new Error('the feed named a private member');
await buyer.locator('.feed').screenshot({ path: `${OUT}/29-feed.png` });
// Account: the phone-notifications card is there (headless Chrome can't
// subscribe, so it shows the 'blocked' or 'turn on' state).
await buyer.goto(BASE + '/account'); await buyer.waitForSelector('.push-card h2');
// New-offer emails: on by default; switching off is saved.
const emailBox = buyer.locator('[data-setting=emailOffers]');
if (!(await emailBox.isChecked())) throw new Error('new-offer emails should be on by default');
await emailBox.uncheck(); await buyer.waitForTimeout(300);
await buyer.reload(); await buyer.waitForSelector('.toggle-row');
if (await emailBox.isChecked()) throw new Error('switching off new-offer emails was not saved');
await emailBox.check(); await buyer.waitForTimeout(300);
// Privacy: "Hide when I'm online" removes "Active now" for others.
const buyerProfile = BASE + await buyer.getAttribute('a[href^="/members/"]', 'href');
await vendor.goto(buyerProfile); await vendor.waitForSelector('.active-now');
await buyer.locator('[data-setting=hideActivity]').check(); await buyer.waitForTimeout(300);
await shot(buyer, '27-privacy');
await vendor.reload(); await vendor.waitForSelector('h1');
if (await vendor.locator('.active-now').count()) throw new Error('"Active now" still shown after hiding');

// Shop page: the business seller adds area, hours and a cover photo.
await vendor.goto(BASE + '/account'); await vendor.waitForSelector('.shop-editor');
await vendor.fill('#shopArea', 'Call 3912 3456'); // a phone number is refused
await vendor.click('.shop-editor button:has-text("Save shop page")');
await vendor.waitForSelector('.shop-editor .alert.error');
await vendor.fill('#shopArea', 'Seef, Manama');
for (let d = 0; d < 7; d++) if (d !== 5) await vendor.locator('.hours-row input[type=checkbox]').nth(d).check(); // closed Fridays
await vendor.setInputFiles('[data-testid=cover-input]', img);
await vendor.waitForSelector('img.shop-cover-preview');
await vendor.click('.shop-editor button:has-text("Save shop page")');
await vendor.waitForSelector('text=Saved ✓');
const shopUrl = BASE + await vendor.getAttribute('a[href^="/members/"]', 'href');
await buyer.goto(shopUrl);
await buyer.waitForSelector('img.shop-cover');
await buyer.waitForSelector('.shop-hours .open-now, .shop-hours .closed-now');
await buyer.waitForSelector('text=Seef, Manama');
await shot(buyer, '28-shop-page');

// mobile view
const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m.newPage(); await mp.goto(BASE + '/'); await mp.waitForSelector('.hero'); await mp.waitForSelector('.feed li'); /* visitors see "Happening on Unc" */ await shot(mp, '14-mobile-home');
console.log('E2E OK');
await browser.close();
