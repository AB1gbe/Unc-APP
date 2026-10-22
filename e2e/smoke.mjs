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
  await p.check('#acceptTerms'); // the Terms (session 40)
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

// Request alert: the seller watches Electronics before the buyer posts.
await vendor.goto(BASE + '/browse'); await vendor.selectOption('.searchbar select', 'Electronics');
await vendor.click('text=Alert me about new requests like these');
await vendor.waitForURL('**/alerts?category=Electronics');
await vendor.click('button:has-text("Save alert")');
await vendor.waitForSelector('.alert-row:has-text("Electronics")');
await shot(vendor, '06b-alerts');

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
await buyer.waitForSelector('text=Open until'); // "Still looking?" expiry date
// Share: on a computer, a WhatsApp link with the request's address.
await buyer.click('.share > button');
const wa = await buyer.getAttribute('.share-menu a.whatsapp', 'href');
if (!wa.startsWith('https://wa.me/?text=') || !decodeURIComponent(wa).includes(buyer.url())) throw new Error(`bad WhatsApp link: ${wa}`);
await shot(buyer, '08b-share');
await buyer.click('.share > button'); // close the menu
await shot(buyer, '08-request-owner-view');
const listingUrl = buyer.url();
// The seller's alert fired for the new request.
await vendor.goto(BASE + '/notifications');
await vendor.waitForSelector('.inbox-item:has-text("New request matching your alert")');

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
await vendor.selectOption('#offer-condition', 'like-new'); await vendor.selectOption('#offer-warranty', '3m'); // offer details (session 34)
await vendor.selectOption('#offer-returns', '3d');
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
await buyer.waitForSelector('.offer-details:has-text("Like new"):has-text("3-month warranty")');
await buyer.locator('.offer-card').first().screenshot({ path: `${OUT}/36-offer-details.png` });
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
// Favourite seller: from the deal box; a new Electronics request reaches them first.
await buyer.click('.deal-banner .fav-btn');
await buyer.waitForSelector('.deal-banner .fav-btn.on');
const controllerId = await buyer.evaluate(() => fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Looking for a PS5 controller', description: 'White, original', category: 'Electronics', budgetMin: 30, budgetMax: 60, currency: 'USD', city: 'Austin' }) }).then((r) => r.json()).then((j) => j.listing.id));
const vendorChat = vendor.url();
await vendor.goto(BASE + '/notifications');
await vendor.waitForSelector('.inbox-item:has-text("who favourited you, is looking for")');
await shot(vendor, '30-favourite-notification');
await vendor.goto(vendorChat); // back to the chat for the seller's rating
const buyerChat = buyer.url();
await buyer.goto(BASE + '/saved'); await buyer.waitForSelector('.inbox-item:has-text("Riverside Electronics")');
await buyer.goto(buyerChat); // back to the chat for the next steps

await vendor.reload();
await vendor.waitForSelector('text=has already rated you');
await vendor.click('.star-input label:nth-of-type(4)');
await vendor.click('button:has-text("Submit rating")');
await vendor.waitForSelector('text=They rated you');
await shot(vendor, '24-both-rated');
// "Something went wrong with this deal?" (session 34): the seller tells the team.
await vendor.click('button:has-text("Something went wrong with this deal?")');
await vendor.check('form.deal-problem input[value=payment]');
await vendor.fill('form.deal-problem textarea', 'The buyer paid only half and promised the rest by Monday.');
await shot(vendor, '37-deal-problem');
await vendor.click('button:has-text("Send to the Unc team")');
await vendor.waitForSelector('.deal-problem:has-text("Thanks for telling us")');
// Pickup checklist (session 37): ticks stay after a reload (kept on this device).
await vendor.click('.pickup summary');
await vendor.check('.pickup-item:has-text("Switch it on") input');
await vendor.reload();
await vendor.click('.pickup summary');
if (!(await vendor.isChecked('.pickup-item:has-text("Switch it on") input'))) throw new Error('pickup tick was not kept');
await vendor.locator('.pickup').screenshot({ path: `${OUT}/41-pickup.png` });

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

// Tips: the controller request has no photo, so the buyer is told to add one.
await buyer.goto(`${BASE}/requests/${controllerId}`);
await buyer.waitForSelector('.tips:has-text("Add a photo")');
await buyer.locator('.tips').screenshot({ path: `${OUT}/32-tips.png` });

// Scam warning + block: a pay-first message gets a warning; the buyer blocks, then unblocks.
const scamConv = await vendor.evaluate((id) => fetch(`/api/listings/${id}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'I have one. Send a deposit first by bank transfer and I will ship it.' }) }).then((r) => r.json()).then((j) => j.conversation.id), controllerId);
await buyer.goto(`${BASE}/messages/${scamConv}`);
await buyer.waitForSelector('.scam-warning');
await shot(buyer, '31-scam-warning');
buyer.once('dialog', (d) => d.accept());
await buyer.click('button:has-text("Block")');
await buyer.waitForSelector('.blocked-notice:has-text("You blocked Riverside Electronics")');
await buyer.goto(BASE + '/account'); await buyer.click('.card:has-text("Blocked members") button:has-text("Unblock")');
await buyer.waitForSelector('text=Blocked members', { state: 'detached' });

// Proof photo (session 34): the buyer asks; the shop sends a photo with the chat's code.
await buyer.goto(`${BASE}/messages/${scamConv}`);
await buyer.click('button:has-text("Ask for a proof photo")');
await buyer.waitForSelector('.answer-line:has-text("You asked for a proof photo")');
await vendor.goto(`${BASE}/messages/${scamConv}`);
await vendor.waitForSelector('.answer-line:has-text("asked for a proof photo")');
await vendor.setInputFiles('label.attach input[type=file]', img);
await vendor.check('.proof-check input');
await vendor.click('.chat-form button:has-text("Send")');
await vendor.waitForSelector('.proof-badge');
await buyer.waitForSelector('.proof-badge:has-text("Check that the paper")', { timeout: 15000 });
await shot(buyer, '35-proof-photo');

// Keeping deals on Unc (session 40): a number typed before a price is agreed
// shows a nudge, and the other side sees 📵.
await buyer.fill('.chat-form textarea', 'Easier on WhatsApp: 3912 3456');
await buyer.waitForSelector('.contact-nudge');
await shot(buyer, '43-contact-nudge');
await buyer.click('.chat-form button:has-text("Send")');
await buyer.waitForSelector('.hidden-note:has-text("Hidden from")');
await vendor.reload();
await vendor.waitForSelector('.bubble:has-text("Easier on WhatsApp: 📵")');
if (await vendor.locator('text=3912 3456').count()) throw new Error('number shown before agreeing a price');

// Privacy (session 34): first name only, and a request only favourite sellers may answer.
await buyer.goto(BASE + '/account');
await buyer.locator('[data-setting=shortName]').check(); await buyer.waitForTimeout(300);
await buyer.goto(BASE + '/requests/new');
await buyer.fill('#title', 'Looking for a quiet desk fan');
await buyer.selectOption('#category', 'Home & Furniture');
await buyer.fill('#description', 'Small, quiet, for a bedroom. Any colour.');
await buyer.selectOption('#contactRule', 'favourites');
await buyer.click('button:has-text("Post request")');
await buyer.waitForURL(/\/requests\/\d+$/);
const fanUrl = buyer.url();
await vendor.goto(fanUrl);
await vendor.waitForSelector('text=Sam B.');
await vendor.waitForSelector('text=The buyer chose to hear only from their favourite sellers.');
await shot(vendor, '33-favourites-only');
await buyer.goto(BASE + '/account');
await buyer.locator('[data-setting=shortName]').uncheck(); await buyer.waitForTimeout(300);

// What people are asking for (session 34): with 2 furniture requests, the shop sees that category.
await buyer.evaluate(() => fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Looking for a standing fan', description: 'Tall, quiet, with a remote.', category: 'Home & Furniture', city: 'Austin' }) }));
await vendor.goto(BASE + '/browse'); await vendor.click('text=📊 What people are asking for');
await vendor.waitForSelector('.demand-row:has-text("Home & Furniture"):has-text("fan")');
await shot(vendor, '34-demand');

// Away mode (session 37): the shop goes away; the buyer sees it in the chat.
await vendor.goto(BASE + '/account');
await vendor.fill('#awayUntil', new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10));
await vendor.click('button:has-text("Turn on away mode")');
await vendor.waitForSelector('.away-mode button:has-text("I\'m back")');
await buyer.goto(`${BASE}/messages/${scamConv}`);
await buyer.waitForSelector('.chat-head .activity.away');
await buyer.locator('.chat-head').screenshot({ path: `${OUT}/40-away.png` });
await vendor.click('.away-mode button:has-text("I\'m back")');
await vendor.waitForSelector('button:has-text("Turn on away mode")');

// Raise my budget (session 37), on the controller request ($30–$60).
await buyer.goto(`${BASE}/requests/${controllerId}`);
await buyer.click('button:has-text("Raise my budget")');
await buyer.fill('#raiseBudget', '80');
await buyer.locator('.raise-budget').screenshot({ path: `${OUT}/42-raise-budget.png` });
await buyer.click('.raise-budget button:has-text("Raise")');
await buyer.waitForSelector('.toast:has-text("Budget raised")');
await buyer.waitForSelector('text=$30 – $80');

// Owner dashboard (session 37): the admin sees today's requests in the charts.
{
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const a = await ctx.newPage();
  await a.goto(BASE + '/login'); await a.fill('#email', process.env.ADMIN_EMAIL || 'admin@unc.local'); await a.fill('#password', process.env.ADMIN_PASSWORD || 'ChangeMe123!');
  await a.click('button:has-text("Log in")'); await a.waitForURL(BASE + '/');
  await a.goto(BASE + '/admin');
  await a.waitForSelector('.stat-tiles');
  await a.click('.dashboard button:has-text("7 days")');
  await a.waitForSelector('.day-col[aria-label$=": 0"]'); // quiet days show as empty columns
  await a.locator('.day-col').last().hover();
  await a.locator('.dashboard').screenshot({ path: `${OUT}/39-dashboard.png` });
  // Report follow-up: the seller's deal problem is marked "took action"; the seller is told.
  await a.click('button:has-text("Took action")');
  await vendor.goto(BASE + '/notifications');
  await vendor.waitForSelector('.inbox-item:has-text("Our team looked at it and took action")');
  await ctx.close();
}

// Your data (session 37): download, then ask to delete and change your mind.
await buyer.goto(BASE + '/account');
const exported = await buyer.evaluate(() => fetch('/api/auth/me/export').then((r) => r.json()));
if (!exported.requests?.length) throw new Error('export has no requests');
await buyer.click('button:has-text("Delete my account")');
await buyer.fill('#deletePassword', 'Password123');
await buyer.click('button:has-text("Delete my account in 7 days")');
await buyer.waitForSelector('.delete-banner:has-text("Your account will be deleted on")');
await shot(buyer, '38-delete-pending');
await buyer.click('.delete-banner button:has-text("Keep my account")');
await buyer.waitForSelector('.delete-banner', { state: 'detached' });

// The Terms page (session 40), and the reminder next to Accept was shown earlier.
await buyer.goto(BASE + '/terms');
await buyer.waitForSelector('h2:has-text("Deals agreed on Unc are finished on Unc")');
await shot(buyer, '44-terms');

// mobile view
const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m.newPage(); await mp.goto(BASE + '/'); await mp.waitForSelector('.hero'); await mp.waitForSelector('.feed li'); /* visitors see "Happening on Unc" */ await shot(mp, '14-mobile-home');
console.log('E2E OK');
await browser.close();
