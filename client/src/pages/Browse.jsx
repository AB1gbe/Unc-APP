import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, ListingCard, CardsLoading, Loading } from '../components/ui.jsx';
import { useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import { StoriesStrip } from '../components/Stories.jsx';
import Feed from '../components/Feed.jsx';
import CityField from '../components/CityField.jsx';

export default function Browse() {
  const { user } = useAuth();
  const { categories } = useMeta();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState({ q: params.get('q') || '', city: params.get('city') || '', category: params.get('category') || '' });
  const [result, setResult] = useState({ listings: [], hasMore: false, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api(`/listings?${params.toString()}`)
      .then((r) => { setResult(r); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [params]);

  function search(e) {
    e.preventDefault();
    const next = {};
    Object.entries(draft).forEach(([k, v]) => v && (next[k] = v));
    setParams(next);
  }

  const page = Number(params.get('page') || 1);
  const goPage = (p) => { const n = new URLSearchParams(params); n.set('page', p); setParams(n); };

  return (
    <>
      {!user && (
        <section className="hero">
          <h1>{t('Tell people what you want. Let them come to you.')}</h1>
          <p>{t('Post a request for anything — a used phone, a sofa, a hard-to-find part. Verified shops and finders contact you privately with offers.')}</p>
          <Link className="btn" to="/register">{t('Post your first request')}</Link>
        </section>
      )}
      {!user && <div style={{ marginBottom: '1.5rem' }}><StoriesStrip /></div>}
      {!user && <div style={{ marginBottom: '1.5rem' }}><Feed title={t('Happening on Unc')} /></div>}
      <form className="searchbar" onSubmit={search}>
        <input placeholder={t('What are people looking for?')} value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label={t('Search')} />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} aria-label={t('Category')}>
          <option value="">{t('All categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
        <CityField governorates placeholder={t('City or governorate')} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} aria-label={t('City')} />
        <button className="btn">{t('Search')}</button>
      </form>
      <ErrorBox error={error} />
      {user && (
        <p className="small" style={{ marginTop: 0 }}>
          <Link to={`/alerts?${new URLSearchParams(Object.fromEntries(Object.entries(draft).filter(([, v]) => v)))}`}>
            {t('🔔 Alert me about new requests like these')}
          </Link>
          {' · '}<Link to="/demand">{t('📊 What people are asking for')}</Link>
        </p>
      )}
      {loading ? <CardsLoading /> : result.listings.length === 0 ? (
        <div className="card empty">
          <p>{t("Nobody's asked for that yet. Looking for it yourself? Post it and let sellers come to you.")}</p>
          {user && <Link className="btn" to="/requests/new">{t('Post a request')}</Link>}
        </div>
      ) : (
        <div className="grid">
          {result.listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
      {(page > 1 || result.hasMore) && (
        <div className="row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="btn secondary" disabled={page <= 1} onClick={() => goPage(page - 1)}><span className="flip">←</span> {t('Newer')}</button>
          <span className="muted">{t('Page {page}', { page })}</span>
          <button className="btn secondary" disabled={!result.hasMore} onClick={() => goPage(page + 1)}>{t('Older')} <span className="flip">→</span></button>
        </div>
      )}
    </>
  );
}
