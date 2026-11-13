// The front page (session 82), modelled on Craigslist: one search box, the
// sections as columns of category links with how many ads each has, and
// the newest ads of each section as plain lines. Shops come after.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useApi, useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import { Loading } from '../components/ui.jsx';
import { ShopsPreview } from '../components/Showcase.jsx';
import Icon from '../components/Icon.jsx';
import { SECTION_LABEL, SECTION_ORDER, SECTION_PATH } from '../sections.js';
import { AdRow, SampleNote } from './AdList.jsx';

export default function Board() {
  const { user } = useAuth();
  const meta = useMeta();
  const { data, loading } = useApi('/listings/sections');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [section, setSection] = useState('forsale');
  const cats = (s) => (s === 'wanted' ? meta.categories : meta.sections?.[s] ?? []);
  const count = (s, c) => data?.sections?.[s]?.categories?.[c] ?? 0;
  const link = (s, c) => `${SECTION_PATH[s]}${c ? `?category=${encodeURIComponent(c)}` : ''}`;
  const postTo = (s) => (user ? `/requests/new${s === 'wanted' ? '' : `?section=${s}`}` : '/register');

  function search(e) {
    e.preventDefault();
    navigate(`${SECTION_PATH[section]}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }

  return (
    <>
      <section className="board-intro">
        <div>
          <h1>{t('Bahrain’s classifieds, with ID-checked people')}</h1>
          <p className="muted">{t('Things for sale, housing, jobs and things people want. Free to post. Every poster is ID-checked and replies stay in a private chat.')}</p>
        </div>
        <Link className="btn" to={user ? '/requests/new?section=forsale' : '/register'}><Icon name="plus" weight="bold" /> {t('Post an ad')}</Link>
      </section>
      <form className="searchbar board-search" onSubmit={search}>
        <input type="search" enterKeyHint="search" placeholder={t('Search Unc')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search')} />
        <select value={section} onChange={(e) => setSection(e.target.value)} aria-label={t('Section')}>
          {SECTION_ORDER.map((s) => <option key={s} value={s}>{SECTION_LABEL[s]()}</option>)}
        </select>
        <button className="btn search-btn" aria-label={t('Search')}><Icon name="search" weight="bold" /><span className="search-label">{t('Search')}</span></button>
      </form>

      <div className="board-cols">
        {SECTION_ORDER.map((s) => (
          <section key={s} className="board-col">
            <h2><Link to={SECTION_PATH[s]}>{SECTION_LABEL[s]()}</Link> <span className="muted small">{data?.sections?.[s]?.total ?? ''}</span></h2>
            <ul className="board-cats">
              {cats(s).map((c) => (
                <li key={c}><Link to={link(s, c)}>{t(c)}</Link>{count(s, c) > 0 && <span className="muted small"> {count(s, c)}</span>}</li>
              ))}
            </ul>
            <Link className="board-post small" to={postTo(s)}>{s === 'wanted' ? t('+ Post what you need') : t('+ Post an ad here')}</Link>
          </section>
        ))}
      </div>

      <SampleNote listings={Object.values(data?.latest ?? {}).flat()} />
      <div className="board-latest">
        {SECTION_ORDER.map((s) => (
          <section key={s}>
            <div className="section-head">
              <h2>{{ forsale: () => t('Newest for sale'), housing: () => t('Newest housing'), jobs: () => t('Newest jobs'), wanted: () => t('Newest wanted') }[s]()}</h2>
              <Link to={SECTION_PATH[s]}>{t('See all')} <span className="flip">→</span></Link>
            </div>
            {loading ? <Loading /> : (data?.latest?.[s] ?? []).length === 0
              ? <p className="muted small">{t('No ads here yet.')}</p>
              : <ul className="ad-list">{data.latest[s].slice(0, 5).map((l) => <AdRow key={l.id} listing={l} />)}</ul>}
          </section>
        ))}
      </div>

      <div className="safety-strip">
        <div><Icon name="admin" /> <b>{t('ID-checked posters')}</b><span className="muted small">{t('Everyone who posts or replies has passed an ID check.')}</span></div>
        <div><Icon name="chat" /> <b>{t('Private chat only')}</b><span className="muted small">{t('Numbers and emails stay hidden; you talk inside the ad.')}</span></div>
        <div><Icon name="warning" /> <b>{t('Scam checks')}</b><span className="muted small">{t('Ads asking for money up front are blocked; doubtful ones are checked by a person.')}</span></div>
      </div>
      <ShopsPreview />
    </>
  );
}
