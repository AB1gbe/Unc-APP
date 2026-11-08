// The member's wallet and orders (session 58).
// Orders = every chat where a price was accepted or a deal was recorded,
// with where it stands: agreed, paying in parts, rate them, done.
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { avatarUrl } from '../lib/uploads.js';
import { canStillRate } from '../lib/ratings.js';
import { planView } from '../lib/installments.js';
import { CREDIT_CURRENCY, balanceOf } from '../lib/wallet.js';
import { nameFor } from '../../../shared/names.js';

export function walletRoutes(db) {
  const r = Router();

  r.get('/wallet', requireAuth, (req, res) => {
    const entries = db.prepare('SELECT amount, reason, created_at FROM wallet_entries WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(req.user.id);
    res.json({
      currency: CREDIT_CURRENCY,
      balance: balanceOf(db, req.user.id),
      entries: entries.map((e) => ({ amount: e.amount, reason: e.reason, createdAt: e.created_at })),
    });
  });

  r.get('/orders', requireAuth, (req, res) => {
    const me = req.user.id;
    const rows = db.prepare(`
      SELECT c.id, c.buyer_id, c.vendor_id, l.id AS listing_id, l.title, l.status AS listing_status, l.currency,
             (SELECT file FROM listing_images i WHERE i.listing_id = l.id ORDER BY i.id LIMIT 1) AS photo,
             o.id AS other_id, o.display_name AS other_name, o.short_name AS other_short, o.avatar AS other_avatar,
             (SELECT p.offer_price FROM messages a JOIN messages p ON p.id = a.reply_to
                WHERE a.conversation_id = c.id AND a.kind = 'accept' ORDER BY a.id DESC LIMIT 1) AS agreed_price,
             (SELECT MAX(a.created_at) FROM messages a WHERE a.conversation_id = c.id AND a.kind = 'accept') AS agreed_at,
             d.id AS deal_id, d.created_at AS deal_at
      FROM conversations c
      JOIN listings l ON l.id = c.listing_id
      JOIN users o ON o.id = CASE WHEN c.buyer_id = ? THEN c.vendor_id ELSE c.buyer_id END
      LEFT JOIN deals d ON d.conversation_id = c.id
      WHERE c.id IN (SELECT id FROM conversations WHERE buyer_id = ? UNION ALL SELECT id FROM conversations WHERE vendor_id = ?)
        AND (d.id IS NOT NULL OR EXISTS (SELECT 1 FROM messages a WHERE a.conversation_id = c.id AND a.kind = 'accept'))
      ORDER BY COALESCE(d.created_at, agreed_at) DESC
    `).all(me, me, me);
    const rated = db.prepare('SELECT 1 FROM ratings WHERE deal_id = ? AND rater_id = ?');
    const latestPlan = db.prepare(`SELECT * FROM installment_plans WHERE conversation_id = ? AND status IN ('active', 'completed') ORDER BY id DESC LIMIT 1`);
    const orders = rows.map((o) => {
      const plan = planView(db, latestPlan.get(o.id), me);
      let stage;
      if (plan?.status === 'active') stage = 'paying';
      else if (o.deal_id) stage = !rated.get(o.deal_id, me) && canStillRate(o.deal_at) ? 'rate' : 'done';
      else stage = o.listing_status === 'open' ? 'agreed' : 'ended';
      return {
        conversationId: o.id,
        myRole: o.buyer_id === me ? 'buyer' : 'seller',
        listing: { id: o.listing_id, title: o.title, status: o.listing_status, photoUrl: o.photo ? `/uploads/listings/${o.photo}` : null },
        other: { id: o.other_id, displayName: nameFor(o.other_name, o.other_short), avatarUrl: avatarUrl(o.other_avatar) },
        price: o.agreed_price, currency: o.currency,
        stage, at: o.deal_at || o.agreed_at,
        plan: plan && { status: plan.status, paid: plan.paid, total: plan.total, partsLeft: plan.parts.filter((p) => !p.confirmedAt).length },
      };
    });
    res.json({
      inProgress: orders.filter((o) => ['agreed', 'paying', 'rate'].includes(o.stage)),
      completed: orders.filter((o) => ['done', 'ended'].includes(o.stage)),
    });
  });

  return r;
}
