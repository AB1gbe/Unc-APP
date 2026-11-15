// The front page. Session 82 made it Craigslist-style; session 85 takes
// its layout from Facebook Marketplace (the owner's choice): search, a row
// of section chips, then "Today's picks" as a grid of big photos with the
// price first. Jobs follow as rows (they rarely have photos), then what
// people in Bahrain are looking for (Wanted, Unc's own idea), then shops.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { t, tj } from '../i18n.jsx';
import { CardsLoading } from '../components/ui.jsx';
import { ShopsPreview } from '../components/Showcase.jsx';
import Icon from '../components/Icon.jsx';
import { AdCard, AdRow, SampleNote } from './AdList.jsx';

// Featured tiles: label, where they go, picture.
const cat = (c) => `/for-sale?category=${encodeURIComponent(c)}`;
const FEATURED = [
  { label: () => t('Wanted'), to: '/browse', img: '/art/cat-other.jpg' },
  { label: () => t('Phones'), to: cat('Phones & Tablets'), img: '/art/cat-phones.jpg' },
  { label: () => t('Homes for rent'), to: '/housing', img: '/art/feat-housing.jpg' },
  { label: () => t('Cars & parts'), to: cat('Vehicles & Parts'), img: '/art/cat-vehicles.jpg' },
  { label: () => t('Jobs'), to: '/jobs', img: '/art/feat-jobs.jpg' },
  { label: () => t('Furniture'), to: cat('Home & Furniture'), img: '/art/cat-home.jpg' },
  { label: () => t('Electronics'), to: cat('Electronics'), img: '/art/cat-electronics.jpg' },
  { label: () => t('Fashion'), to: cat('Fashion'), img: '/art/cat-fashion.jpg' },
  { label: () => t('Sports'), to: cat('Sports & Outdoors'), img: '/art/cat-sports.jpg' },
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
      {/* Session 94: the tagline stands alone, "near you" marked in blue
          on a yellow highlighter stroke (the logo's colours); Sell moved
          next to the search box. */}
      <div className="market-top">
        <h1 className="tagline">
          {/* Screen readers hear the whole idea once; the moving words are hidden from them. */}
          <span className="visually-hidden">{t('Buy, Sell or Trade and Connect Near You')}</span>
          <span aria-hidden="true">{tj('{verb} and Connect {near}', { verb: <RotatingWord words={[t('Buy'), t('Sell'), t('Trade')]} />, near: t('Near You') })}</span>
        </h1>
      </div>
      <div className="market-search-row">
        <form className="market-search" onSubmit={search}>
          <Icon name="search" />
          <input type="search" enterKeyHint="search" placeholder={t('Search Unc')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
        </form>
        <Link className="btn ok sell-btn" to={postTo}><Icon name="plus" weight="bold" /> {t('Sell')}</Link>
      </div>
      {/* Featured categories (session 91; session 92: plain small photos
          with the name under them, no colour glow: "make them look real"). */}
      <nav className="feature-row" aria-label={t('Featured categories')}>
        {FEATURED.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <img src={f.img} alt="" loading="lazy" />
            <span className="feature-title">{f.label()}</span>
          </Link>
        ))}
      </nav>

      {/* Unc's core (ADR-081): tell verified shops what you need. */}
      <Link to={user ? '/requests/new' : '/register'} className="ask-shops">
        <Icon name="shop" size="1.6em" />
        <span className="ask-shops-text">
          <b>{t('Looking for something?')}</b>
          <span>{t('Post it once. Verified shops near you send offers.')}</span>
        </span>
        <span className="btn ok sm">{t('Post what you need')}</span>
      </Link>

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

// "Buy" → "Sell" → "Trade": the highlighted word slides up every 2.4 s
// (session 94). People who turned off animations see "Buy" only.
function RotatingWord({ words }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2400);
    return () => clearInterval(id);
  }, [words.length]);
  return <span className="tagline-mark rotator"><span key={i} className="rotator-word">{words[i]}</span></span>;
}

