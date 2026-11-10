// Refer a friend (session 58). A member shares their invite link
// (/register?ref=CODE). When the friend who joined with it is fully
// verified (email, identity check and payment card), the inviter gets
// REFERRAL_REWARD of Unc credit and the friend WELCOME_CREDIT. Paying only
// after the identity check stops fake accounts from farming credit: one
// real person, one account. Each reward is given once (see wallet.js).
import crypto from 'node:crypto';
import { addCredit } from './wallet.js';
import { notify } from './notify.js';

export const REFERRAL_REWARD = 1000; // fils: BD 1.000
export const WELCOME_CREDIT = 500;   // fils: BD 0.500
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

export function referralCodeOf(db, userId) {
  const u = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId);
  if (u.referral_code) return u.referral_code;
  for (;;) {
    const code = Array.from(crypto.randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join('');
    try {
      db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(code, userId);
      return code;
    } catch (err) {
      if (!/UNIQUE/.test(err.message)) throw err; // very rare: try another code
    }
  }
}

export const inviterByCode = (db, code) => (code
  ? db.prepare('SELECT id FROM users WHERE referral_code = ? AND banned_at IS NULL').get(String(code).trim().toUpperCase())?.id ?? null
  : null);

// Call after anything that can complete verification (identity approved,
// card added). Does nothing until the member is fully verified, and
// nothing the second time.
export function rewardReferral(db, userId) {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!u?.referred_by || !u.email_verified_at || u.kyc_status !== 'approved' || !u.card_added_at) return false;
  const inviter = db.prepare('SELECT id, banned_at FROM users WHERE id = ?').get(u.referred_by);
  if (!inviter || inviter.banned_at) return false;
  const ref = `user:${u.id}`;
  if (!addCredit(db, inviter.id, REFERRAL_REWARD, 'referral', ref)) return false;
  addCredit(db, u.id, WELCOME_CREDIT, 'referral-welcome', ref);
  notify(db, inviter.id, 'referral-reward', { actorId: u.id });
  return true;
}
