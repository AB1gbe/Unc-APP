// Small reusable building blocks used across pages.
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth, isVerified } from '../auth.jsx';
import { budget, ago } from '../api.js';

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="alert error" role="alert">{error.message || String(error)}</div>;
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}

export function KycBadge({ status }) {
  const map = {
    approved: ['ok', '✓ Verified'],
    pending: ['warn', 'Verification pending'],
    rejected: ['bad', 'Verification rejected'],
    unverified: ['grey', 'Not verified'],
  };
  const [cls, text] = map[status] || map.unverified;
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function StatusBadge({ status }) {
  const cls = { open: 'ok', fulfilled: '', closed: 'grey' }[status] ?? 'grey';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function Avatar({ name }) {
  return <div className="avatar" aria-hidden>{(name || '?').trim()[0]?.toUpperCase()}</div>;
}

export function ListingCard({ listing }) {
  return (
    <Link className="card" to={`/requests/${listing.id}`}>
      <div className="row spread" style={{ marginBottom: '.4rem' }}>
        <span className="badge">{listing.category}</span>
        <span className="price">{budget(listing)}</span>
      </div>
      <h3>{listing.title}</h3>
      <p className="muted small" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {listing.description}
      </p>
      <div className="meta">
        <span>📍 {listing.city}</span>
        <span>🕒 {ago(listing.createdAt)}</span>
        {listing.offerCount > 0 && <span>💬 {listing.offerCount} {listing.offerCount === 1 ? 'offer' : 'offers'}</span>}
      </div>
    </Link>
  );
}

// Explains what the user still needs to do before they can post / contact.
export function VerifyPrompt({ action = 'do this' }) {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="alert info">
        <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link> to {action}.
      </div>
    );
  }
  if (!user.emailVerified) {
    return <div className="alert warn">Please <Link to="/verify-email">confirm your email</Link> to {action}.</div>;
  }
  if (user.kycStatus === 'pending') {
    return <div className="alert warn">Your identity check is being reviewed. You can {action} once it's approved.</div>;
  }
  return (
    <div className="alert warn">
      Only verified members can {action}. <Link to="/verification">Verify your identity</Link> — it takes about 2 minutes.
    </div>
  );
}

// Route guards
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === undefined) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

export function RequireVerified({ children, action }) {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  if (!isVerified(user)) return <div className="narrow"><VerifyPrompt action={action} /></div>;
  return children;
}

export function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// ---- Ratings ----

// Read-only stars, e.g. <Stars value={4.5} />. Half values round to the
// nearest whole star for display; the number is shown next to it.
export function Stars({ value, size = '1rem' }) {
  const full = Math.round(value || 0);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= full ? 'on' : ''} aria-hidden>★</span>)}
    </span>
  );
}

// "★ 4.5 (12)" or "No ratings yet". Shown next to member names.
export function RatingBadge({ rating }) {
  if (!rating || !rating.count) return <span className="muted small">No ratings yet</span>;
  return (
    <span className="rating-badge" title={`${rating.average} out of 5 from ${rating.count} rating${rating.count === 1 ? '' : 's'}`}>
      <span className="star-on">★</span> {rating.average.toFixed(1)} <span className="muted">({rating.count})</span>
    </span>
  );
}

// Clickable 1-5 star picker for the rating form. Works with mouse, touch
// and keyboard (they are real radio buttons underneath).
export function StarInput({ value, onChange, name = 'stars' }) {
  const [hover, setHover] = useState(0);
  const labels = ['', 'Bad', 'Poor', 'OK', 'Good', 'Excellent'];
  const shown = hover || value;
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)} title={labels[n]}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
          ★
        </label>
      ))}
      <span className="muted small" style={{ marginLeft: '.5rem' }}>{labels[shown] || 'Choose 1–5 stars'}</span>
    </div>
  );
}
