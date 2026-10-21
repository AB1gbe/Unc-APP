// Side-by-side review of one KYC submission: compare the ID photo with the
// selfie and the typed details, then approve or reject with a reason.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, toDate } from '../../api.js';
import { ErrorBox, Loading } from '../../components/ui.jsx';
import { useApi } from '../../hooks.js';

const ID_LABELS = { passport: 'Passport', national_id: 'National ID', drivers_license: "Driver's license" };

const REJECT_REASONS = [
  'Photo is blurry or unreadable',
  'Selfie does not match the ID photo',
  'Name or date of birth does not match the ID',
  'ID document is expired',
  'Part of the document is cut off',
  'Business document missing or invalid',
];

export default function KycReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useApi(`/admin/kyc/${id}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const k = data.submission;

  async function decide(decision) {
    if (decision === 'rejected' && !note.trim()) {
      setActionError(new Error('Please give the user a reason so they can fix it.'));
      return;
    }
    setBusy(true);
    try {
      await api(`/admin/kyc/${k.id}/decision`, { method: 'POST', body: { decision, note: note || undefined } });
      navigate('/admin');
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  const age = Math.floor((Date.now() - toDate(k.date_of_birth).getTime()) / (365.25 * 864e5));

  return (
    <div className="stack">
      <p className="small"><Link to="/admin">← Back to queue</Link></p>
      <div className="two-col">
        <section className="card">
          <h1>{k.legal_name}</h1>
          <table>
            <tbody>
              <tr><th>Account</th><td>{k.display_name} · {k.email} · {k.account_type}</td></tr>
              <tr><th>Date of birth</th><td>{k.date_of_birth} (age {age})</td></tr>
              <tr><th>ID</th><td>{ID_LABELS[k.id_type]} issued by {k.country}, number ending <b>{k.id_number_last4}</b></td></tr>
              {k.business_name && <tr><th>Business</th><td>{k.business_name} · reg. {k.business_reg_number}</td></tr>}
              <tr><th>Submitted</th><td>{toDate(k.submitted_at).toLocaleString()}</td></tr>
              <tr><th>Status</th><td>{k.status}{k.review_note && ` — ${k.review_note}`}</td></tr>
            </tbody>
          </table>
          <h2 style={{ marginTop: '1rem' }}>Documents</h2>
          <div className="doc-grid">
            {[['docFront', 'ID front'], ['docBack', 'ID back'], ['selfie', 'Selfie'], ['businessDoc', 'Business document']].map(([f, label]) => k.files[f] && (
              <figure key={f}>
                <figcaption className="small muted">{label}</figcaption>
                <a href={k.files[f]} target="_blank" rel="noreferrer">
                  {/* PDFs can't render in <img>; show a link instead. */}
                  <img src={k.files[f]} alt={label} onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: 'Open file ↗' })); }} />
                </a>
              </figure>
            ))}
          </div>
        </section>
        <aside className="stack">
          {k.status === 'pending' ? (
            <div className="card">
              <h2>Decision</h2>
              <p className="small muted">Check: the selfie matches the ID photo, the name and date of birth match, the document is not expired, and nothing looks edited.</p>
              <ErrorBox error={actionError} />
              <div className="field">
                <label htmlFor="note">Note to user (required to reject)</label>
                <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="row" style={{ gap: '.3rem', marginTop: '.4rem' }}>
                  {REJECT_REASONS.map((r) => <button type="button" key={r} className="badge grey" style={{ border: 0, cursor: 'pointer' }} onClick={() => setNote(r)}>{r}</button>)}
                </div>
              </div>
              <div className="stack">
                <button className="btn ok block" disabled={busy} onClick={() => decide('approved')}>Approve</button>
                <button className="btn danger block" disabled={busy} onClick={() => decide('rejected')}>Reject</button>
              </div>
            </div>
          ) : <div className="card"><p>This submission was already {k.status}.</p></div>}
          {data.history.length > 0 && (
            <div className="card">
              <h2>Earlier attempts</h2>
              {data.history.map((h) => <p key={h.id} className="small">{toDate(h.submitted_at).toLocaleDateString()} — {h.status}{h.review_note && `: ${h.review_note}`}</p>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
