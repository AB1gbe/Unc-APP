import { Link } from 'react-router-dom';
import { useAuth, isVerified } from '../auth.jsx';
import { ErrorBox, ListingCard, Loading, StatusBadge, VerifyPrompt } from '../components/ui.jsx';
import { useApi } from '../hooks.js';

export default function MyListings() {
  const { user } = useAuth();
  const { data, error, loading } = useApi('/listings/mine');

  return (
    <>
      <div className="row spread" style={{ marginBottom: '1rem' }}>
        <h1>My requests</h1>
        {isVerified(user) && <Link className="btn" to="/requests/new">+ Post a request</Link>}
      </div>
      {!isVerified(user) && <VerifyPrompt action="post requests" />}
      <ErrorBox error={error} />
      {loading ? <Loading /> : data?.listings.length === 0 ? (
        <div className="card empty">You haven't posted any requests yet.</div>
      ) : (
        <div className="grid">
          {data?.listings.map((l) => (
            <div key={l.id} style={{ position: 'relative' }}>
              <ListingCard listing={l} />
              <div style={{ position: 'absolute', top: '-8px', right: '10px' }}><StatusBadge status={l.status} /></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
