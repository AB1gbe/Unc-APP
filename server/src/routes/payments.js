// The member's payment card (session 40): add or replace it, see it.
import { Router } from 'express';
import { audit } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { paymentProvider } from '../lib/payments.js';

export const cardView = (c) => (c ? { brand: c.brand, last4: c.last4, expMonth: c.exp_month, expYear: c.exp_year, addedAt: c.created_at } : null);

export function paymentRoutes(db) {
  const r = Router();

  r.get('/card', requireAuth, (req, res) => {
    res.json({ card: cardView(db.prepare('SELECT * FROM payment_cards WHERE user_id = ?').get(req.user.id)), provider: config.paymentProvider });
  });

  // Body: { token } from the payment company's card form. Never a card number.
  r.post('/card', requireAuth, async (req, res) => {
    const card = await paymentProvider().verifyCard(req.body?.token);
    db.prepare(`
      INSERT INTO payment_cards (user_id, provider, provider_ref, brand, last4, exp_month, exp_year) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id) DO UPDATE SET provider = excluded.provider, provider_ref = excluded.provider_ref, brand = excluded.brand,
        last4 = excluded.last4, exp_month = excluded.exp_month, exp_year = excluded.exp_year, created_at = datetime('now')
    `).run(req.user.id, config.paymentProvider, card.providerRef, card.brand, card.last4, card.expMonth, card.expYear);
    db.prepare(`UPDATE users SET card_added_at = datetime('now') WHERE id = ?`).run(req.user.id);
    audit(db, req.user.id, 'card.added', `user:${req.user.id}`, { brand: card.brand, last4: card.last4 });
    res.status(201).json({ card: cardView(db.prepare('SELECT * FROM payment_cards WHERE user_id = ?').get(req.user.id)) });
  });

  return r;
}
