// The wallet (session 58): Unc credit, kept as a list of changes
// (wallet_entries). It is not real money yet: it can't be paid out, and
// once Unc charges fees (after Tap Payments is connected) it will count
// towards them. Amounts are in thousandths of a dinar (fils): 1000 = BD 1.
export const CREDIT_CURRENCY = 'BHD';

export function balanceOf(db, userId) {
  return db.prepare('SELECT COALESCE(SUM(amount), 0) AS n FROM wallet_entries WHERE user_id = ?').get(userId).n;
}

// Adds credit once per (reason, ref): calling it again does nothing.
// Returns true when the credit was added.
export function addCredit(db, userId, amount, reason, ref) {
  return db.prepare('INSERT OR IGNORE INTO wallet_entries (user_id, amount, reason, ref) VALUES (?, ?, ?, ?)')
    .run(userId, amount, reason, ref ?? null).changes > 0;
}
