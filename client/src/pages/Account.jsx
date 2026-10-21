import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, toDate } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, ErrorBox, KycBadge } from '../components/ui.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import { formatDate, t, tj } from '../i18n.jsx';
import PushSettings from '../components/PushSettings.jsx';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="narrow stack" style={{ maxWidth: 680 }}>
      <div className="card">
        <div className="row">
          <Avatar name={user.displayName} src={user.avatarUrl} size={56} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>{t('Account')}</h1>
            <p className="muted" style={{ margin: 0 }}><span className="ltr">{user.email}</span> · {user.accountType === 'business' ? t('Business') : t('Individual')} · {t('member since {date}', { date: formatDate(toDate(user.createdAt)) })}</p>
          </div>
        </div>
        <div className="row" style={{ marginTop: '.75rem' }}>
          <span>{t('Email:')} {user.emailVerified ? <span className="badge ok">{t('✓ Confirmed')}</span> : <Link to="/verify-email">{t('Confirm now')}</Link>}</span>
          <span>{t('Identity:')} <KycBadge status={user.kycStatus} /></span>
          {user.kycStatus === 'approved' && <Link to={`/members/${user.id}`}>{t('View my public profile & ratings')} <span className="flip">→</span></Link>}
          <Link to="/saved">{t('♥ Saved requests')} <span className="flip">→</span></Link>
        </div>
        {user.kycStatus !== 'approved' && user.emailVerified && (
          <p style={{ marginTop: '.75rem' }}><Link className="btn sm" to="/verification">{t('Go to verification')}</Link></p>
        )}
      </div>
      <div className="card">
        <h2>{t('Your profile')}</h2>
        <p className="muted small">{t('This is what other members see when they look at your name.')}</p>
        <ProfileEditor />
      </div>
      <EmailSettings />
      <PushSettings />
      <ChangePassword />
      <div className="card row spread">
        <span className="muted small">{tj('Signed in as {email}', { email: <span className="ltr">{user.email}</span> })}</span>
        <button className="btn secondary" onClick={async () => { await logout(); navigate('/'); }}>{t('Log out')}</button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const empty = { currentPassword: '', password: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (form.password !== form.confirm) return setError(new Error(t('The two new passwords do not match.')));
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: form.currentPassword, password: form.password } });
      setForm(empty);
      setDone(true);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{t('Change password')}</h2>
      <ErrorBox error={error} />
      {done && <div className="alert ok">{t('Password changed. Other devices were logged out.')}</div>}
      <div className="field">
        <label htmlFor="currentPassword">{t('Current password')}</label>
        <input id="currentPassword" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={set('currentPassword')} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="newPassword">{t('New password')}</label>
          <input id="newPassword" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">{t('Repeat new password')}</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </div>
      </div>
      <p className="small"><Link to="/forgot-password">{t('Forgot your current password?')}</Link></p>
      <button className="btn">{t('Change password')}</button>
    </form>
  );
}

// "Email me about new offers" (on by default). Saves as soon as it's ticked.
function EmailSettings() {
  const { user, setUser } = useAuth();
  // Shown at once; put back if saving fails. (Waiting for the server made
  // the tick jump back until it answered.)
  const [checked, setChecked] = useState(user.emailOffers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function change(e) {
    const emailOffers = e.target.checked;
    setChecked(emailOffers);
    setBusy(true);
    setError(null);
    try {
      setUser((await api('/auth/me', { method: 'PATCH', body: { emailOffers } })).user);
    } catch (err) {
      setChecked(!emailOffers);
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card">
      <h2>{t('Email notifications')}</h2>
      <ErrorBox error={error} />
      <label className="toggle-row">
        <input type="checkbox" checked={checked} disabled={busy} onChange={change} />
        <span>
          {t('Email me when a seller makes an offer on my request')}
          <span className="hint" style={{ display: 'block' }}>{tj('Sent to {email}. Replies and deals stay in the app.', { email: <span className="ltr">{user.email}</span> })}</span>
        </span>
      </label>
    </div>
  );
}

