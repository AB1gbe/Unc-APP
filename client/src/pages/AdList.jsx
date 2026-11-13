// Housing and Jobs (session 82): Craigslist-style lists. One line per ad
// (date, title, price, area), dense and fast to scan, with the filters
// that matter for the section. Replies go to the ad's private chat.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ago, api, money } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';
import CityField, { Place } from '../components/CityField.jsx';
import Icon from '../components/Icon.jsx';
import { useMeta } from '../hooks.js';
import { t, tn } from '../i18n.jsx';
import { JOB_TYPE_LABEL, SECTION_LABEL, adPrice } from '../sections.js';

const FIELDS = ['q', 'city', 'category', 'min', 'max', 'bedrooms', 'furnished', 'jobType'];

// One ad as a Craigslist-style line.
export function AdRow({ listing: l }) {
  const price = adPrice(l, money);
  const facts = [
    l.section === 'housing' && l.bedrooms != null ? (l.bedrooms === 0 ? t('Studio') : tn(l.bedrooms, '{n} bedroom', '{n} bedrooms')) : null,
    l.section === 'housing' && l.furnished != null ? (l.furnished ? t('Furnished') : t('Unfurnished')) : null,
    l.section === 'jobs' && l.jobType ? JOB_TYPE_LABEL[l.jobType]?.() : null,
  ].filter(Boolean);
  return (
    <li>
      <Link to={`/requests/${l.id}`} className="ad-row">
        <span className="ad-date muted small">{ago(l.createdAt)}</span>
        <span className="ad-main">
          <span className="ad-title"><bdi>{l.title}</bdi>{l.images?.length > 0 && <Icon name="camera" size="0.95em" />}</span>
          <span className="ad-meta small muted">
            {price && <b className="ad-price">{price}</b>}
            {facts.map((f) => <span key={f}>{f}</span>)}
            <span><Place city={l.city} /></span>
            {l.sample && <span className="badge">{t('Sample')}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function AdList({ section }) {
  const { user } = useAuth();
  const meta = useMeta();
  const categories = meta.sections?.[section] ?? [];
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(Object.fromEntries(FIELDS.map((k) => [k, params.get(k) || ''])));
  const [result, setResult] = useState({ listings: [], hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(Object.fromEntries(FIELDS.map((k) => [k, params.get(k) || ''])));
    setLoading(true);
    const q = new URLSearchParams(params);
    q.set('section', section);
    api(`/listings?${q}`).then((r) => { setResult(r); setError(null); }).catch(setError).finally(() => setLoading(false));
  }, [params, section]);

  function apply(e) {
    e?.preventDefault();
    const next = {};
    Object.entries(draft).forEach(([k, v]) => v && (next[k] = v));
    setParams(next);
  }
  const page = Number(params.get('page') || 1);
  const goPage = (p) => { const n = new URLSearchParams(params); n.set('page', p); setParams(n); };
  const field = (k) => ({ value: draft[k], onChange: (e) => setDraft({ ...draft, [k]: e.target.value }) });
  const postTo = user ? `/requests/new?section=${section}` : '/register';

  return (
    <>
      <div className="page-head row spread">
        <div>
          <h1>{SECTION_LABEL[section]()}</h1>
          <p className="muted">{section === 'housing'
            ? t('Flats, rooms and villas for rent in Bahrain. Every advertiser is ID-checked; reply in a private chat.')
            : t('Jobs in Bahrain from ID-checked employers. Apply in a private chat; never pay to get a job.')}</p>
        </div>
        <Link className="btn" to={postTo}><Icon name="plus" weight="bold" /> {t('Post an ad')}</Link>
      </div>
      <form className="searchbar" onSubmit={apply}>
        <input type="search" enterKeyHint="search" placeholder={section === 'housing' ? t('Search flats, rooms, villas') : t('Search jobs')} {...field('q')} aria-label={t('Search')} />
        <select {...field('category')} aria-label={t('Category')}>
          <option value="">{t('All categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
        <CityField governorates placeholder={t('City or governorate')} {...field('city')} aria-label={t('City')} />
        <button className="btn search-btn" aria-label={t('Search')}><Icon name="search" weight="bold" /><span className="search-label">{t('Search')}</span></button>
        <details className="more-filters" open={['min', 'max', 'bedrooms', 'furnished', 'jobType'].some((k) => params.get(k)) || undefined}>
          <summary>{t('More filters')}</summary>
          <div className="more-filters-body">
            <label>{section === 'housing' ? t('Rent from') : t('Pay from')}<input type="number" min="0" inputMode="numeric" {...field('min')} /></label>
            <label>{section === 'housing' ? t('Rent to') : t('Pay to')}<input type="number" min="0" inputMode="numeric" {...field('max')} /></label>
            {section === 'housing' && <>
              <label>{t('Bedrooms')}<select {...field('bedrooms')}>
                <option value="">{t('Any')}</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
              </select></label>
              <label>{t('Furnished')}<select {...field('furnished')}>
                <option value="">{t('Any')}</option><option value="yes">{t('Furnished')}</option><option value="no">{t('Unfurnished')}</option>
              </select></label>
            </>}
            {section === 'jobs' && (
              <label>{t('Job type')}<select {...field('jobType')}>
                <option value="">{t('Any')}</option>
                {(meta.jobTypes ?? []).map((j) => <option key={j} value={j}>{JOB_TYPE_LABEL[j]?.() ?? j}</option>)}
              </select></label>
            )}
            <div className="more-filters-actions"><button className="btn sm">{t('Apply')}</button></div>
          </div>
        </details>
      </form>
      <div className="safety-line small"><Icon name="lock" /> {section === 'housing'
        ? t('Never pay a deposit before you have seen the place and met the owner.')
        : t('Real employers never ask you to pay for a visa, training or a uniform.')}</div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : result.listings.length === 0 ? (
        <p className="muted empty-line">{t('No ads here yet.')} <Link to={postTo}>{t('Post the first one')}</Link></p>
      ) : (
        <ul className="ad-list">{result.listings.map((l) => <AdRow key={l.id} listing={l} />)}</ul>
      )}
      {(page > 1 || result.hasMore) && (
        <div className="row pager">
          {page > 1 && <button className="btn secondary sm" onClick={() => goPage(page - 1)}>{t('Previous')}</button>}
          {result.hasMore && <button className="btn secondary sm" onClick={() => goPage(page + 1)}>{t('Next')}</button>}
        </div>
      )}
    </>
  );
}
