// Paying in parts (session 40): propose, answer, mark paid, confirm.
// Only the two people in the chat, only after a price was accepted there.
import { Router } from 'express';
import { audit, tx } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { notify } from '../lib/notify.js';
import { EVERY, MAX_PARTS, MIN_PARTS, dueDates, planView, splitAmount } from '../lib/installments.js';

export function installmentRoutes(db) {
  const r = Router();
  const latestPlan = (convId) => db.prepare(`SELECT * FROM installment_plans WHERE conversation_id = ? AND status NOT IN ('declined', 'cancelled') ORDER BY id DESC LIMIT 1`).get(convId);

  function myConv(req, id) {
    const c = db.prepare(`SELECT c.*, l.currency FROM conversations c JOIN listings l ON l.id = c.listing_id WHERE c.id = ?`).get(Number(id));
    if (!c || (c.buyer_id !== req.user.id && c.vendor_id !== req.user.id)) throw notFound('Conversation not found.');
    return c;
  }
  function myPlan(req) {
    const plan = db.prepare('SELECT * FROM installment_plans WHERE id = ?').get(Number(req.params.id));
    if (!plan || (plan.buyer_id !== req.user.id && plan.vendor_id !== req.user.id)) throw notFound('Plan not found.');
    return plan;
  }
  const otherOf = (plan, meId) => (plan.buyer_id === meId ? plan.vendor_id : plan.buyer_id);
  const reply = (res, plan, meId, status = 200) => res.status(status).json({ plan: planView(db, db.prepare('SELECT * FROM installment_plans WHERE id = ?').get(plan.id), meId) });

  r.get('/conversations/:id/plan', requireAuth, (req, res) => {
    const c = myConv(req, req.params.id);
    res.json({ plan: planView(db, latestPlan(c.id), req.user.id) });
  });

  // { parts: 2-6, every: 'week'|'2weeks'|'month', firstDue: 'YYYY-MM-DD' (today to 30 days ahead) }
  r.post('/conversations/:id/plan', requireVerified, (req, res) => {
    const c = myConv(req, req.params.id);
    const agreed = db.prepare(`
      SELECT p.offer_price FROM messages a JOIN messages p ON p.id = a.reply_to
      WHERE a.conversation_id = ? AND a.kind = 'accept' ORDER BY a.id DESC LIMIT 1
    `).get(c.id)?.offer_price;
    if (agreed == null) throw new HttpError(409, 'Agree a price first, then you can plan paying in parts.');
    if (latestPlan(c.id)) throw new HttpError(409, 'This chat already has a payment plan.');
    const parts = v.int(req.body, 'parts', { min: MIN_PARTS, max: MAX_PARTS });
    const every = v.oneOf(req.body, 'every', EVERY);
    const firstDue = v.isoDate(req.body, 'firstDue');
    const today = new Date().toISOString().slice(0, 10);
    const last = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
    if (firstDue < today || firstDue > last) throw new HttpError(400, 'Choose a first payment date from today up to 30 days ahead.', { field: 'firstDue' });
    if (agreed < parts) throw new HttpError(400, 'The price is too small to split into that many parts.', { field: 'parts' });

    const plan = tx(db, () => {
      const id = Number(db.prepare(`
        INSERT INTO installment_plans (conversation_id, buyer_id, vendor_id, proposed_by, total, currency, parts, every) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(c.id, c.buyer_id, c.vendor_id, req.user.id, agreed, c.currency, parts, every).lastInsertRowid);
      const amounts = splitAmount(agreed, parts);
      dueDates(firstDue, parts, every).forEach((due, i) => {
        db.prepare('INSERT INTO installment_parts (plan_id, n, amount, due_on) VALUES (?, ?, ?, ?)').run(id, i + 1, amounts[i], due);
      });
      audit(db, req.user.id, 'plan.proposed', `plan:${id}`, { conversationId: c.id, total: agreed, parts, every });
      notify(db, req.user.id === c.buyer_id ? c.vendor_id : c.buyer_id, 'plan-proposed', { actorId: req.user.id, listingId: c.listing_id, conversationId: c.id });
      return { id };
    });
    reply(res, plan, req.user.id, 201);
  });

  // The other person accepts or declines a proposed plan.
  r.post('/plans/:id/respond', requireVerified, (req, res) => {
    const plan = myPlan(req);
    const action = v.oneOf(req.body, 'action', ['accept', 'decline']);
    if (plan.status !== 'proposed') throw new HttpError(409, 'This plan has already been answered.');
    if (plan.proposed_by === req.user.id) throw new HttpError(400, "You can't answer your own plan.");
    db.prepare(`UPDATE installment_plans SET status = ?, decided_at = datetime('now') WHERE id = ?`).run(action === 'accept' ? 'active' : 'declined', plan.id);
    audit(db, req.user.id, `plan.${action}`, `plan:${plan.id}`);
    notify(db, plan.proposed_by, action === 'accept' ? 'plan-accepted' : 'plan-declined', { actorId: req.user.id, conversationId: plan.conversation_id });
    reply(res, plan, req.user.id);
  });

  // Withdraw a proposal (whoever proposed it), or end an active plan early
  // (the seller only, e.g. when the rest was paid at once).
  r.post('/plans/:id/cancel', requireAuth, (req, res) => {
    const plan = myPlan(req);
    const ok = (plan.status === 'proposed' && plan.proposed_by === req.user.id) || (plan.status === 'active' && plan.vendor_id === req.user.id);
    if (!ok) throw new HttpError(409, "You can't cancel this plan.");
    db.prepare(`UPDATE installment_plans SET status = 'cancelled', decided_at = datetime('now') WHERE id = ?`).run(plan.id);
    audit(db, req.user.id, 'plan.cancelled', `plan:${plan.id}`);
    reply(res, plan, req.user.id);
  });

  // The buyer: "I've paid this part". The seller: "Received".
  function part(req, plan) {
    if (plan.status !== 'active') throw new HttpError(409, 'This plan is not running.');
    const p = db.prepare('SELECT * FROM installment_parts WHERE plan_id = ? AND n = ?').get(plan.id, Number(req.params.n));
    if (!p) throw notFound('Payment not found.');
    return p;
  }
  r.post('/plans/:id/parts/:n/paid', requireAuth, (req, res) => {
    const plan = myPlan(req);
    if (req.user.id !== plan.buyer_id) throw new HttpError(403, 'Only the buyer can mark a payment as paid.');
    const p = part(req, plan);
    if (p.paid_at) throw new HttpError(409, 'This payment is already marked as paid.');
    db.prepare(`UPDATE installment_parts SET paid_at = datetime('now') WHERE id = ?`).run(p.id);
    notify(db, plan.vendor_id, 'part-paid', { actorId: req.user.id, conversationId: plan.conversation_id });
    reply(res, plan, req.user.id);
  });
  r.post('/plans/:id/parts/:n/confirm', requireAuth, (req, res) => {
    const plan = myPlan(req);
    if (req.user.id !== plan.vendor_id) throw new HttpError(403, 'Only the seller can confirm a payment was received.');
    const p = part(req, plan);
    if (p.confirmed_at) throw new HttpError(409, 'This payment is already confirmed.');
    tx(db, () => {
      // The seller may confirm money that arrived before the buyer marked it.
      db.prepare(`UPDATE installment_parts SET confirmed_at = datetime('now'), paid_at = COALESCE(paid_at, datetime('now')) WHERE id = ?`).run(p.id);
      const left = db.prepare('SELECT COUNT(*) AS n FROM installment_parts WHERE plan_id = ? AND confirmed_at IS NULL').get(plan.id).n;
      if (!left) db.prepare(`UPDATE installment_plans SET status = 'completed', decided_at = datetime('now') WHERE id = ?`).run(plan.id);
      notify(db, plan.buyer_id, 'part-confirmed', { actorId: req.user.id, conversationId: plan.conversation_id });
    });
    reply(res, plan, req.user.id);
  });

  return r;
}
