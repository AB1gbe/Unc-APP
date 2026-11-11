// All verified shops (session 72), with a search bar (name, area or what
// they sell, from their bio). Shops can't be messaged from here: they reply
// to requests, inside each request's chat.
import { useState } from 'react';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';
import { ShopCard } from '../components/Showcase.jsx';
import { CardsLoading } from '../components/ui.jsx';
import { StoriesStrip } from '../components/Stories.jsx';

export default function Shops() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, loading } = useApi(`/shops?limit=60${search ? `&q=${encodeURIComponent(search)}` : ''}`);
  return (
    <div className="stack">
      <h1>{t('Verified shops')}</h1>
      <p className="muted" style={{ marginTop: '-.6rem' }}>{t('Real businesses in Bahrain, checked by Unc. They answer requests with offers.')}</p>
      <form className="searchbar searchbar-simple" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }}>
        <input placeholder={t('Shop name, area or what they sell')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
        <button className="btn">{t('Search')}</button>
      </form>
      {loading ? <CardsLoading /> : data?.shops.length === 0
        ? <p className="muted">{t('No shops match that yet.')}</p>
        : <div className="shop-grid shop-grid-all">{data?.shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>}
      <div style={{ marginTop: '2rem' }}><StoriesStrip /></div>
    </div>
  );
}
