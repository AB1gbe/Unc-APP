// Paying for ads (session 88, ADR-077). Like Craigslist: people post for
// free; BUSINESSES pay for each ad in For sale, Housing and Jobs. Wanted
// requests and offers stay free for everyone.
//
// A business pays either from its prepaid ad credit (packs, with a bonus)
// or, when the credit is too low, its saved card is charged for that one
// ad. Every card payment gets a receipt (UNC-2026-000123).
// Amounts are in fils: 1000 = BD 1.000.
import crypto from 'node:crypto';
import { HttpError } from './http.js';
import { paymentProvider } from './payments.js';

export const AD_PRICES = { forsale: 1000, housing: 3000, jobs: 5000 };
// [id, BD paid, BD of ad credit received]
export const PACKS = [
  { id: 'pack10', price: 10000, credit: 11000 },
  { id: 'pack25', price: 25000, credit: 28000 },
  { id: 'pack50', price: 50000, credit: 57500 },
];

export const priceFor = (user, section) => (user?.account_type === 'business' ? AD_PRICES[section] ?? 0 : 0);
export const creditOf = (db, userId) => db.prepare('SELECT COALESCE(SUM(amount), 0) AS n FROM ad_credit WHERE user_id = ?').get(userId).n;

const receiptNo = (id) => `UNC-${new Date().getUTCFullYear()}-${String(id).padStart(6, '0')}`;

// Charges the business's saved card. Runs BEFORE anything is written, so a
// declined card changes nothing.
async function chargeCard(db, userId, amount, description) {
  const card = db.prepare('SELECT * FROM payment_cards WHERE user_id = ?').get(userId);
  if (!card) throw new HttpError(402, 'Please add a payment card first.', { code: 'CARD_REQUIRED' });
  const ref = await paymentProvider().charge(card, amount, description);
  return { card, ref };
}

function recordPayment(db, { userId, actorId, kind, pack = null, amount, credit = 0, listingId = null, card, ref }) {
  const id = Number(db.prepare(`
    INSERT INTO ad_payments (user_id, receipt_no, kind, pack, amount, credit, listing_id, card_brand, card_last4, provider_ref, actor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, `tmp-${crypto.randomUUID()}`, kind, pack, amount, credit, listingId, card.brand, card.last4, ref, actorId ?? null).lastInsertRowid);
  db.prepare('UPDATE ad_payments SET receipt_no = ? WHERE id = ?').run(receiptNo(id), id);
  return id;
}

// Buy a pack: charge the card, then add the credit (pack price + bonus).
export async function buyPack(db, user, actorId, packId) {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new HttpError(400, 'Please choose a pack.', { field: 'pack' });
  const { card, ref } = await chargeCard(db, user.id, pack.price, `Unc ad credit ${pack.id}`);
  const paymentId = recordPayment(db, { userId: user.id, actorId, kind: 'pack', pack: pack.id, amount: pack.price, credit: pack.credit, card, ref });
  db.prepare(`INSERT INTO ad_credit (user_id, amount, reason, payment_id) VALUES (?, ?, 'pack', ?)`).run(user.id, pack.credit, paymentId);
  return paymentId;
}

// How a new ad will be paid: { price, from: 'free' | 'credit' | 'card' }.
// For a card payment the card is charged here (before the ad is saved);
// settleAd() then records it against the new listing.
export async function payForAd(db, user, section) {
  const price = priceFor(user, section);
  if (!price) return { price: 0, from: 'free' };
  if (creditOf(db, user.id) >= price) return { price, from: 'credit' };
  const { card, ref } = await chargeCard(db, user.id, price, `Unc ad (${section})`);
  return { price, from: 'card', card, ref };
}

// Inside the listing's transaction: take the credit or record the payment.
export function settleAd(db, user, actorId, listingId, payment) {
  if (payment.from === 'free') return null;
  db.prepare('UPDATE listings SET paid_fils = ? WHERE id = ?').run(payment.price, listingId);
  if (payment.from === 'credit') {
    db.prepare(`INSERT INTO ad_credit (user_id, amount, reason, listing_id) VALUES (?, ?, 'ad', ?)`).run(user.id, -payment.price, listingId);
    return null;
  }
  return recordPayment(db, { userId: user.id, actorId, kind: 'ad', amount: payment.price, listingId, card: payment.card, ref: payment.ref });
}

export function paymentView(p) {
  return {
    id: p.id, receiptNo: p.receipt_no, kind: p.kind, pack: p.pack, amount: p.amount, credit: p.credit,
    listingId: p.listing_id, listingTitle: p.listing_title ?? null, card: { brand: p.card_brand, last4: p.card_last4 },
    paidBy: p.actor_name ?? null, createdAt: p.created_at, currency: 'BHD',
  };
}
