import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';

export default function VerifyEmail() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [devCode, setDevCode] = useState(useLocation().state?.devCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  if (user.emailVerified) return <Navigate to="/verification" replace />;

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const { user } = await api('/auth/verify-email', { method: 'POST', body: { code } });
      setUser(user);
      navigate('/verification');
    } catch (err) {
      setError(err);
    }
  }

  async function resend() {
    setError(null);
    try {
      const r = await api('/auth/resend-code', { method: 'POST' });
      setDevCode(r.devCode);
      setNotice('A new code is on its way.');
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="narrow">
      <Steps current={1} />
      <div className="card">
        <h1>Check your email</h1>
        <p className="muted">We sent a 6-digit code to <b>{user.email}</b>.</p>
        {devCode && <div className="alert info small">Development mode: your code is <b>{devCode}</b> (also printed in the server console).</div>}
        {notice && <div className="alert ok">{notice}</div>}
        <ErrorBox error={error} />
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: '1.4rem', letterSpacing: '.4em', textAlign: 'center' }} />
          </div>
          <button className="btn block">Confirm email</button>
        </form>
        <p className="small center" style={{ marginTop: '1rem' }}>
          Didn't get it? <button className="linkish" onClick={resend}>Send a new code</button>
        </p>
      </div>
    </div>
  );
}

// The 3-step progress bar shown during onboarding.
export function Steps({ current }) {
  const steps = [['Account', 'Created'], ['Email', 'Confirm address'], ['Identity', 'Verify (KYC)']];
  return (
    <div className="steps">
      {steps.map(([title, sub], i) => (
        <div key={title} className={`step ${i < current ? 'done' : i === current ? 'current' : ''}`}>
          <b>{i < current ? '✓ ' : `${i + 1}. `}{title}</b>{sub}
        </div>
      ))}
    </div>
  );
}
