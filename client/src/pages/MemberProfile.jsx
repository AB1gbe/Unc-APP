// Public profile: who someone is and what others said about them after
// deals. There is deliberately NO "message" button - members can only be
// contacted about a specific request.
import { useParams } from 'react-router-dom';
import { ago, toDate } from '../api.js';
import { Avatar, ErrorBox, KycBadge, Loading, Stars } from '../components/ui.jsx';
import { useApi } from '../hooks.js';

export default function MemberProfile() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/members/${id}`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { member: m, reviews } = data;

  return (
    <div className="narrow stack" style={{ maxWidth: 720 }}>
      <div className="card">
        <div className="row">
          <Avatar name={m.displayName} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>{m.displayName}</h1>
            <div className="meta">
              <KycBadge status="approved" />
              {m.accountType === 'business' && <span className="badge grey">Business</span>}
              <span>Member since {toDate(m.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              <span>{m.deals} {m.deals === 1 ? 'deal' : 'deals'}</span>
            </div>
          </div>
          <div className="center">
            {m.rating.count ? (
              <>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{m.rating.average.toFixed(1)}</div>
                <Stars value={m.rating.average} />
                <div className="muted small">{m.rating.count} {m.rating.count === 1 ? 'rating' : 'ratings'}</div>
              </>
            ) : <span className="muted small">No ratings yet</span>}
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Reviews</h2>
        {reviews.length === 0 ? (
          <p className="muted">No reviews yet. Reviews appear after completed deals.</p>
        ) : reviews.map((r, i) => (
          <div key={i} className="review">
            <div className="row spread">
              <span><Stars value={r.stars} /> <b>{r.from.displayName}</b> <span className="muted small">· as {r.role === 'vendor' ? 'seller' : 'buyer'}</span></span>
              <span className="muted small">{ago(r.createdAt)}</span>
            </div>
            {r.comment && <p style={{ margin: '.3rem 0 0' }}>{r.comment}</p>}
            <div className="muted small">Deal: {r.listingTitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
