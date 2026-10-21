// Central place for every setting. Values come from environment variables
// so nothing secret is ever hard-coded. See docs/Setup/Environment Variables.md
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isProd && !process.env.SECRET_PEPPER) {
  throw new Error('SECRET_PEPPER must be set in production');
}

const dataDir = process.env.DATA_DIR || path.join(serverRoot, 'data');

export const config = {
  isProd,
  isTest,
  port: Number(process.env.PORT || 4000),
  dataDir,
  dbFile: process.env.DB_FILE || path.join(dataDir, 'unc.sqlite'),
  uploadDir: path.join(dataDir, 'uploads'),
  clientDist: path.resolve(serverRoot, '..', 'client', 'dist'),
  // Pepper is mixed into hashes of ID numbers so a leaked DB alone can't be
  // brute-forced back into ID numbers.
  pepper: process.env.SECRET_PEPPER || 'dev-only-pepper-change-me',
  sessionDays: 14,
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@unc.local').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  kycProvider: process.env.KYC_PROVIDER || 'manual',
  minAge: 18,
  maxUploadBytes: 5 * 1024 * 1024,
};
