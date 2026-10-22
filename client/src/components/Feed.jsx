// "Happening near you" (session 26): a short list of real, recent activity,
// the member's own city first. Built from GET /api/feed; the server never
// sends the names of private people, only cities and categories.
import { Link } from 'react-router-dom';
import { ago } from '../api.js';
import { useApi } from '../hooks.js';
import { t, tj } from '../i18n.jsx';
import { Place } from './CityField.jsx';

function line(i) {
  const city = <Place city={i.city} />;
  switch (i.kind) {
    case 'found':
      return ['🎉', tj('Someone in {city} found what they needed in {category}', { city, category: t(i.category) })];
    case 'request':
      return ['🆕', tj('New request in {city}: {title}', { city, title: <Link to={`/requests/${i.listing.id}`}><bdi>{i.listing.title}</bdi></Link> })];
    case 'shop':
      return ['🏪', tj('New shop in {city}: {name}', { city, name: <Link to={`/members/${i.shop.id}`}><bdi>{i.shop.displayName}</bdi></Link> })];
    case 'offers-today':
      return ['💬', tj('{n} offers made on requests in {city} today', { n: i.count, city })];
    default:
      return null;
  }
}

export default function Feed({ title }) {
  const { data } = useApi('/feed');
  const items = (data?.items ?? []).map((i) => [i, line(i)]).filter(([, l]) => l);
  if (!items.length) return null;
  return (
    <section className="card feed" style={{ padding: 0 }}>
      <h2 style={{ padding: '1rem 1rem 0', margin: 0 }}>{title ?? t('Happening near you')}</h2>
      {data.city && <p className="muted small" style={{ padding: '0 1rem', margin: '.2rem 0 0' }}>{tj('{city} first, then the rest of Unc.', { city: <Place city={data.city} /> })}</p>}
      <ul>
        {items.map(([i, [icon, text]], n) => (
          <li key={n} className={i.near ? 'near' : ''}>
            <span className="feed-icon" aria-hidden>{icon}</span>
            <span className="feed-text">{text}</span>
            <span className="muted small feed-time">{ago(i.at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
