// Identity verification (KYC) form + status page.
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, toDate } from '../api.js';
import { reasonText } from '../kycReasons.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, KycBadge, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { Steps } from './VerifyEmail.jsx';
import { formatDateTime, t, tj } from '../i18n.jsx';

const ID_TYPES = [
  ['passport', () => t('Passport')],
  ['national_id', () => t('National ID card')],
  ['drivers_license', () => t("Driver's license")],
];

export default function Verification() {
  const { user, setUser } = useAuth();
  const { data, error, loading, reload } = useApi('/kyc');
  const [showForm, setShowForm] = useState(false);

  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="narrow">
        <ErrorBox error={error} />
        <button className="btn secondary" onClick={reload}>{t('Try again')}</button>
      </div>
    );
  }

  const status = data.kycStatus;
  const sub = data.submission;

  return (
    <div className="narrow">
      <Steps current={status === 'approved' ? (user.hasCard ? 5 : 4) : 3} />
      {!user.hasCard && status !== 'unverified' && status !== 'rejected' && (
        <div className="card add-card-step">
          <h2>{status === 'approved' ? t('One last step: add a payment card') : t('While you wait: add a payment card')}</h2>
          <p className="muted">{t('Every member adds a card, so people who break the rules can be held to them. Nothing is charged now.')}</p>
          <Link className="btn" to="/payment-card">{t('Add a payment card')}</Link>
        </div>
      )}
      {status === 'approved' && user.hasCard && (
        <div className="card center">
          <h1>{t("You're verified ✓")}</h1>
          <p className="muted">{t('You can now post requests and contact buyers.')}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn" to="/requests/new">{t('Post a request')}</Link>
            <Link className="btn secondary" to="/">{t('Browse requests')}</Link>
          </div>
        </div>
      )}
      {status === 'pending' && (
        <div className="card">
          <h1>{t("We're checking your documents")}</h1>
          <p><KycBadge status="pending" /></p>
          <p className="muted">{t('Submitted {date}. This usually takes less than a day. You can browse in the meantime.', { date: formatDateTime(toDate(sub.submittedAt)) })}</p>
          <button className="btn secondary" onClick={async () => { await reload(); }}>{t('Refresh status')}</button>
        </div>
      )}
      {(status === 'unverified' || status === 'rejected') && !showForm && (
        <div className="card">
          <h1>{t('Verify your identity')}</h1>
          {status === 'rejected' && (
            <div className="alert error">
              <b>{t('Your last verification was not approved.')}</b>
              {sub?.reviewNote && <div>{tj('Reason: {reason}', { reason: <bdi>{reasonText(sub.reviewNote)}</bdi> })}</div>}
              <div>{t('Please try again with clear photos.')}</div>
            </div>
          )}
          <p className="muted">{t("To keep everyone safe, every member who posts or makes offers is verified. You'll need:")}</p>
          <ul>
            <li>{t("A government photo ID (passport, national ID or driver's license)")}</li>
            <li>{t('A selfie, taken now, with your face clearly visible')}</li>
            {user.accountType === 'business' && <li>{t('A business registration document (photo or PDF)')}</li>}
          </ul>
          <p className="muted small">{t('Your documents are only visible to our verification team and are never shown to other members. We store only the last 4 characters of your ID number.')}</p>
          <button className="btn block" onClick={() => setShowForm(true)}>{t('Start verification')}</button>
        </div>
      )}
      {(status === 'unverified' || status === 'rejected') && showForm && (
        <KycForm
          isBusiness={user.accountType === 'business'}
          onDone={(u) => { setUser(u); setShowForm(false); reload(); }}
        />
      )}
    </div>
  );
}

function FileField({ name, label, hint, accept = 'image/jpeg,image/png,image/webp', capture, required, onChange }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="file" accept={accept} capture={capture} required={required}
        onChange={(e) => {
          const f = e.target.files[0];
          setPreview(f && f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
          onChange(name, f);
        }} />
      {hint && <div className="hint">{hint}</div>}
      {preview && <img src={preview} alt="" style={{ marginTop: '.5rem', maxHeight: 160, borderRadius: 8 }} />}
    </div>
  );
}

function KycForm({ isBusiness, onDone }) {
  const [form, setForm] = useState({ legalName: '', dateOfBirth: '', country: '', idType: 'passport', idNumber: '', businessName: '', businessRegNumber: '' });
  const [files, setFiles] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setFile = (k, f) => setFiles((prev) => ({ ...prev, [k]: f }));
  const needsBack = form.idType !== 'passport';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    Object.entries(files).forEach(([k, f]) => f && (k !== 'docBack' || needsBack) && fd.append(k, f));
    try {
      const { user } = await api('/kyc', { method: 'POST', form: fd });
      onDone(user);
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h1>{t('Your details')}</h1>
      <p className="muted small">{t('Enter them exactly as they appear on your ID.')}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="legalName">{t('Full legal name')}</label>
        <input id="legalName" required value={form.legalName} onChange={set('legalName')} autoComplete="name" />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="dateOfBirth">{t('Date of birth')}</label>
          <input id="dateOfBirth" type="date" required value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <div className="hint">{t('You must be 18 or older.')}</div>
        </div>
        <div className="field">
          <label htmlFor="country">{t('Country that issued your ID')}</label>
          <input id="country" required value={form.country} onChange={set('country')} autoComplete="country-name" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="idType">{t('ID type')}</label>
          <select id="idType" value={form.idType} onChange={set('idType')}>
            {ID_TYPES.map(([v, l]) => <option key={v} value={v}>{l()}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="idNumber">{t('ID number')}</label>
          <input id="idNumber" required value={form.idNumber} onChange={set('idNumber')} autoComplete="off" />
        </div>
      </div>

      {isBusiness && (
        <>
          <h2 style={{ marginTop: '1rem' }}>{t('Business details')}</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="businessName">{t('Registered business name')}</label>
              <input id="businessName" required value={form.businessName} onChange={set('businessName')} />
            </div>
            <div className="field">
              <label htmlFor="businessRegNumber">{t('Registration number')}</label>
              <input id="businessRegNumber" required value={form.businessRegNumber} onChange={set('businessRegNumber')} />
            </div>
          </div>
        </>
      )}

      <h2 style={{ marginTop: '1rem' }}>{t('Photos')}</h2>
      <p className="muted small">{t('JPG, PNG or WEBP, up to 5 MB each. Make sure all text is readable and nothing is cut off.')}</p>
      <FileField name="docFront" label={form.idType === 'passport' ? t('Passport photo page') : t('Front of ID')} required onChange={setFile} />
      {needsBack && <FileField name="docBack" label={t('Back of ID')} required onChange={setFile} />}
      <FileField name="selfie" label={t('Selfie')} hint={t('Look straight at the camera in good light. No hats or sunglasses.')} capture="user" required onChange={setFile} />
      {isBusiness && (
        <FileField name="businessDoc" label={t('Business registration document')} accept="image/jpeg,image/png,image/webp,application/pdf" hint={t('Photo or PDF.')} required onChange={setFile} />
      )}
      <button className="btn block" disabled={busy}>{busy ? t('Uploading…') : t('Submit for verification')}</button>
    </form>
  );
}
