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
import { SECTION_ICON, SECTION_LABEL, SECTION_ORDER, SECTION_PATH } from '../sections.js';
import { AdCard, AdRow, SampleNote } from './AdList.jsx';

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
      <div className="market-top">
        <h1>{t('Marketplace')}</h1>
        <Link className="btn sm ok" to={postTo}><Icon name="plus" weight="bold" /> {t('Sell')}</Link>
      </div>
      <form className="market-search" onSubmit={search}>
        <Icon name="search" />
        <input type="search" enterKeyHint="search" placeholder={t('Search Unc')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
      </form>
      <nav className="chips" aria-label={t('Sections')}>
        {SECTION_ORDER.map((s) => (
          <Link key={s} className="chip" to={SECTION_PATH[s]}>
            <Icon name={SECTION_ICON[s]} /> {SECTION_LABEL[s]()}
            {data?.sections?.[s]?.total > 0 && <span className="chip-count">{data.sections[s].total}</span>}
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
