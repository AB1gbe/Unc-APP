// Builds the Express app. Kept separate from index.js (which calls listen)
// so tests can create an app with an in-memory database.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler, notFound } from './lib/http.js';
import { LISTING_DIR } from './lib/uploads.js';
import { CATEGORIES, CURRENCIES } from './lib/categories.js';
import { loadUser } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { kycRoutes } from './routes/kyc.js';
import { listingRoutes } from './routes/listings.js';
import { conversationRoutes } from './routes/conversations.js';
import { adminRoutes } from './routes/admin.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-origin' },
    contentSecurityPolicy: {
      // blob: is needed for the photo previews on the KYC form.
      directives: { 'img-src': ["'self'", 'data:', 'blob:'] },
    },
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(loadUser(db));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/meta', (_req, res) => res.json({ categories: CATEGORIES, currencies: CURRENCIES }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/kyc', kycRoutes(db));
  app.use('/api/listings', listingRoutes(db));
  app.use('/api', conversationRoutes(db));
  app.use('/api/admin', adminRoutes(db));
  app.use('/api', (_req, _res, next) => next(notFound('Unknown API route')));

  // Listing photos are public. KYC files are NOT served statically - only
  // through the admin route that checks permissions.
  app.use('/uploads/listings', express.static(LISTING_DIR(), { fallthrough: false }));

  // In production the built React app is served by this same server.
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
