import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toDate } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, KycBadge } from '../components/ui.jsx';

export default function Account() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ displayName: user.displayName, city: user.city || '' });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const { user } = await api('/auth/me', { method: 'PATCH', body: form });
      setUser(user);
      setSaved(true);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="narrow stack">
      <div className="card">
        <h1>Account</h1>
        <p className="muted">{user.email} · {user.accountType === 'business' ? 'Business' : 'Individual'} · member since {toDate(user.createdAt).toLocaleDateString()}</p>
        <div className="row">
          <span>Email: {user.emailVerified ? <span className="badge ok">✓ Confirmed</span> : <Link to="/verify-email">Confirm now</Link>}</span>
          <span>Identity: <KycBadge status={user.kycStatus} /></span>
          {user.kycStatus === 'approved' && <Link to={`/members/${user.id}`}>View my public profile & ratings →</Link>}
        </div>
        {user.kycStatus !== 'approved' && user.emailVerified && (
          <p style={{ marginTop: '.75rem' }}><Link className="btn sm" to="/verification">Go to verification</Link></p>
        )}
      </div>
      <form className="card" onSubmit={save}>
        <h2>Profile</h2>
        <ErrorBox error={error} />
        {saved && <div className="alert ok">Saved.</div>}
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input id="displayName" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <button className="btn">Save</button>
      </form>
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
    if (form.password !== form.confirm) return setError(new Error('The two new passwords do not match.'));
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
      <h2>Change password</h2>
      <ErrorBox error={error} />
      {done && <div className="alert ok">Password changed. Other devices were logged out.</div>}
      <div className="field">
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={set('currentPassword')} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Repeat new password</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </div>
      </div>
      <p className="small"><Link to="/forgot-password">Forgot your current password?</Link></p>
      <button className="btn">Change password</button>
    </form>
  );
}
