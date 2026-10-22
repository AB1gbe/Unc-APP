import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { config } from '../config.js';
import { audit, tx } from '../db.js';
import { pepperedHash } from '../lib/crypto.js';
import { HttpError } from '../lib/http.js';
import { KYC_DIR, memoryUpload, saveFiles } from '../lib/uploads.js';
import * as v from '../lib/validate.js';
import { requireAuth, publicMe } from '../middleware/auth.js';
import { getProvider, applyDecision } from '../kyc/index.js';

const FILE_FIELDS = [
  { name: 'docFront', maxCount: 1 },
  { name: 'docBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'businessDoc', maxCount: 1 },
];

// What the user themselves may see about their latest submission.
function ownView(sub) {
  if (!sub) return null;
  return {
    id: sub.id,
    status: sub.status,
    legalName: sub.legal_name,
    country: sub.country,
    idType: sub.id_type,
    idNumberLast4: sub.id_number_last4,
    businessName: sub.business_name,
    reviewNote: sub.review_note,
    submittedAt: sub.submitted_at,
    reviewedAt: sub.reviewed_at,
  };
}

export function kycRoutes(db) {
  const r = Router();
  const upload = memoryUpload(4);

  r.get('/', requireAuth, (req, res) => {
    const latest = db.prepare('SELECT * FROM kyc_submissions WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
    res.json({ kycStatus: req.user.kyc_status, submission: ownView(latest) });
  });

  r.post('/', requireAuth, upload.fields(FILE_FIELDS), async (req, res) => {
    const user = req.user;
    if (!user.email_verified_at) throw new HttpError(403, 'Verify your email before identity verification.', { code: 'EMAIL_UNVERIFIED' });
    if (user.kyc_status === 'pending') throw new HttpError(409, 'Your verification is already being reviewed.');
    if (user.kyc_status === 'approved') throw new HttpError(409, 'You are already verified.');

    const legalName = v.str(req.body, 'legalName', { min: 3, max: 120 });
    const dateOfBirth = v.isoDate(req.body, 'dateOfBirth');
    const country = v.str(req.body, 'country', { min: 2, max: 60 });
    const idType = v.oneOf(req.body, 'idType', ['passport', 'national_id', 'drivers_license']);
    const idNumber = v.str(req.body, 'idNumber', { min: 4, max: 40 }).replace(/[\s-]/g, '').toUpperCase();
    const isBusiness = user.account_type === 'business';
    const businessName = isBusiness ? v.str(req.body, 'businessName', { min: 2, max: 120 }) : null;
    const businessRegNumber = isBusiness ? v.str(req.body, 'businessRegNumber', { min: 2, max: 60 }) : null;

    if (v.ageOn(dateOfBirth) < config.minAge) {
      throw new HttpError(400, `You must be at least ${config.minAge} years old.`, { field: 'dateOfBirth' });
    }

    const files = req.files || {};
    const need = (field) => {
      const f = files[field]?.[0];
      if (!f) throw new HttpError(400, `Please upload ${field}.`, { field });
      return f;
    };
    const front = need('docFront');
    const selfie = need('selfie');
    // Passports have one photo page; other IDs need both sides.
    const back = idType === 'passport' ? files.docBack?.[0] : need('docBack');
    const bizDoc = isBusiness ? need('businessDoc') : null;

    // One real person = one account. The same ID number can't verify two
    // different accounts.
    const idHash = pepperedHash(`${country.toUpperCase()}|${idType}|${idNumber}`);
    const clash = db.prepare(`
      SELECT 1 FROM kyc_submissions WHERE id_number_hash = ? AND user_id <> ? AND status IN ('pending','approved')
    `).get(idHash, user.id);
    if (clash) throw new HttpError(409, 'This ID document is already linked to another account.');
    // A banned member who deleted their account can't come back (session 37).
    if (db.prepare('SELECT 1 FROM banned_id_hashes WHERE id_number_hash = ?').get(idHash)) {
      throw new HttpError(409, 'This ID document is already linked to another account.');
    }

    // Every file is checked before any is written, and they are deleted again
    // if saving the submission fails - no orphaned ID photos on disk.
    const saved = saveFiles(KYC_DIR(), [
      { file: front },
      back ? { file: back } : null,
      { file: selfie },
      bizDoc ? { file: bizDoc, allowPdf: true } : null,
    ]);
    const [frontName, backName, selfieName, bizName] = saved.names;

    const provider = getProvider();
    let subId;
    try {
      subId = tx(db, () => {
        // Atomic "only if not already pending/approved": two uploads sent at the
        // same time (two tabs, a retry on a slow phone) can't both get through,
        // because req.user was read before the slow upload finished.
        const claimed = db.prepare(`
          UPDATE users SET kyc_status = 'pending' WHERE id = ? AND kyc_status IN ('unverified', 'rejected')
        `).run(user.id);
        if (!claimed.changes) throw new HttpError(409, 'Your verification is already being reviewed.');
        const info = db.prepare(`
          INSERT INTO kyc_submissions
            (user_id, provider, legal_name, date_of_birth, country, id_type, id_number_last4, id_number_hash,
             business_name, business_reg_number, doc_front, doc_back, selfie, business_doc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(user.id, provider.name, legalName, dateOfBirth, country, idType, idNumber.slice(-4), idHash,
          businessName, businessRegNumber, frontName, backName, selfieName, bizName);
        audit(db, user.id, 'kyc.submitted', `kyc_submission:${info.lastInsertRowid}`);
        return Number(info.lastInsertRowid);
      });
    } catch (err) {
      saved.discard();
      throw err;
    }

    const result = await provider.start({ id: subId });
    if (result.status !== 'pending') applyDecision(db, subId, result.status, result.note);

    const sub = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(subId);
    const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    res.status(201).json({ user: publicMe(fresh), submission: ownView(sub) });
  });

  return r;
}

// Streams a private KYC file. Only used by admin routes.
export function sendKycFile(res, filename) {
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new HttpError(404, 'File not found');
  }
  const full = path.join(KYC_DIR(), filename);
  if (!fs.existsSync(full)) throw new HttpError(404, 'File not found');
  res.set('Cache-Control', 'no-store');
  res.sendFile(full);
}
