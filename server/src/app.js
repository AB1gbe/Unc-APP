// Builds the Express app. Kept separate from index.js (which calls listen)
// so tests can create an app with an in-memory database.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler, notFound } from './lib/http.js';
import { AVATAR_DIR, COVER_DIR, LISTING_DIR, STORY_DIR } from './lib/uploads.js';
import { CATEGORIES, CURRENCIES } from './lib/categories.js';
import { loadUser } from './middleware/auth.js';
import { withPreview } from './lib/previews.js';
import { authRoutes } from './routes/auth.js';
import { notificationRoutes } from './routes/notifications.js';
import { storyRoutes } from './routes/stories.js';
import { feedRoutes } from './routes/feed.js';
import { pushRoutes } from './routes/push.js';
import { kycRoutes } from './routes/kyc.js';
import { listingRoutes } from './routes/listings.js';
import { conversationRoutes } from './routes/conversations.js';
import { adminRoutes } from './routes/admin.js';
import { ratingRoutes } from './routes/ratings.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-origin' },
    contentSecurityPolicy: {
      // blob: is needed for the photo previews on the KYC form.
      directives: { 'img-src': ["'self'", 'data:', 'blob:'] },
    },
  }));
  // gzip text responses (JSON, JS, CSS, HTML): the app's JS shrinks ~3x.
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(loadUser(db));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/meta', (_req, res) => res.json({ categories: CATEGORIES, currencies: CURRENCIES }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/kyc', kycRoutes(db));
  app.use('/api/listings', listingRoutes(db));
  app.use('/api', conversationRoutes(db));
  app.use('/api', ratingRoutes(db));
  app.use('/api/admin', adminRoutes(db));
  app.use('/api/notifications', notificationRoutes(db));
  app.use('/api/push', pushRoutes(db));
  app.use('/api', storyRoutes(db));
  app.use('/api/feed', feedRoutes(db));
  app.use('/api', (_req, _res, next) => next(notFound('Unknown API route')));

  // Listing photos are public. KYC files are NOT served statically - only
  // through the admin route that checks permissions.
  // Photo names are random and never reused, so browsers may cache them for a year.
  app.use('/uploads/listings', express.static(LISTING_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));
  app.use('/uploads/avatars', express.static(AVATAR_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));
  app.use('/uploads/stories', express.static(STORY_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));
  app.use('/uploads/covers', express.static(COVER_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));

  // In production the built React app is served by this same server.
  if (fs.existsSync(config.clientDist)) {
    // Files in /assets have a content hash in their name (index-Or0kLKB6.js),
    // so a changed file gets a new name: safe to cache "forever".
    app.use('/assets', express.static(path.join(config.clientDist, 'assets'), { immutable: true, maxAge: '365d' }));
    // Everything else (index.html) must be re-checked so new deploys show up.
    // index: false -> "/" also goes through the page handler below.
    app.use(express.static(config.clientDist, { index: false, setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));
    // Every page is index.html with link-preview tags for WhatsApp & co.
    // (lib/previews.js). A request page gets its own title, price and photo,
    // but only while it is open and its buyer isn't banned.
    const findPreview = db.prepare(`
      SELECT l.*, u.language AS buyer_language,
             (SELECT file FROM listing_images i WHERE i.listing_id = l.id ORDER BY i.id LIMIT 1) AS first_image
      FROM listings l JOIN users u ON u.id = l.buyer_id
      WHERE l.id = ? AND l.status = 'open' AND u.banned_at IS NULL
    `);
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
      const id = req.path.match(/^\/requests\/(\d+)\/?$/)?.[1];
      const listing = id ? findPreview.get(Number(id)) : null;
      const html = fs.readFileSync(path.join(config.clientDist, 'index.html'), 'utf8');
      res.set('Cache-Control', 'no-cache');
      res.type('html').send(withPreview(html, listing ?? null, req.path));
    });
  }

  app.use(errorHandler);
  return app;
}
