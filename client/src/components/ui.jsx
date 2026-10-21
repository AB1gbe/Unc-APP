// Small reusable building blocks used across pages.
// Text written by members (titles, descriptions, names, messages) gets
// dir="auto" or <bdi>, so English text inside the Arabic layout (and the
// other way round) keeps its own direction and punctuation.
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth, isVerified } from '../auth.jsx';
import { budget, ago, toDate } from '../api.js';
import { t, tj, tn } from '../i18n.jsx';

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="alert error" role="alert">{error.message || String(error)}</div>;
}

// Grey placeholder shapes while a page loads (feels faster than a word).
// Screen readers still hear "Loading…".
export function Loading() {
  return (
    <div className="skeleton" role="status" aria-busy="true">
      <span className="visually-hidden">{t('Loading…')}</span>
      <div className="sk-line" style={{ width: '60%' }} />
      <div className="sk-line" />
      <div className="sk-line" style={{ width: '80%' }} />
    </div>
  );
}

// Placeholder request cards for grids (Home, Browse, Saved).
export function CardsLoading({ count = 3 }) {
  return (
    <div className="grid" role="status" aria-busy="true">
      <span className="visually-hidden">{t('Loading…')}</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card skeleton" aria-hidden>
          <div className="sk-photo" />
          <div className="sk-line" style={{ width: '40%' }} />
          <div className="sk-line" style={{ width: '85%' }} />
          <div className="sk-line" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  );
}

export function KycBadge({ status }) {
  const map = {
    approved: ['ok', t('✓ Verified')],
    pending: ['warn', t('Verification pending')],
    rejected: ['bad', t('Verification rejected')],
    unverified: ['grey', t('Not verified')],
  };
  const [cls, text] = map[status] || map.unverified;
  return <span className={`badge ${cls}`}>{text}</span>;
}

const STATUS_LABELS = { open: () => t('open'), fulfilled: () => t('found'), closed: () => t('closed') };
export const statusLabel = (status) => STATUS_LABELS[status]?.() ?? status;

export function StatusBadge({ status }) {
  const cls = { open: 'ok', fulfilled: '', closed: 'grey' }[status] ?? 'grey';
  return <span className={`badge ${cls}`}>{statusLabel(status)}</span>;
}

// Profile photo, or the first letter of the name when there is none.
export function Avatar({ name, src, size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (src) return <img className="avatar" src={src} alt="" style={style} loading="lazy" />;
  return <div className="avatar" aria-hidden style={style}>{(name || '?').trim()[0]?.toUpperCase()}</div>;
}

export function ListingCard({ listing }) {
  return (
    <Link className="card" to={`/requests/${listing.id}`}>
      {listing.images?.[0] && (
        <div className="card-photo"><img src={listing.images[0]} alt="" loading="lazy" /></div>
      )}
      <div className="row spread" style={{ marginBottom: '.4rem' }}>
        <span className="badge">{t(listing.category)}</span>
        <span className="price">{budget(listing)}</span>
      </div>
      <h3 dir="auto">{listing.title}</h3>
      {listing.description && (
        <p dir="auto" className="muted small" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {listing.description}
        </p>
      )}
      <div className="meta">
        <span>📍 <bdi>{listing.city}</bdi></span>
        <span>🕒 {ago(listing.createdAt)}</span>
        {listing.offerCount > 0 && <span>💬 {tn(listing.offerCount, '{n} offer', '{n} offers')}</span>}
        {listing.viewCount > 0 && <span title={t('People who looked at it')}>👀 {listing.viewCount}</span>}
      </div>
    </Link>
  );
}

// What a not-yet-verified member is trying to do, as a phrase that fits
// "…to {action}". Pages pass one of these keys.
const ACTIONS = {
  post: () => t('post a request'),
  edit: () => t('edit a request'),
  contact: () => t('contact this buyer'),
  postMany: () => t('post requests'),
};

// Explains what the user still needs to do before they can post / contact.
export function VerifyPrompt({ action = 'post' }) {
  const { user } = useAuth();
  const what = ACTIONS[action]?.() ?? action;
  if (!user) {
    return (
      <div className="alert info">
        {tj('{login} or {register} to {action}.', {
          login: <Link to="/login">{t('Log in')}</Link>,
          register: <Link to="/register">{t('create an account')}</Link>,
          action: what,
        })}
      </div>
    );
  }
  if (!user.emailVerified) {
    return <div className="alert warn">{tj('Please {confirm} to {action}.', { confirm: <Link to="/verify-email">{t('confirm your email')}</Link>, action: what })}</div>;
  }
  if (user.kycStatus === 'pending') {
    return <div className="alert warn">{t("Your identity check is being reviewed. You can {action} once it's approved.", { action: what })}</div>;
  }
  return (
    <div className="alert warn">
      {tj('Only verified members can {action}. {verify} — it takes about 2 minutes.', {
        action: what,
        verify: <Link to="/verification">{t('Verify your identity')}</Link>,
      })}
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

// ---- Activity (session 20) ----

const ACTIVE_MS = 5 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const REPLY = {
  hour: () => t('Usually replies within an hour'),
  hours: () => t('Usually replies within a few hours'),
  day: () => t('Usually replies within a day'),
  days: () => t('Usually takes a few days to reply'),
};

// "🟢 Active now · Usually replies within an hour". Shows nothing it doesn't
// know (never online, or not seen for a week).
export function Activity({ activity }) {
  if (!activity) return null;
  const seen = activity.lastSeenAt ? toDate(activity.lastSeenAt).getTime() : 0;
  const since = Date.now() - seen;
  const parts = [];
  if (seen && since < ACTIVE_MS) parts.push(<span key="on" className="active-now">{t('Active now')}</span>);
  else if (seen && since < WEEK_MS) parts.push(<span key="ago">{t('Active {time}', { time: ago(activity.lastSeenAt) })}</span>);
  if (activity.replyTime) parts.push(<span key="reply">{REPLY[activity.replyTime]()}</span>);
  if (!parts.length) return null;
  return <span className="activity small muted">{parts.reduce((all, p, i) => (i ? [...all, ' · ', p] : [p]), [])}</span>;
}

// ---- Ratings ----

// Read-only stars, e.g. <Stars value={4.5} />. Half values round to the
// nearest whole star for display; the number is shown next to it.
export function Stars({ value, size = '1rem' }) {
  const full = Math.round(value || 0);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={t('{value} out of 5 stars', { value })} role="img">
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= full ? 'on' : ''} aria-hidden>★</span>)}
    </span>
  );
}

// "★ 4.5 (12)" or "No ratings yet". Shown next to member names.
export function RatingBadge({ rating }) {
  if (!rating || !rating.count) return <span className="muted small">{t('No ratings yet')}</span>;
  return (
    <span className="rating-badge" title={tn(rating.count, '{avg} out of 5 from {n} rating', '{avg} out of 5 from {n} ratings', { avg: rating.average })}>
      <span className="star-on">★</span> {rating.average.toFixed(1)} <span className="muted">({rating.count})</span>
    </span>
  );
}

// Clickable 1-5 star picker for the rating form. Works with mouse, touch
// and keyboard (they are real radio buttons underneath).
export function StarInput({ value, onChange, name = 'stars' }) {
  const [hover, setHover] = useState(0);
  const labels = ['', t('Bad'), t('Poor'), t('OK'), t('Good'), t('Excellent')];
  const shown = hover || value;
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)} title={labels[n]}>
          <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
          ★
        </label>
      ))}
      <span className="muted small" style={{ marginInlineStart: '.5rem' }}>{labels[shown] || t('Choose 1–5 stars')}</span>
    </div>
  );
}
