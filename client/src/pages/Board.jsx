// The front page. Session 82 made it Craigslist-style; session 85 takes
// its layout from Facebook Marketplace (the owner's choice): search, a row
// of section chips, then "Today's picks" as a grid of big photos with the
// price first. Jobs follow as rows (they rarely have photos), then what
// people in Bahrain are looking for (Wanted, Unc's own idea), then shops.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';
import { CardsLoading } from '../components/ui.jsx';
import { ShopsPreview } from '../components/Showcase.jsx';
import Icon from '../components/Icon.jsx';
import { AdCard, AdRow, SampleNote } from './AdList.jsx';

// Featured tiles: label, where they go, picture, colour. No red or green
// (those mean bad/good, ADR-076).
const cat = (c) => `/for-sale?category=${encodeURIComponent(c)}`;
const FEATURED = [
  { label: () => t('Phones'), to: cat('Phones & Tablets'), img: '/art/cat-phones.jpg', color: '#1d4ed8' },
  { label: () => t('Homes for rent'), to: '/housing', img: '/art/feat-housing.jpg', color: '#7e22ce' },
  { label: () => t('Cars & parts'), to: cat('Vehicles & Parts'), img: '/art/cat-vehicles.jpg', color: '#a16207' },
  { label: () => t('Jobs'), to: '/jobs', img: '/art/feat-jobs.jpg', color: '#0f766e' },
  { label: () => t('Furniture'), to: cat('Home & Furniture'), img: '/art/cat-home.jpg', color: '#4338ca' },
  { label: () => t('Electronics'), to: cat('Electronics'), img: '/art/cat-electronics.jpg', color: '#0e7490' },
  { label: () => t('Fashion'), to: cat('Fashion'), img: '/art/cat-fashion.jpg', color: '#6d28d9' },
  { label: () => t('Sports'), to: cat('Sports & Outdoors'), img: '/art/cat-sports.jpg', color: '#334155' },
  { label: () => t('Wanted'), to: '/browse', img: '/art/cat-other.jpg', color: '#1e3a8a' },
];

const byNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id);

export default function Board() {
  const { user } = useAuth();
  const { data, loading } = useApi('/listings/sections');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const latest = data?.latest ?? {};
  // Today's picks: the newest things for sale and places to rent, mixed.
  const picks = [...(latest.forsale ?? []), ...(latest.housing ?? [])].sort(byNewest).slice(0, 12);
  const postTo = user ? '/requests/new?section=forsale' : '/register';

  function search(e) {
    e.preventDefault();
    navigate(`/for-sale${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }

  return (
    <>
      {/* First thing people see (session 91): what Unc is, in one line. */}
      <div className="market-top">
        <div>
          <h1>{t('Buy, sell and connect with people near you')}</h1>
          <p className="muted tagline-sub">{t('Things for sale, homes, jobs and requests across Bahrain. Every member is ID-checked.')}</p>
        </div>
        <Link className="btn sm ok" to={postTo}><Icon name="plus" weight="bold" /> {t('Sell')}</Link>
      </div>
      <form className="market-search" onSubmit={search}>
        <Icon name="search" />
        <input type="search" enterKeyHint="search" placeholder={t('Search Unc')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
      </form>
      {/* Featured categories (session 91, like the Siin app): coloured
          tiles with a picture, scrolling sideways. */}
      <nav className="feature-row" aria-label={t('Featured categories')}>
        {FEATURED.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile" style={{ '--tile': f.color }}>
            <span className="feature-title">{f.label()}</span>
            <img src={f.img} alt="" loading="lazy" />
          </Link>
        ))}
      </nav>

      <section className="market-block">
        <div className="section-head">
          <h2>{t('Today’s picks')}</h2>
          <span className="muted small"><Icon name="pin" /> {t('Bahrain')}</span>
        </div>
        <SampleNote listings={picks} />
        {loading ? <CardsLoading /> : picks.length === 0
          ? <p className="muted">{t('No ads here yet.')} <Link to={postTo}>{t('Post the first one')}</Link></p>
          : <ul className="ad-grid">{picks.map((l) => <AdCard key={l.id} listing={l} />)}</ul>}
      </section>

      {(latest.jobs ?? []).length > 0 && (
        <section className="market-block">
          <div className="section-head">
            <h2>{t('Newest jobs')}</h2>
            <Link to="/jobs">{t('See all')} <span className="flip">→</span></Link>
          </div>
          <ul className="ad-list">{latest.jobs.slice(0, 4).map((l) => <AdRow key={l.id} listing={l} />)}</ul>
        </section>
      )}

      {(latest.wanted ?? []).length > 0 && (
        <section className="market-block">
          <div className="section-head">
            <div>
              <h2>{t('What Bahrain is looking for')}</h2>
              <p className="muted small" style={{ margin: 0 }}>{t('Have one of these? Make an offer.')}</p>
            </div>
            <Link to="/browse">{t('See all')} <span className="flip">→</span></Link>
          </div>
          <ul className="ad-grid">{latest.wanted.slice(0, 6).map((l) => <AdCard key={l.id} listing={l} />)}</ul>
        </section>
      )}

      <div className="safety-strip">
        <div><Icon name="admin" /> <b>{t('ID-checked posters')}</b><span className="muted small">{t('Everyone who posts or replies has passed an ID check.')}</span></div>
        <div><Icon name="chat" /> <b>{t('Private chat only')}</b><span className="muted small">{t('Numbers and emails stay hidden; you talk inside the ad.')}</span></div>
        <div><Icon name="warning" /> <b>{t('Scam checks')}</b><span className="muted small">{t('Ads asking for money up front are blocked; doubtful ones are checked by a person.')}</span></div>
      </div>
      <ShopsPreview />
    </>
  );
}
