import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { t, tj } from '../i18n.jsx';

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', accountType: 'individual', city: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user, devCode, emailSent } = await api('/auth/register', { method: 'POST', body: form });
      setUser(user);
      navigate('/verify-email', { state: { devCode, emailFailed: emailSent === false } });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow card">
      <h1>{t('Create your account')}</h1>
      <p className="muted">{t("Post what you're looking for, or find buyers for what you sell.")}</p>
      <ErrorBox error={error} />
      <form onSubmit={submit}>
        <div className="field">
          <label>{t('I am…')}</label>
          <div className="field-row">
            {[['individual', t('A person'), t('Buying for myself or finding items as a freelancer')], ['business', t('A business'), t('A shop or company selling products')]].map(([v, title, hint]) => (
              <label key={v} className="card" style={{ cursor: 'pointer', borderColor: form.accountType === v ? 'var(--brand)' : undefined, fontWeight: 400 }}>
                <input type="radio" name="accountType" value={v} checked={form.accountType === v} onChange={set('accountType')} style={{ width: 'auto', marginInlineEnd: '.4rem' }} />
                <b>{title}</b>
                <div className="hint">{hint}</div>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="displayName">{form.accountType === 'business' ? t('Business name (shown to others)') : t('Your name (shown to others)')}</label>
          <input id="displayName" required minLength={2} maxLength={60} value={form.displayName} onChange={set('displayName')} />
        </div>
        <div className="field">
          <label htmlFor="email">{t('Email')}</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">{t('Password')}</label>
          <input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
          <div className="hint">{t('At least 8 characters, with letters and numbers.')}</div>
        </div>
        <div className="field">
          <label htmlFor="city">{t('City')} <span className="muted">{t('(optional)')}</span></label>
          <input id="city" value={form.city} onChange={set('city')} />
        </div>
        <button className="btn block" disabled={busy}>{busy ? t('Creating…') : t('Create account')}</button>
      </form>
      <p className="muted small center" style={{ marginTop: '1rem' }}>{tj('Already have an account? {link}', { link: <Link to="/login">{t('Log in')}</Link> })}</p>
    </div>
  );
}
