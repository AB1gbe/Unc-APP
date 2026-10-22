// Paying in parts (session 40). For now a plan the buyer and the seller
// agree in their chat: Unc records it, reminds the buyer before each part,
// and both confirm each payment (the buyer "I've paid", the seller
// "Received"). No money goes through Unc and Unc lends nothing; later an
// installment partner can be added as provider 'partner'.
import { notify } from './notify.js';

export const MIN_PARTS = 2;
export const MAX_PARTS = 6;
export const EVERY = ['week', '2weeks', 'month'];
export const LATE_DAYS = 3;

// Equal parts; what doesn't divide goes on the first one.
export function splitAmount(total, parts) {
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => (i === 0 ? total - base * (parts - 1) : base));
}

// 'YYYY-MM-DD' of each part, starting on firstDue.
export function dueDates(firstDue, parts, every) {
  const [y, m, d] = firstDue.split('-').map(Number);
  return Array.from({ length: parts }, (_, i) => {
    const date = every === 'month'
      ? new Date(Date.UTC(y, m - 1 + i, Math.min(d, daysIn(y, m - 1 + i))))
      : new Date(Date.UTC(y, m - 1, d + i * (every === 'week' ? 7 : 14)));
    return date.toISOString().slice(0, 10);
  });
}
const daysIn = (y, monthIndex) => new Date(Date.UTC(y, monthIndex + 1, 0)).getUTCDate();

export function planView(db, plan, meId) {
  if (!plan) return null;
  const today = new Date().toISOString().slice(0, 10);
  const parts = db.prepare('SELECT * FROM installment_parts WHERE plan_id = ? ORDER BY n').all(plan.id).map((p) => ({
    n: p.n, amount: p.amount, dueOn: p.due_on, paidAt: p.paid_at, confirmedAt: p.confirmed_at,
    late: plan.status === 'active' && !p.paid_at && p.due_on < today,
  }));
  return {
    id: plan.id, status: plan.status, provider: plan.provider, total: plan.total, currency: plan.currency,
    parts, every: plan.every, proposedByMe: plan.proposed_by === meId, createdAt: plan.created_at,
    paid: parts.filter((p) => p.confirmedAt).reduce((n, p) => n + p.amount, 0),
  };
}

// Hourly: remind the buyer the day before a part is due, and tell both
// sides once when a part is LATE_DAYS late. Each only once per part.
export function runInstallmentReminders(db) {
  const due = db.prepare(`
    SELECT p.id, pl.buyer_id, pl.vendor_id, pl.conversation_id FROM installment_parts p JOIN installment_plans pl ON pl.id = p.plan_id
    WHERE pl.status = 'active' AND p.paid_at IS NULL AND p.reminded_at IS NULL AND p.due_on <= date('now', '+1 day')
  `).all();
  for (const p of due) {
    db.prepare(`UPDATE installment_parts SET reminded_at = datetime('now') WHERE id = ?`).run(p.id);
    notify(db, p.buyer_id, 'part-due', { actorId: p.vendor_id, conversationId: p.conversation_id });
  }
  const late = db.prepare(`
    SELECT p.id, pl.buyer_id, pl.vendor_id, pl.conversation_id FROM installment_parts p JOIN installment_plans pl ON pl.id = p.plan_id
    WHERE pl.status = 'active' AND p.paid_at IS NULL AND p.late_notified_at IS NULL AND p.due_on <= date('now', '-${LATE_DAYS} days')
  `).all();
  for (const p of late) {
    db.prepare(`UPDATE installment_parts SET late_notified_at = datetime('now') WHERE id = ?`).run(p.id);
    notify(db, p.buyer_id, 'part-late', { actorId: p.vendor_id, conversationId: p.conversation_id });
    notify(db, p.vendor_id, 'part-late', { actorId: p.buyer_id, conversationId: p.conversation_id });
  }
  return { reminded: due.length, late: late.length };
}
