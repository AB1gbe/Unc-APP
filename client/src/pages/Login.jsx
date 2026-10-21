import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { t, tj } from '../i18n.jsx';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: form });
      setUser(user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow card">
      <h1>{t('Welcome back')}</h1>
      {state?.notice && <div className="alert ok">{state.notice}</div>}
      <ErrorBox error={error} />
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">{t('Email')}</label>
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <div className="row spread">
            <label htmlFor="password">{t('Password')}</label>
            <Link to="/forgot-password" className="small">{t('Forgot password?')}</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn block" disabled={busy}>{busy ? t('Logging in…') : t('Log in')}</button>
      </form>
      <p className="muted small center" style={{ marginTop: '1rem' }}>{tj('New here? {link}', { link: <Link to="/register">{t('Create an account')}</Link> })}</p>
    </div>
  );
}
