// Opened from the link in the reset email: /reset-password?token=...
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';

export default function ResetPassword() {
  const token = useSearchParams()[0].get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [valid, setValid] = useState(null); // null = checking
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return setValid(false);
    api('/auth/reset-password/check', { method: 'POST', body: { token } })
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) return setError(new Error('The two passwords do not match.'));
    setBusy(true);
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setUser(null); // every session was ended by the server
      navigate('/login', { replace: true, state: { notice: 'Password changed. Log in with your new password.' } });
    } catch (err) {
      if (err.body?.code === 'RESET_INVALID') setValid(false);
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (valid === null) return <Loading />;
  if (!valid) {
    return (
      <div className="narrow card">
        <h1>This link has expired</h1>
        <p className="muted">Reset links work once and only for 30 minutes. Request a new one.</p>
        <Link className="btn block" to="/forgot-password">Send a new link</Link>
      </div>
    );
  }

  return (
    <form className="narrow card" onSubmit={submit}>
      <h1>Choose a new password</h1>
      <p className="muted small">You'll be logged out on all devices.</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="hint">At least 8 characters, with letters and numbers.</div>
      </div>
      <div className="field">
        <label htmlFor="confirm">Repeat new password</label>
        <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button className="btn block" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
    </form>
  );
}
