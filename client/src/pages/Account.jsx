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
    </div>
  );
}
