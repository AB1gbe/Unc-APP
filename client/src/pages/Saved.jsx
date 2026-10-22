// Requests the member saved with "♡ Save" to come back to later.
import { Link } from 'react-router-dom';
import { Avatar, ErrorBox, ListingCard, CardsLoading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';
import { Place } from '../components/CityField.jsx';

export default function Saved() {
  const { data, error, loading } = useApi('/listings/saved');
  return (
    <>
      <h1>{t('Saved requests')}</h1>
      <p className="muted">{t('Requests you saved to come back to. Closed ones drop off this list.')}</p>
      <ErrorBox error={error} />
      {loading ? <CardsLoading /> : data?.listings.length === 0 ? (
        <div className="card empty">
          <p>{t('Nothing saved yet. Tap ♡ Save on a request to keep it here.')}</p>
          <Link className="btn" to="/browse">{t('Browse requests')}</Link>
        </div>
      ) : (
        <div className="grid">{data?.listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
      )}
      <FavouriteSellers />
    </>
  );
}

// "♥ Favourite sellers" (session 28): they hear first when you post in
// their categories. Tap one to see their profile or shop.
function FavouriteSellers() {
  const { data } = useApi('/favourites');
  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '.2rem' }}>{t('♥ Favourite sellers')}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>{t('They hear first when you post a request in a category they deal in.')}</p>
      {data && data.sellers.length === 0 ? (
        <div className="card empty">{t('No favourites yet. Tap ♡ Favourite on a seller you liked.')}</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {data?.sellers.map((s) => (
            <Link key={s.id} to={`/members/${s.id}`} className="inbox-item">
              <Avatar name={s.displayName} src={s.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b><bdi>{s.displayName}</bdi></b> {s.accountType === 'business' && <span className="badge grey">{t('Business')}</span>}
                {s.city && <div className="muted small">📍 <Place city={s.city} /></div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
