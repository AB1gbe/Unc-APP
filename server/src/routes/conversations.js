// Private messaging - with one hard rule:
//
//   EVERY CONVERSATION IS ABOUT ONE SPECIFIC LISTING.
//
// * The ONLY way to start a conversation is POST /api/listings/:id/contact.
//   There is no "message user X" endpoint at all.
// * Only a verified vendor who is NOT the listing owner can start one.
//   The buyer can't cold-message vendors; they reply inside conversations.
// * One conversation per (listing, vendor). Contacting twice returns the
//   existing conversation.
// * When the listing is fulfilled/closed the conversation becomes read-only.
import { Router } from 'express';
import { audit, tx } from '../db.js';
import { HttpError, notFound } from '../lib/http.js';
import * as v from '../lib/validate.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';

export function conversationRoutes(db) {
  const r = Router();

  const getConv = db.prepare(`
    SELECT c.*, l.title AS listing_title, l.status AS listing_status, l.city AS listing_city,
           l.budget_min, l.budget_max, l.currency,
           b.display_name AS buyer_name, b.account_type AS buyer_type,
           vu.display_name AS vendor_name, vu.account_type AS vendor_type, vu.kyc_status AS vendor_kyc
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users b ON b.id = c.buyer_id
    JOIN users vu ON vu.id = c.vendor_id
    WHERE c.id = ?
  `);

  function view(c, me) {
    const iAmBuyer = c.buyer_id === me.id;
    return {
      id: c.id,
      listing: {
        id: c.listing_id, title: c.listing_title, status: c.listing_status, city: c.listing_city,
        budgetMin: c.budget_min, budgetMax: c.budget_max, currency: c.currency,
      },
      myRole: iAmBuyer ? 'buyer' : 'vendor',
      other: iAmBuyer
        ? { id: c.vendor_id, displayName: c.vendor_name, accountType: c.vendor_type, verified: c.vendor_kyc === 'approved' }
        : { id: c.buyer_id, displayName: c.buyer_name, accountType: c.buyer_type, verified: true },
      readOnly: c.listing_status !== 'open',
      createdAt: c.created_at,
      lastMessageAt: c.last_message_at,
      lastMessage: c.last_body ?? undefined,
      unread: c.unread ?? undefined,
    };
  }

  function participantConv(req) {
    const c = getConv.get(Number(req.params.id));
    if (!c) throw notFound('Conversation not found.');
    if (c.buyer_id !== req.user.id && c.vendor_id !== req.user.id) {
      // 404 rather than 403 so outsiders can't probe which IDs exist.
      throw notFound('Conversation not found.');
    }
    return c;
  }

  function insertMessage(convId, senderId, body, offerPrice) {
    db.prepare('INSERT INTO messages (conversation_id, sender_id, body, offer_price) VALUES (?, ?, ?, ?)')
      .run(convId, senderId, body, offerPrice);
    db.prepare(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?`).run(convId);
  }

  // ---- Start a conversation ABOUT A LISTING (vendor -> buyer) ----
  r.post('/listings/:id/contact', requireVerified, (req, res) => {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
    if (!listing) throw notFound('Request not found.');
    if (listing.status !== 'open') throw new HttpError(409, 'This request is no longer accepting offers.');
    if (listing.buyer_id === req.user.id) throw new HttpError(403, 'You cannot make an offer on your own request.');

    const existing = db.prepare('SELECT id FROM conversations WHERE listing_id = ? AND vendor_id = ?').get(listing.id, req.user.id);
    if (existing) {
      throw new HttpError(409, 'You already contacted this buyer about this request.', { conversationId: existing.id });
    }

    const body = v.str(req.body, 'message', { min: 2, max: 2000 });
    const offerPrice = v.int(req.body, 'offerPrice', { optional: true });

    const convId = tx(db, () => {
      const info = db.prepare('INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (?, ?, ?)')
        .run(listing.id, listing.buyer_id, req.user.id);
      const id = Number(info.lastInsertRowid);
      insertMessage(id, req.user.id, body, offerPrice);
      audit(db, req.user.id, 'conversation.started', `conversation:${id}`, { listingId: listing.id });
      return id;
    });
    res.status(201).json({ conversation: view(getConv.get(convId), req.user) });
  });

  // ---- Inbox ----
  r.get('/conversations', requireAuth, (req, res) => {
    const rows = db.prepare(`
      SELECT c.*, l.title AS listing_title, l.status AS listing_status, l.city AS listing_city,
             l.budget_min, l.budget_max, l.currency,
             b.display_name AS buyer_name, b.account_type AS buyer_type,
             vu.display_name AS vendor_name, vu.account_type AS vendor_type, vu.kyc_status AS vendor_kyc,
             (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
             (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.read_at IS NULL) AS unread
      FROM conversations c
      JOIN listings l ON l.id = c.listing_id
      JOIN users b ON b.id = c.buyer_id
      JOIN users vu ON vu.id = c.vendor_id
      WHERE c.buyer_id = ? OR c.vendor_id = ?
      ORDER BY c.last_message_at DESC, c.id DESC
    `).all(req.user.id, req.user.id, req.user.id);
    res.json({ conversations: rows.map((c) => view(c, req.user)) });
  });

  r.get('/conversations/unread-count', requireAuth, (req, res) => {
    const { n } = db.prepare(`
      SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.buyer_id = ? OR c.vendor_id = ?) AND m.sender_id <> ? AND m.read_at IS NULL
    `).get(req.user.id, req.user.id, req.user.id);
    res.json({ unread: n });
  });

  // Conversations about one of MY listings (buyer view on the listing page).
  r.get('/listings/:id/conversations', requireAuth, (req, res) => {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
    if (!listing || listing.buyer_id !== req.user.id) throw notFound('Request not found.');
    const ids = db.prepare('SELECT id FROM conversations WHERE listing_id = ? ORDER BY last_message_at DESC').all(listing.id);
    res.json({ conversations: ids.map(({ id }) => view(getConv.get(id), req.user)) });
  });

  r.get('/conversations/:id', requireAuth, (req, res) => {
    const c = participantConv(req);
    const after = Number.parseInt(req.query.after, 10) || 0; // for polling: only newer messages
    const messages = db.prepare(`
      SELECT id, sender_id, body, offer_price, created_at, read_at FROM messages
      WHERE conversation_id = ? AND id > ? ORDER BY id
    `).all(c.id, after);
    // Opening the conversation marks the other side's messages as read.
    db.prepare(`
      UPDATE messages SET read_at = datetime('now')
      WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL
    `).run(c.id, req.user.id);
    res.json({
      conversation: view(c, req.user),
      messages: messages.map((m) => ({
        id: m.id, mine: m.sender_id === req.user.id, body: m.body, offerPrice: m.offer_price,
        createdAt: m.created_at, readAt: m.read_at,
      })),
    });
  });

  r.post('/conversations/:id/messages', requireVerified, (req, res) => {
    const c = participantConv(req);
    if (c.listing_status !== 'open') {
      throw new HttpError(409, 'This request is closed, so the conversation is read-only.');
    }
    const body = v.str(req.body, 'message', { min: 1, max: 2000 });
    // Only the vendor can attach a price offer.
    const offerPrice = c.vendor_id === req.user.id ? v.int(req.body, 'offerPrice', { optional: true }) : null;
    insertMessage(c.id, req.user.id, body, offerPrice);
    const m = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
    res.status(201).json({
      message: { id: m.id, mine: true, body: m.body, offerPrice: m.offer_price, createdAt: m.created_at, readAt: null },
    });
  });

  // ---- Reporting (safety) ----
  r.post('/reports', requireAuth, (req, res) => {
    const reason = v.str(req.body, 'reason', { min: 5, max: 1000 });
    const listingId = v.int(req.body, 'listingId', { optional: true });
    const conversationId = v.int(req.body, 'conversationId', { optional: true });
    if (!listingId && !conversationId) throw new HttpError(400, 'Say what you are reporting.');
    if (conversationId) {
      req.params.id = conversationId;
      participantConv(req); // you can only report conversations you are in
    }
    if (listingId && !db.prepare('SELECT 1 FROM listings WHERE id = ?').get(listingId)) throw notFound('Request not found.');
    db.prepare('INSERT INTO reports (reporter_id, listing_id, conversation_id, reason) VALUES (?, ?, ?, ?)')
      .run(req.user.id, listingId, conversationId, reason);
    res.status(201).json({ ok: true });
  });

  return r;
}
