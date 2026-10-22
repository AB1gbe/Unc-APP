// The owner dashboard (session 37): is the marketplace working? Number
// tiles for the headline figures, then one bar chart per measure (one
// colour each, so no legend is needed), with values on hover/focus and a
// table view. Data: GET /api/admin/metrics?days=7|30|90.
import { useState } from 'react';
import { ErrorBox, Loading } from '../../components/ui.jsx';
import { useApi } from '../../hooks.js';
import { formatDate, t, tn } from '../../i18n.jsx';
import { toDate } from '../../api.js';

const AREA = { Capital: () => t('Capital'), Muharraq: () => t('Muharraq'), Northern: () => t('Northern'), Southern: () => t('Southern'), Other: () => t('Other') };

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useApi(`/admin/metrics?days=${days}`);

  return (
    <section className="card dashboard">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{t('How the marketplace is doing')}</h2>
        <div className="row" style={{ gap: '.4rem' }} role="group" aria-label={t('Time range')}>
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" className={`btn sm ${days === d ? '' : 'secondary'}`} aria-pressed={days === d} onClick={() => setDays(d)}>
              {t('{n} days', { n: d })}
            </button>
          ))}
        </div>
      </div>
      <ErrorBox error={error} />
      {loading || !data ? <Loading /> : (
        <>
          <div className="stat-tiles">
            <Stat label={t('Requests posted')} value={data.totals.requests} />
            <Stat label={t('Offers made')} value={data.totals.offers} />
            <Stat label={t('Deals done')} value={data.totals.deals} />
            <Stat label={t('New members')} value={data.totals.members} />
            <Stat label={t('Requests with an offer')} value={data.answeredShare == null ? '—' : `${data.answeredShare}%`} hint={t('Of requests at least a day old')} />
            <Stat label={t('Time to first offer')} value={data.firstOfferHours == null ? '—' : data.firstOfferHours < 1 ? t('Under an hour') : tn(Math.round(data.firstOfferHours), '{n} hour', '{n} hours')} hint={t('Half of offers come faster than this')} />
          </div>
          <div className="chart-grid">
            <DayBars title={t('Requests per day')} rows={data.daily} k="requests" />
            <DayBars title={t('Offers per day')} rows={data.daily} k="offers" />
          </div>
          <div className="chart-grid">
            <ListBars title={t('Top categories')} rows={data.categories.map((c) => ({ label: t(c.name), n: c.n }))} />
            <ListBars title={t('Requests by governorate')} rows={data.areas.map((a) => ({ label: (AREA[a.name] ?? (() => a.name))(), n: a.n }))} />
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="stat-tile">
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  );
}

// Vertical bars, one per day. The whole column is the hover/focus target.
function DayBars({ title, rows, k }) {
  const max = Math.max(1, ...rows.map((r) => r[k]));
  const day = (d) => formatDate(toDate(d), { day: 'numeric', month: 'short' });
  return (
    <figure className="chart">
      <figcaption><b>{title}</b> <span className="muted small">{t('most in a day: {n}', { n: max })}</span></figcaption>
      <div className="day-bars" style={{ '--count': rows.length }}>
        {rows.map((r) => (
          <div key={r.day} className="day-col" tabIndex={0} aria-label={`${day(r.day)}: ${r[k]}`}>
            <div className="day-bar" style={{ height: `${(r[k] / max) * 100}%` }} />
            <span className="bar-tip" role="tooltip">{day(r.day)} · <b>{r[k]}</b></span>
          </div>
        ))}
      </div>
      <div className="day-axis muted small"><span>{day(rows[0].day)}</span><span>{day(rows.at(-1).day)}</span></div>
      <details className="small">
        <summary>{t('Show as a table')}</summary>
        <div className="table-scroll"><table>
          <thead><tr><th>{t('Day')}</th><th>{title}</th></tr></thead>
          <tbody>{rows.filter((r) => r[k] > 0).map((r) => <tr key={r.day}><td>{day(r.day)}</td><td>{r[k]}</td></tr>)}</tbody>
        </table></div>
      </details>
    </figure>
  );
}

// Horizontal bars with the label and number in text colour beside them.
function ListBars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <figure className="chart">
      <figcaption><b>{title}</b></figcaption>
      {rows.length === 0 ? <p className="muted small">{t('Nothing yet.')}</p> : (
        <div className="list-bars">
          {rows.map((r) => (
            <div key={r.label} className="list-row">
              <span className="list-label">{r.label}</span>
              <span className="list-track"><span className="list-bar" style={{ width: `${(r.n / max) * 100}%` }} /></span>
              <span className="list-n">{r.n}</span>
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}
