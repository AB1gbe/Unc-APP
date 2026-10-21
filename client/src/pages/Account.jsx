import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toDate } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, ErrorBox, KycBadge } from '../components/ui.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import { formatDate, t } from '../i18n.jsx';

export default function Account() {
  const { user } = useAuth();

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
      <ChangePassword />
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
