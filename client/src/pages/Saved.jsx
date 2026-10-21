// Requests the member saved with "♡ Save" to come back to later.
import { Link } from 'react-router-dom';
import { ErrorBox, ListingCard, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';

export default function Saved() {
  const { data, error, loading } = useApi('/listings/saved');
  return (
    <>
      <h1>{t('Saved requests')}</h1>
      <p className="muted">{t('Requests you saved to come back to. Closed ones drop off this list.')}</p>
      <ErrorBox error={error} />
      {loading ? <Loading /> : data?.listings.length === 0 ? (
        <div className="card empty">
          <p>{t('Nothing saved yet. Tap ♡ Save on a request to keep it here.')}</p>
          <Link className="btn" to="/browse">{t('Browse requests')}</Link>
        </div>
      ) : (
        <div className="grid">{data?.listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
      )}
    </>
  );
}
