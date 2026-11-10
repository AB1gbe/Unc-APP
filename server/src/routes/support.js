// Get Help (session 60): a member asks the Unc team a question inside the
// app (Siin sends people to WhatsApp instead). It's a conversation between
// a member and the team only: members never see each other's questions,
// and this is not a way for members to message each other.
//   member: GET /api/support, POST /api/support, POST /api/support/:id/messages, POST /api/support/:id/close
//   admin:  GET /api/support/admin, POST /api/support/admin/:id/reply, POST /api/support/admin/:id/close
import { Router } from 'express';
import { audit, tx } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { notify } from '../lib/notify.js';

export const SUPPORT_TOPICS = ['account', 'verification', 'offers', 'payments', 'safety', 'other'];
export const MAX_OPEN_TICKETS = 3;

export function supportRoutes(db) {
  const r = Router();
  const messagesOf = db.prepare('SELECT from_admin, body, created_at FROM support_messages WHERE ticket_id = ? ORDER BY id');
  const view = (t) => ({
    id: t.id, topic: t.topic, status: t.status, createdAt: t.created_at, updatedAt: t.updated_at,
    messages: messagesOf.all(t.id).map((m) => ({ fromTeam: m.from_admin === 1, body: m.body, createdAt: m.created_at })),
  });
  const addMessage = (ticketId, fromAdmin, body, status) => {
    db.prepare('INSERT INTO support_messages (ticket_id, from_admin, body) VALUES (?, ?, ?)').run(ticketId, fromAdmin ? 1 : 0, body);
    db.prepare(`UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, ticketId);
  };

  // ---- Admins (before /:id, so "admin" isn't read as a ticket id) ----
  r.get('/admin', requireAdmin, (req, res) => {
    const status = ['open', 'answered', 'closed'].includes(req.query.status) ? req.query.status : 'open';
    const rows = db.prepare(`
      SELECT t.*, u.display_name, u.email FROM support_tickets t JOIN users u ON u.id = t.user_id
      WHERE t.status = ? ORDER BY t.updated_at ASC LIMIT 100
    `).all(status);
    res.json({ tickets: rows.map((t) => ({ ...view(t), member: { id: t.user_id, displayName: t.display_name, email: t.email } })) });
  });

  r.post('/admin/:id/reply', requireAdmin, (req, res) => {
    const t = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(Number(req.params.id));
    if (!t) throw notFound();
    const body = v.str(req.body, 'message', { min: 2, max: 4000 });
    tx(db, () => {
      addMessage(t.id, true, body, 'answered');
      notify(db, t.user_id, 'support-reply');
      audit(db, req.user.id, 'support.replied', `support:${t.id}`);
    });
    res.json({ ticket: view(db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(t.id)) });
  });

  r.post('/admin/:id/close', requireAdmin, (req, res) => {
    const info = db.prepare(`UPDATE support_tickets SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(Number(req.params.id));
    if (!info.changes) throw notFound();
    audit(db, req.user.id, 'support.closed', `support:${req.params.id}`);
    res.json({ ok: true });
  });

  // ---- Members ----
  const mine = (req) => {
    const t = db.prepare('SELECT * FROM support_tickets WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
    if (!t) throw notFound('Question not found.');
    return t;
  };

  r.get('/', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 50').all(req.user.id);
    res.json({ tickets: rows.map(view) });
  });

  r.post('/', requireAuth, (req, res) => {
    const topic = v.oneOf(req.body, 'topic', SUPPORT_TOPICS);
    const body = v.str(req.body, 'message', { min: 10, max: 2000 });
    const open = db.prepare(`SELECT COUNT(*) AS n FROM support_tickets WHERE user_id = ? AND status <> 'closed'`).get(req.user.id).n;
    if (open >= MAX_OPEN_TICKETS) throw new HttpError(409, 'You already have 3 open questions. Please wait for an answer, or close one.');
    const id = tx(db, () => {
      const newId = Number(db.prepare('INSERT INTO support_tickets (user_id, topic) VALUES (?, ?)').run(req.user.id, topic).lastInsertRowid);
      addMessage(newId, false, body, 'open');
      return newId;
    });
    res.status(201).json({ ticket: view(db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(id)) });
  });

  r.post('/:id/messages', requireAuth, (req, res) => {
    const t = mine(req);
    if (t.status === 'closed') throw new HttpError(409, 'This question is closed. Please ask a new one.');
    addMessage(t.id, false, v.str(req.body, 'message', { min: 2, max: 2000 }), 'open');
    res.status(201).json({ ticket: view(db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(t.id)) });
  });

  r.post('/:id/close', requireAuth, (req, res) => {
    const t = mine(req);
    db.prepare(`UPDATE support_tickets SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(t.id);
    res.json({ ticket: view(db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(t.id)) });
  });

  return r;
}
