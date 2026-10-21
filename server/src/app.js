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
import { AVATAR_DIR, LISTING_DIR } from './lib/uploads.js';
import { CATEGORIES, CURRENCIES } from './lib/categories.js';
import { loadUser } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { notificationRoutes } from './routes/notifications.js';
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
  app.use('/api', (_req, _res, next) => next(notFound('Unknown API route')));

  // Listing photos are public. KYC files are NOT served statically - only
  // through the admin route that checks permissions.
  // Photo names are random and never reused, so browsers may cache them for a year.
  app.use('/uploads/listings', express.static(LISTING_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));
  app.use('/uploads/avatars', express.static(AVATAR_DIR(), { fallthrough: false, immutable: true, maxAge: '365d' }));

  // In production the built React app is served by this same server.
  if (fs.existsSync(config.clientDist)) {
    // Files in /assets have a content hash in their name (index-Or0kLKB6.js),
    // so a changed file gets a new name: safe to cache "forever".
    app.use('/assets', express.static(path.join(config.clientDist, 'assets'), { immutable: true, maxAge: '365d' }));
    // Everything else (index.html) must be re-checked so new deploys show up.
    app.use(express.static(config.clientDist, { setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
