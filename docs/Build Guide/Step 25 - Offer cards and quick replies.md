---
tags: [build-guide, messaging]
step: 25
---
# Step 25: Offer cards and quick replies (session 20)

**What/why:** [[Social Touches]], [[ADR-025 Offer answers in the chat]].

1. Migration 12 (add it to the end of `MIGRATIONS` in `server/src/db.js`):
   ```sql
   ALTER TABLE messages ADD COLUMN kind TEXT CHECK (kind IN ('accept', 'decline'));
   ALTER TABLE messages ADD COLUMN reply_to INTEGER REFERENCES messages(id) ON DELETE CASCADE;
   CREATE INDEX idx_messages_reply ON messages(reply_to) WHERE reply_to IS NOT NULL;
   ```
2. `server/src/routes/conversations.js`:
   - `insertMessage(..., kind, replyTo)`; `messageView` adds `kind` and `replyTo`.
   - Sending a message: `offerPrice` is now allowed from **either** side, and the text is optional when there's a price or a photo.
   - `POST /conversations/:id/messages/:messageId/respond { action: 'accept' | 'decline' }`:
     - the request must be open, and the other member not banned;
     - the target must have a price and not be your own;
     - it must be the newest price, and not answered yet (409 otherwise);
     - insert a message with `body ''`, `kind` and `reply_to`; audit `offer.accept` / `offer.decline`.
   - Inbox query: also `last_kind` and `last_price`.
3. `server/src/lib/i18n.js`: Arabic for the 5 new messages.
4. `client/src/pages/Conversation.jsx`:
   - work out `newestPriceId` and the `answers` map;
   - `OfferCard` (Accept / Counter / Not for me; Counter posts `{ offerPrice }`);
   - `AnswerLine`;
   - `QuickReplies`, which fill the textarea and focus it (`textRef`).
5. `client/src/pages/Inbox.jsx`: preview "🤝 Offer accepted", "Offer declined" or "💰 $350".
6. CSS: `.offer-card`, `.offer-actions`, `.answer-line`, `.quick-replies`.
7. Tests:
   - `server/test/offer-responses.test.js`;
   - `e2e/smoke.mjs`: a quick-reply chip; the buyer counters $350 and the seller accepts.
