// "What people are asking for" (session 34): for sellers, which categories
// have the most requests still waiting for an offer, and the words buyers
// use. Counts only, never names. Helps a shop decide what to stock.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { currentLang, t, tn } from '../i18n.jsx';
import { GOVERNORATES } from '../../../shared/areas.js';

export default function Demand() {
  const [area, setArea] = useState('');
  const { data, error, loading } = useApi(`/demand${area ? `?area=${area}` : ''}`);
  const lang = currentLang();

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <h1>{t('What people are asking for')}</h1>
      <p className="muted">{t('Open requests from the last 30 days, by category, with the ones still waiting for an offer first. Counts only: no names.')}</p>
      <label className="compare-sort" style={{ marginBottom: '1rem' }}>
        {t('Area')}
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t('All of Bahrain')}</option>
          {GOVERNORATES.map((g) => <option key={g.key} value={g.key}>{lang === 'ar' ? g.ar : g.en}</option>)}
        </select>
      </label>
      <ErrorBox error={error} />
      {loading ? <Loading /> : data.categories.length === 0 ? (
        <div className="card empty">{t('Not enough requests here yet. Check back soon.')}</div>
      ) : (
        <div className="stack demand">
          {data.categories.map((c) => (
            <div key={c.category} className="card demand-row">
              <div className="row spread">
                <span className="badge">{t(c.category)}</span>
                <Link to={`/browse?category=${encodeURIComponent(c.category)}`}>{t('See them')} <span className="flip">→</span></Link>
              </div>
              <p style={{ margin: '.5rem 0 0' }}>
                <b>{tn(c.requests, '{n} request', '{n} requests')}</b>
                {c.waiting > 0 && <> · <span className="expiry-soon">{tn(c.waiting, '{n} still waiting for an offer', '{n} still waiting for an offer')}</span></>}
              </p>
              {c.words.length > 0 && (
                <p className="small muted" style={{ margin: '.35rem 0 0' }}>
                  {t('Often asked for:')} {c.words.map((w) => <span key={w} className="chip"><bdi>{w}</bdi></span>)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="small" style={{ marginTop: '1rem' }}><Link to="/alerts">{t('🔔 Get an alert when a matching request is posted')}</Link></p>
    </div>
  );
}
