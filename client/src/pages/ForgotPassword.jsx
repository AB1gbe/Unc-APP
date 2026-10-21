import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow card">
      <h1>Forgot your password?</h1>
      {sent ? (
        <>
          <div className="alert ok">If an account exists for <b>{email}</b>, we've sent a link to reset your password. It works for 30 minutes.</div>
          <p className="muted small">Not there? Check your spam folder, or <button className="linkish" onClick={() => setSent(false)}>try again</button>.</p>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className="muted">Enter the email you signed up with and we'll send you a link to choose a new password.</p>
          <ErrorBox error={error} />
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
      <p className="muted small center" style={{ marginTop: '1rem' }}><Link to="/login">Back to log in</Link></p>
    </div>
  );
}
