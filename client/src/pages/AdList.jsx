// Housing, Jobs and (session 84) For sale: Craigslist-style lists. One line per ad
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
import { JOB_TYPE_LABEL, SECTION_ICON, SECTION_LABEL, adPrice } from '../sections.js';

const FIELDS = ['q', 'city', 'category', 'min', 'max', 'bedrooms', 'furnished', 'jobType', 'condition'];

// One ad as a calm row (session 84, after "the listings look too
// hectic"): a small photo (or the section's icon), the title in plain
// text (two lines at most), the price, and ONE quiet line of facts:
// "Juffair · 2 bedrooms · yesterday". No per-row badges; demo ads get a
// single note above the list instead (SampleNote).
export function AdRow({ listing: l }) {
  const price = adPrice(l, money);
  const section = l.section ?? 'wanted';
  const facts = [
    <Place key="p" city={l.city} />,
    section === 'housing' && l.bedrooms != null ? (l.bedrooms === 0 ? t('Studio') : tn(l.bedrooms, '{n} bedroom', '{n} bedrooms')) : null,
    section === 'housing' && l.furnished ? t('Furnished') : null,
    section === 'jobs' && l.jobType ? JOB_TYPE_LABEL[l.jobType]?.() : null,
    section === 'forsale' && l.condition !== 'any' ? (l.condition === 'new' ? t('New') : t('Used')) : null,
    ago(l.createdAt),
  ].filter(Boolean);
  return (
    <li>
      <Link to={`/requests/${l.id}`} className="ad-row">
        <span className="ad-thumb">
          {l.images?.length > 0 ? <img src={l.images[0]} alt="" loading="lazy" /> : <Icon name={SECTION_ICON[section]} size="1.4em" />}
        </span>
        <span className="ad-main">
          <span className="ad-title"><bdi>{l.title}</bdi></span>
          {price && <span className="ad-price">{price}</span>}
          <span className="ad-meta">{facts.map((f, i) => <span key={i}>{i > 0 && <span className="dot"> · </span>}{f}</span>)}</span>
        </span>
      </Link>
    </li>
  );
}

// A photo card for the grid (session 85, inspired by Facebook Marketplace):
// a big square photo, the price in bold, the title on one or two lines,
// and the area. Wanted requests say "Looking for" above their budget.
export function AdCard({ listing: l }) {
  const section = l.section ?? 'wanted';
  const price = adPrice(l, money);
  return (
    <li>
      <Link to={`/requests/${l.id}`} className="ad-card">
        <span className="ad-card-photo">
          {l.images?.length > 0 ? <img src={l.images[0]} alt="" loading="lazy" /> : <Icon name={SECTION_ICON[section]} size="2.2em" />}
          {section === 'wanted' && <span className="ad-card-tag">{t('Looking for')}</span>}
        </span>
        {price && <span className="ad-card-price">{price}</span>}
        <span className="ad-card-title"><bdi>{l.title}</bdi></span>
        <span className="ad-card-place"><Place city={l.city} /></span>
      </Link>
    </li>
  );
}

// One line above a list that has demo ads, instead of a badge on each row.
export function SampleNote({ listings }) {
  if (!listings?.some((l) => l.sample)) return null;
  return <p className="sample-line small muted">{t('Some ads here are samples from the demo data.')}</p>;
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
          <p className="muted">{{
            housing: () => t('Flats, rooms and villas for rent in Bahrain. Every advertiser is ID-checked; reply in a private chat.'),
            jobs: () => t('Jobs in Bahrain from ID-checked employers. Apply in a private chat; never pay to get a job.'),
            forsale: () => t('Things for sale in Bahrain from ID-checked people and shops. Ask in a private chat; meet to see it before you pay.'),
          }[section]()}</p>
        </div>
        <Link className="btn accent" to={postTo}><Icon name="plus" weight="bold" /> {t('Post an ad')}</Link>
      </div>
      <form className="searchbar" onSubmit={apply}>
        <input type="search" enterKeyHint="search" placeholder={section === 'housing' ? t('Search flats, rooms, villas') : section === 'jobs' ? t('Search jobs') : t('Search things for sale')} {...field('q')} aria-label={t('Search')} />
        <select {...field('category')} aria-label={t('Category')}>
          <option value="">{t('All categories')}</option>
          {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
        <CityField governorates placeholder={t('City or governorate')} {...field('city')} aria-label={t('City')} />
        <button className="btn search-btn" aria-label={t('Search')}><Icon name="search" weight="bold" /><span className="search-label">{t('Search')}</span></button>
        <details className="more-filters" open={['min', 'max', 'bedrooms', 'furnished', 'jobType', 'condition'].some((k) => params.get(k)) || undefined}>
          <summary>{t('More filters')}</summary>
          <div className="more-filters-body">
            <label>{section === 'housing' ? t('Rent from') : section === 'jobs' ? t('Pay from') : t('Price from')}<input type="number" min="0" inputMode="numeric" {...field('min')} /></label>
            <label>{section === 'housing' ? t('Rent to') : section === 'jobs' ? t('Pay to') : t('Price to')}<input type="number" min="0" inputMode="numeric" {...field('max')} /></label>
            {section === 'forsale' && (
              <label>{t('Condition')}<select {...field('condition')}>
                <option value="">{t('Any')}</option><option value="new">{t('New')}</option><option value="used">{t('Used')}</option>
              </select></label>
            )}
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
      {/* Category chips (session 85), one tap to filter. */}
      <div className="chips" role="list">
        {['', ...categories].map((c) => (
          <button key={c || 'all'} type="button" role="listitem" className={`chip ${(params.get('category') || '') === c ? 'on' : ''}`}
            onClick={() => { const n = new URLSearchParams(params); if (c) n.set('category', c); else n.delete('category'); n.delete('page'); setParams(n); }}>
            {c ? t(c) : t('All')}
          </button>
        ))}
      </div>
      <div className="safety-line small"><Icon name="lock" /> {{
        housing: () => t('Never pay a deposit before you have seen the place and met the owner.'),
        jobs: () => t('Real employers never ask you to pay for a visa, training or a uniform.'),
        forsale: () => t('Meet in a public place and check the item before you pay.'),
      }[section]()}</div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : result.listings.length === 0 ? (
        <p className="muted empty-line">{t('No ads here yet.')} <Link to={postTo}>{t('Post the first one')}</Link></p>
      ) : (
        <>
          <SampleNote listings={result.listings} />
          {/* Things with photos (For sale, Housing) as a photo grid; jobs as rows. */}
          {section === 'jobs'
            ? <ul className="ad-list">{result.listings.map((l) => <AdRow key={l.id} listing={l} />)}</ul>
            : <ul className="ad-grid">{result.listings.map((l) => <AdCard key={l.id} listing={l} />)}</ul>}
        </>
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
