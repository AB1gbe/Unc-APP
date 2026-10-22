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
import { canStillRate, ratingQueries } from '../lib/ratings.js';
import fs from 'node:fs';
import path from 'node:path';
import { CHAT_DIR, avatarUrl, memoryUpload, saveFiles } from '../lib/uploads.js';
import { notify } from '../lib/notify.js';
import { pushTo } from '../lib/push.js';
import { trySendMail } from '../lib/mailer.js';
import { newOfferEmail } from '../lib/emails.js';
import { activityQueries } from '../lib/activity.js';
import { badgeQueries } from '../lib/badges.js';

export function conversationRoutes(db) {
  const r = Router();

  const getConv = db.prepare(`
    SELECT c.*, l.title AS listing_title, l.status AS listing_status, l.city AS listing_city,
           l.budget_min, l.budget_max, l.currency,
           b.display_name AS buyer_name, b.account_type AS buyer_type, b.avatar AS buyer_avatar,
           vu.display_name AS vendor_name, vu.account_type AS vendor_type, vu.kyc_status AS vendor_kyc, vu.avatar AS vendor_avatar,
           b.banned_at AS buyer_banned_at, vu.banned_at AS vendor_banned_at
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users b ON b.id = c.buyer_id
    JOIN users vu ON vu.id = c.vendor_id
    WHERE c.id = ?
  `);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) AS n FROM messages m
    WHERE m.read_at IS NULL AND m.sender_id <> ?
      AND m.conversation_id IN (
        SELECT id FROM conversations WHERE buyer_id = ?
        UNION ALL
        SELECT id FROM conversations WHERE vendor_id = ?
      )
  `);

  const hasUnread = db.prepare(`
    SELECT 1 FROM messages WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL LIMIT 1
  `);
  const markRead = db.prepare(`
    UPDATE messages SET read_at = datetime('now')
    WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL
  `);

  const ratings = ratingQueries(db);
  const activity = activityQueries(db);
  const badgesFor = badgeQueries(db, ratings, activity);
  const storyBy = db.prepare('SELECT 1 FROM stories WHERE deal_id = ? AND author_id = ?');
  const dealForConv = db.prepare('SELECT * FROM deals WHERE conversation_id = ?');
  const ratingBy = db.prepare('SELECT stars, comment, created_at FROM ratings WHERE deal_id = ? AND rater_id = ?');

  // Deal + rating state of a conversation, from my point of view.
  function dealView(convId, meId) {
    const d = dealForConv.get(convId);
    if (!d) return null;
    const otherId = d.buyer_id === meId ? d.vendor_id : d.buyer_id;
    const mine = ratingBy.get(d.id, meId);
    const theirs = ratingBy.get(d.id, otherId);
    return {
      id: d.id,
      createdAt: d.created_at,
      myRating: mine ? { stars: mine.stars, comment: mine.comment, createdAt: mine.created_at } : null,
      otherHasRated: Boolean(theirs),
      // Blind: I only see their rating of me once I've rated too.
      theirRating: mine && theirs ? { stars: theirs.stars, comment: theirs.comment } : null,
      canRate: !mine && canStillRate(d.created_at),
      myStory: Boolean(storyBy.get(d.id, meId)),
    };
  }

  function view(c, me) {
    const iAmBuyer = c.buyer_id === me.id;
    const deal = dealView(c.id, me.id);
    const other = iAmBuyer
      ? { id: c.vendor_id, displayName: c.vendor_name, accountType: c.vendor_type, verified: c.vendor_kyc === 'approved', avatarUrl: avatarUrl(c.vendor_avatar) }
      : { id: c.buyer_id, displayName: c.buyer_name, accountType: c.buyer_type, verified: true, avatarUrl: avatarUrl(c.buyer_avatar) };
    other.rating = ratings.summaryFor(other.id);
    return {
      id: c.id,
      listing: {
        id: c.listing_id, title: c.listing_title, status: c.listing_status, city: c.listing_city,
        budgetMin: c.budget_min, budgetMax: c.budget_max, currency: c.currency,
      },
      myRole: iAmBuyer ? 'buyer' : 'vendor',
      other,
      deal,
      needsRating: Boolean(deal?.canRate),
      readOnly: c.listing_status !== 'open',
      createdAt: c.created_at,
      lastMessageAt: c.last_message_at,
      lastMessage: c.last_body ?? undefined,
      lastKind: c.last_kind ?? undefined,
      lastPrice: c.last_price ?? undefined,
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

  function insertMessage(convId, senderId, body, offerPrice, image = null, kind = null, replyTo = null) {
    db.prepare('INSERT INTO messages (conversation_id, sender_id, body, offer_price, image, kind, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(convId, senderId, body, offerPrice, image, kind, replyTo);
    db.prepare(`UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?`).run(convId);
  }

  // One optional photo per message (multipart field "image"). JSON requests
  // pass straight through multer untouched.
  const chatUpload = memoryUpload(1);
  const messageView = (m, convId, meId) => ({
    id: m.id, mine: m.sender_id === meId, body: m.body, offerPrice: m.offer_price,
    imageUrl: m.image ? `/api/conversations/${convId}/images/${m.image}` : null,
    kind: m.kind ?? null, replyTo: m.reply_to ?? null,
    createdAt: m.created_at, readAt: m.read_at,
  });

  // ---- Start a conversation ABOUT A LISTING (vendor -> buyer) ----
  r.post('/listings/:id/contact', requireVerified, chatUpload.single('image'), (req, res) => {
    const listing = db.prepare(`
      SELECT l.*, u.banned_at AS buyer_banned_at FROM listings l JOIN users u ON u.id = l.buyer_id WHERE l.id = ?
    `).get(Number(req.params.id));
    if (!listing || listing.buyer_banned_at) throw notFound('Request not found.');
    if (listing.status !== 'open') throw new HttpError(409, 'This request is no longer accepting offers.');
    if (listing.buyer_id === req.user.id) throw new HttpError(403, 'You cannot make an offer on your own request.');

    const existing = db.prepare('SELECT id FROM conversations WHERE listing_id = ? AND vendor_id = ?').get(listing.id, req.user.id);
    if (existing) {
      throw new HttpError(409, 'You already contacted this buyer about this request.', { conversationId: existing.id });
    }

    const body = v.str(req.body, 'message', { min: 2, max: 2000 });
    const offerPrice = v.int(req.body, 'offerPrice', { optional: true });

    const photo = req.file ? saveFiles(CHAT_DIR(), [{ file: req.file }]) : null;
    let convId;
    try {
      convId = tx(db, () => {
        const info = db.prepare('INSERT INTO conversations (listing_id, buyer_id, vendor_id) VALUES (?, ?, ?)')
          .run(listing.id, listing.buyer_id, req.user.id);
        const id = Number(info.lastInsertRowid);
        insertMessage(id, req.user.id, body, offerPrice, photo?.names[0] ?? null);
        audit(db, req.user.id, 'conversation.started', `conversation:${id}`, { listingId: listing.id });
        notify(db, listing.buyer_id, 'offer', { actorId: req.user.id, listingId: listing.id, conversationId: id });
        return id;
      });
    } catch (err) {
      photo?.discard();
      throw err;
    }
    // After the transaction, so a push never announces an offer that was rolled back.
    pushTo(db, listing.buyer_id, 'offer', { actor: req.user.display_name, title: listing.title }, `/messages/${convId}`)
      .catch((err) => console.warn('[push]', err.message));
    // And an email, unless the buyer switched those off. trySendMail never
    // throws, and the offer doesn't wait for the email provider.
    const buyer = db.prepare('SELECT email, language, email_offers FROM users WHERE id = ?').get(listing.buyer_id);
    if (buyer.email_offers) {
      trySendMail({ to: buyer.email, ...newOfferEmail({
        sellerName: req.user.display_name, title: listing.title, message: body,
        offerPrice, currency: listing.currency, conversationId: convId,
      }, buyer.language) });
    }
    res.status(201).json({ conversation: view(getConv.get(convId), req.user) });
  });

  // ---- Inbox ----
  r.get('/conversations', requireAuth, (req, res) => {
    const rows = db.prepare(`
      SELECT c.*, l.title AS listing_title, l.status AS listing_status, l.city AS listing_city,
             l.budget_min, l.budget_max, l.currency,
             b.display_name AS buyer_name, b.account_type AS buyer_type, b.avatar AS buyer_avatar,
             vu.display_name AS vendor_name, vu.account_type AS vendor_type, vu.kyc_status AS vendor_kyc, vu.avatar AS vendor_avatar,
             (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
             (SELECT kind FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_kind,
             (SELECT offer_price FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_price,
             (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> ? AND m.read_at IS NULL) AS unread
      FROM conversations c
      JOIN listings l ON l.id = c.listing_id
      JOIN users b ON b.id = c.buyer_id
      JOIN users vu ON vu.id = c.vendor_id
      WHERE c.id IN (SELECT id FROM conversations WHERE buyer_id = ? UNION ALL SELECT id FROM conversations WHERE vendor_id = ?)
      ORDER BY c.last_message_at DESC, c.id DESC
    `).all(req.user.id, req.user.id, req.user.id);
    res.json({ conversations: rows.map((c) => view(c, req.user)) });
  });

  r.get('/conversations/unread-count', requireAuth, (req, res) => {
    // Written as two index lookups (my conversations as buyer + as vendor)
    // feeding the small "unread messages" index, instead of an OR that
    // forces SQLite to read every message.
    const { n } = unreadCount.get(req.user.id, req.user.id, req.user.id);
    res.json({ unread: n });
  });

  // "Compare offers" (session 31): what the buyer needs to choose between
  // sellers, per conversation. Only ever sent to the request's buyer.
  const latestSellerPrice = db.prepare(`
    SELECT m.offer_price FROM messages m JOIN conversations c ON c.id = m.conversation_id
    WHERE m.conversation_id = ? AND m.sender_id = c.vendor_id AND m.offer_price IS NOT NULL ORDER BY m.id DESC LIMIT 1
  `);
  const agreedPrice = db.prepare(`
    SELECT p.offer_price FROM messages a JOIN messages p ON p.id = a.reply_to
    WHERE a.conversation_id = ? AND a.kind = 'accept' ORDER BY a.id DESC LIMIT 1
  `);
  const sellerFirst = db.prepare(`
    SELECT m.body, (SELECT image FROM messages i WHERE i.conversation_id = m.conversation_id AND i.sender_id = m.sender_id AND i.image IS NOT NULL ORDER BY i.id LIMIT 1) AS image
    FROM messages m JOIN conversations c ON c.id = m.conversation_id
    WHERE m.conversation_id = ? AND m.sender_id = c.vendor_id ORDER BY m.id LIMIT 1
  `);
  const unreadIn = db.prepare('SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE m.conversation_id = ? AND m.sender_id = c.vendor_id AND m.read_at IS NULL');
  function compareFor(convId) {
    const c = getConv.get(convId);
    const first = sellerFirst.get(convId);
    const replyTime = activity.replyTime(c.vendor_id);
    return {
      price: latestSellerPrice.get(convId)?.offer_price ?? null,
      agreedPrice: agreedPrice.get(convId)?.offer_price ?? null,
      firstMessage: first?.body ? first.body.slice(0, 140) : null,
      photoUrl: first?.image ? `/api/conversations/${convId}/images/${first.image}` : null,
      replyTime,
      badges: badgesFor(c.vendor_id, replyTime),
      unread: unreadIn.get(convId).n,
    };
  }

  // Conversations about one of MY listings (buyer view on the listing page).
  r.get('/listings/:id/conversations', requireAuth, (req, res) => {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
    if (!listing || listing.buyer_id !== req.user.id) throw notFound('Request not found.');
    const ids = db.prepare('SELECT id FROM conversations WHERE listing_id = ? ORDER BY last_message_at DESC').all(listing.id);
    res.json({ conversations: ids.map(({ id }) => ({ ...view(getConv.get(id), req.user), compare: compareFor(id) })) });
  });

  r.get('/conversations/:id', requireAuth, (req, res) => {
    const c = participantConv(req);
    const after = Number.parseInt(req.query.after, 10) || 0; // for polling: only newer messages
    const messages = db.prepare(`
      SELECT id, sender_id, body, offer_price, image, kind, reply_to, created_at, read_at FROM messages
      WHERE conversation_id = ? AND id > ? ORDER BY id
    `).all(c.id, after);
    // Opening the conversation marks the other side's messages as read.
    // Check first (cheap, uses the small unread index) so the 4-second polls
    // don't start a database write when there is nothing to mark.
    if (hasUnread.get(c.id, req.user.id)) {
      markRead.run(c.id, req.user.id);
    }
    res.json({
      conversation: (() => {
        const otherId = c.buyer_id === req.user.id ? c.vendor_id : c.buyer_id;
        const otherActivity = activity.summaryFor(otherId);
        const otherFavourite = Boolean(db.prepare('SELECT 1 FROM favourites WHERE user_id = ? AND seller_id = ?').get(req.user.id, otherId));
        return { ...view(c, req.user), otherActivity, otherBadges: badgesFor(otherId, otherActivity.replyTime), otherFavourite };
      })(),
      messages: messages.map((m) => messageView(m, c.id, req.user.id)),
    });
  });

  r.post('/conversations/:id/messages', requireVerified, chatUpload.single('image'), (req, res) => {
    const c = participantConv(req);
    if (c.listing_status !== 'open') {
      throw new HttpError(409, 'This request is closed, so the conversation is read-only.');
    }
    const otherBanned = c.buyer_id === req.user.id ? c.vendor_banned_at : c.buyer_banned_at;
    if (otherBanned) throw new HttpError(409, 'This member\'s account has been suspended, so you can\'t message them.');
    // Either side can put a price on a message: the seller's offer, or the
    // buyer's counter-offer (session 20). Text is optional with a photo or a price.
    const offerPrice = v.int(req.body, 'offerPrice', { optional: true });
    const body = v.str(req.body, 'message', { min: 1, max: 2000, optional: Boolean(req.file) || offerPrice != null }) ?? '';
    const photo = req.file ? saveFiles(CHAT_DIR(), [{ file: req.file }]) : null;
    try {
      insertMessage(c.id, req.user.id, body, offerPrice, photo?.names[0] ?? null);
    } catch (err) {
      photo?.discard();
      throw err;
    }
    const m = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
    res.status(201).json({ message: messageView(m, c.id, req.user.id) });
  });

  // Answer the other side's price with one tap: accept or decline
  // (session 20). Only the newest price in the chat can be answered, once;
  // a counter-offer is just a new message with a price.
  r.post('/conversations/:id/messages/:messageId/respond', requireVerified, (req, res) => {
    const c = participantConv(req);
    if (c.listing_status !== 'open') throw new HttpError(409, 'This request is closed, so the conversation is read-only.');
    const otherBanned = c.buyer_id === req.user.id ? c.vendor_banned_at : c.buyer_banned_at;
    if (otherBanned) throw new HttpError(409, 'This member\'s account has been suspended, so you can\'t message them.');
    const action = v.oneOf(req.body, 'action', ['accept', 'decline']);
    const target = db.prepare('SELECT * FROM messages WHERE id = ? AND conversation_id = ?').get(Number(req.params.messageId), c.id);
    if (!target) throw notFound('Message not found.');
    if (target.offer_price == null) throw new HttpError(400, 'That message has no price to answer.');
    if (target.sender_id === req.user.id) throw new HttpError(400, "You can't answer your own price.");
    const newest = db.prepare('SELECT MAX(id) AS id FROM messages WHERE conversation_id = ? AND offer_price IS NOT NULL').get(c.id).id;
    if (newest !== target.id) throw new HttpError(409, 'A newer price has been offered since. Answer that one instead.');
    if (db.prepare('SELECT 1 FROM messages WHERE reply_to = ?').get(target.id)) throw new HttpError(409, 'This price has already been answered.');
    insertMessage(c.id, req.user.id, '', null, null, action, target.id);
    const m = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(c.id);
    audit(db, req.user.id, `offer.${action}`, `conversation:${c.id}`, { messageId: target.id, price: target.offer_price });
    res.status(201).json({ message: messageView(m, c.id, req.user.id) });
  });

  // Chat photos: only for the two people in the conversation, and only
  // files that really belong to a message in THIS conversation.
  r.get('/conversations/:id/images/:file', requireAuth, (req, res) => {
    const c = participantConv(req);
    const owned = db.prepare('SELECT 1 FROM messages WHERE conversation_id = ? AND image = ?').get(c.id, req.params.file);
    const full = path.join(CHAT_DIR(), path.basename(req.params.file));
    if (!owned || !fs.existsSync(full)) throw notFound('File not found');
    res.set('Cache-Control', 'private, max-age=31536000, immutable');
    res.sendFile(full);
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
