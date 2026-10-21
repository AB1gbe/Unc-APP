import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { t, tj } from '../i18n.jsx';

export default function VerifyEmail() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [devCode, setDevCode] = useState(state?.devCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [emailFailed, setEmailFailed] = useState(Boolean(state?.emailFailed));

  // Already confirmed (also right after entering the code): same destination
  // rule as submit() below, or this redirect would skip the welcome step.
  if (user.emailVerified) return <Navigate to={user.onboarded ? '/verification' : '/welcome'} replace />;

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const { user } = await api('/auth/verify-email', { method: 'POST', body: { code } });
      setUser(user);
      // New members get the (skippable) profile step before identity.
      navigate(user.onboarded ? '/verification' : '/welcome');
    } catch (err) {
      setError(err);
    }
  }

  async function resend() {
    setError(null);
    try {
      const r = await api('/auth/resend-code', { method: 'POST' });
      setDevCode(r.devCode);
      setEmailFailed(false);
      setNotice(t('A new code is on its way.'));
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="narrow">
      <Steps current={1} />
      <div className="card">
        <h1>{t('Check your email')}</h1>
        <p className="muted">{tj("We sent a 6-digit code to {email}. Check your spam folder if it's not there in a minute.", { email: <b className="ltr">{user.email}</b> })}</p>
        {devCode && <div className="alert info small">{tj('Development mode: your code is {code} (also printed in the server console).', { code: <b className="ltr">{devCode}</b> })}</div>}
        {emailFailed && <div className="alert warn">{t("We couldn't send the email just now. Press “Send a new code” below.")}</div>}
        {notice && <div className="alert ok">{notice}</div>}
        <ErrorBox error={error} />
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="code">{t('Verification code')}</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: '1.4rem', letterSpacing: '.4em', textAlign: 'center' }} />
          </div>
          <button className="btn block">{t('Confirm email')}</button>
        </form>
        <p className="small center" style={{ marginTop: '1rem' }}>
          {tj("Didn't get it? {link}", { link: <button className="linkish" onClick={resend}>{t('Send a new code')}</button> })}
        </p>
      </div>
    </div>
  );
}

// The 3-step progress bar shown during onboarding.
export function Steps({ current }) {
  const steps = [[t('Account'), t('Created')], [t('Email'), t('Confirm address')], [t('Profile'), t('Photo & interests')], [t('Identity'), t('Verify (KYC)')]];
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
