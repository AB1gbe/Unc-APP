import { config } from '../config.js';
import { audit, tx } from '../db.js';
import { manualProvider } from './providers/manual.js';

const PROVIDERS = { manual: manualProvider };

export function getProvider() {
  const p = PROVIDERS[config.kycProvider];
  if (!p) throw new Error(`Unknown KYC_PROVIDER "${config.kycProvider}"`);
  return p;
}

// The single place where a KYC decision is applied, whether it came from an
// admin clicking a button or from a provider webhook. Keeps the user's
// kyc_status and the submission in sync.
export function applyDecision(db, submissionId, decision, note, reviewerId = null) {
  return tx(db, () => {
    const sub = db.prepare('SELECT * FROM kyc_submissions WHERE id = ?').get(submissionId);
    if (!sub) throw new Error('submission not found');
    db.prepare(`
      UPDATE kyc_submissions SET status = ?, review_note = ?, reviewer_id = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(decision, note ?? null, reviewerId, submissionId);
    db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(decision, sub.user_id);
    audit(db, reviewerId, `kyc.${decision}`, `kyc_submission:${submissionId}`, { userId: sub.user_id, note });
    return sub;
  });
}
