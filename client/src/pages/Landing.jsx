// The visitors' home (session 77): the marketplace first. A short line
// about Unc, then search with category and area, then the open requests.
// Categories and verified shops come after, as ways in.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi, useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import { ListingCard } from '../components/ui.jsx';
import { CategoryPreview, ShopsPreview } from '../components/Showcase.jsx';
import CityField from '../components/CityField.jsx';
import Icon from '../components/Icon.jsx';

export default function Landing() {
  const { data } = useApi('/listings');
  const { categories } = useMeta();
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ q: '', category: '', city: '' });
  const latest = data?.listings ?? [];

  function search(e) {
    e.preventDefault();
    const p = new URLSearchParams(Object.entries(draft).filter(([, v]) => v));
    navigate(`/browse?${p}`);
  }

  return (
    <>
      <section className="market-intro">
        <div>
          <h1>{t('What Bahrain is looking for')}</h1>
          <p className="muted">{t('Buyers post what they need. Verified shops answer with offers.')}</p>
        </div>
        <Link className="btn" to="/register"><Icon name="plus" weight="bold" /> {t('Post what you need')}</Link>
      </section>
      <form className="searchbar" onSubmit={search}>
        <input type="search" enterKeyHint="search" placeholder={t('What are people looking for?')} value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label={t('Search')} />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} aria-label={t('Category')}>
          <option value="">{t('All categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
        <CityField governorates placeholder={t('City or governorate')} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-label={t('City')} />
        <button className="btn search-btn" aria-label={t('Search')}><Icon name="search" weight="bold" /><span className="search-label">{t('Search')}</span></button>
      </form>
      {latest.length > 0 && (
        <section className="latest">
          <div className="section-head">
            <h2>{t('Open requests')}</h2>
            <Link to="/browse">{t('All requests')} <span className="flip">→</span></Link>
          </div>
          <div className="grid">{latest.slice(0, 6).map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </section>
      )}
      <CategoryPreview />
      <ShopsPreview />
    </>
  );
}
