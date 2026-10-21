---
tags: [build-guide, social]
step: 28
---
# Step 28: "Found it" stories and earned badges (session 20)

**What/why:** [[Social Touches]], [[ADR-028 Stories and badges]].

1. Migration 14:
   ```sql
   CREATE TABLE stories (id INTEGER PRIMARY KEY AUTOINCREMENT,
     deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
     author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     body TEXT NOT NULL, image TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
     hidden_at TEXT, UNIQUE (deal_id, author_id));
   ```
2. `server/src/lib/uploads.js`: `STORY_DIR()` (public). `app.js` serves `/uploads/stories` like the request photos.
3. `server/src/routes/stories.js`, mounted with `app.use('/api', storyRoutes(db))`:
   - `GET /stories`: the newest 12, leaving out hidden stories and banned members;
   - `POST /deals/:id/story`: only people in the deal, once each; text 5–280 characters; optional `image`;
   - `DELETE /stories/:id`: the author only; the photo file is deleted too;
   - `POST /admin/stories/:id/hide`: audited.
   - `storiesAbout(db, userId)` feeds the profile.
4. `server/src/lib/badges.js`: `badgeQueries(db, ratings, activity)` returns `badgesFor(userId, replyTime?)`, with the rules in [[Social Touches#5. "Found it" stories and earned badges]].
   - It is used in `routes/ratings.js` (`member.badges`, `stories`), `routes/conversations.js` (`otherBadges`, and `deal.myStory`) and `routes/listings.js` (`buyer.badges`).
5. `server/src/seed.js`: the demo deal gets a story.
6. Client:
   - `components/Stories.jsx`: `StoryCard` (with a Hide button for admins), `StoriesStrip` and `StoryForm`.
   - The `StoryForm` sits in the deal banner after you have rated.
   - The strip goes on Home and on the landing page for visitors; stories also show on the profile.
   - `Badges` in `ui.jsx` is shown on profiles, in the chat head and on the request page.
7. CSS: `.story` and `.story-photo`. The photo uses `max-width: none` and margins that match the card's 1.25 rem padding ([[Mistakes and Fixes#M71]]).
8. Tests:
   - `server/test/stories-badges.test.js`;
   - `e2e/smoke.mjs` shares a story with a photo, then sees it and the badges on the profile and on Home.
