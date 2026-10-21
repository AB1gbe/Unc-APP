// Side-by-side review of one KYC submission: compare the ID photo with the
// selfie and the typed details, then approve or reject with a reason.
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, toDate } from '../../api.js';
import { ErrorBox, Loading } from '../../components/ui.jsx';
import { useApi } from '../../hooks.js';
import { ACCOUNT_TYPE, ID_TYPE, KYC_STATUS, REJECT_REASONS, label, reasonText } from '../../kycReasons.js';
import { formatDate, formatDateTime, t, tj } from '../../i18n.jsx';

// Quick rejection reasons and English->label maps live in kycReasons.js.

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
      setActionError(new Error(t('Please give the user a reason so they can fix it.')));
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
      <p className="small"><Link to="/admin"><span className="flip">←</span> {t('Back to queue')}</Link></p>
      <div className="two-col">
        <section className="card">
          <h1>{k.legal_name}</h1>
          <table>
            <tbody>
              <tr><th>{t('Account')}</th><td><bdi>{k.display_name}</bdi> · <span className="ltr">{k.email}</span> · {label(ACCOUNT_TYPE, k.account_type)}</td></tr>
              <tr><th>{t('Date of birth')}</th><td><span className="ltr">{k.date_of_birth}</span> ({t('age {age}', { age })})</td></tr>
              <tr><th>{t('ID')}</th><td>{tj('{type} issued by {country}, number ending {last4}', { type: label(ID_TYPE, k.id_type), country: <bdi>{k.country}</bdi>, last4: <b className="ltr">{k.id_number_last4}</b> })}</td></tr>
              {k.business_name && <tr><th>{t('Business')}</th><td>{tj('{name} · reg. {number}', { name: <bdi>{k.business_name}</bdi>, number: <bdi>{k.business_reg_number}</bdi> })}</td></tr>}
              <tr><th>{t('Submitted')}</th><td>{formatDateTime(toDate(k.submitted_at))}</td></tr>
              <tr><th>{t('Status')}</th><td>{label(KYC_STATUS, k.status)}{k.review_note && <> — <bdi>{reasonText(k.review_note)}</bdi></>}</td></tr>
            </tbody>
          </table>
          <h2 style={{ marginTop: '1rem' }}>{t('Documents')}</h2>
          <div className="doc-grid">
            {[['docFront', t('Front of ID')], ['docBack', t('Back of ID')], ['selfie', t('Selfie')], ['businessDoc', t('Business registration document')]].map(([f, label]) => k.files[f] && (
              <figure key={f}>
                <figcaption className="small muted">{label}</figcaption>
                <a href={k.files[f]} target="_blank" rel="noreferrer">
                  {/* PDFs can't render in <img>; show a link instead. */}
                  <img src={k.files[f]} alt={label} onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: t('Open file ↗') })); }} />
                </a>
              </figure>
            ))}
          </div>
        </section>
        <aside className="stack">
          {k.status === 'pending' ? (
            <div className="card">
              <h2>{t('Decision')}</h2>
              <p className="small muted">{t('Check: the selfie matches the ID photo, the name and date of birth match, the document is not expired, and nothing looks edited.')}</p>
              <ErrorBox error={actionError} />
              <div className="field">
                <label htmlFor="note">{t('Note to user (required to reject)')}</label>
                <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="row" style={{ gap: '.3rem', marginTop: '.4rem' }}>
                  {/* The button shows the reason in the admin's language but saves the
                      English wording, so each member sees it in THEIR language. */}
                  {Object.entries(REJECT_REASONS).map(([english, shown]) => <button type="button" key={english} className="badge grey" style={{ border: 0, cursor: 'pointer' }} onClick={() => setNote(english)}>{shown()}</button>)}
                </div>
                <div className="hint">{t('Quick reasons are saved in English and shown to each member in their own language.')}</div>
              </div>
              <div className="stack">
                <button className="btn ok block" disabled={busy} onClick={() => decide('approved')}>{t('Approve')}</button>
                <button className="btn danger block" disabled={busy} onClick={() => decide('rejected')}>{t('Reject')}</button>
              </div>
            </div>
          ) : <div className="card"><p>{t('This submission was already {status}.', { status: label(KYC_STATUS, k.status) })}</p></div>}
          {data.history.length > 0 && (
            <div className="card">
              <h2>{t('Earlier attempts')}</h2>
              {data.history.map((h) => <p key={h.id} className="small">{formatDate(toDate(h.submitted_at))} — {label(KYC_STATUS, h.status)}{h.review_note && <>: <bdi>{reasonText(h.review_note)}</bdi></>}</p>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
