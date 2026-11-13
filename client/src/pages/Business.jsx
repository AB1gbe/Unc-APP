// The business panel (session 88, ADR-077), for business accounts.
// Dashboard: this week vs last week. Ads: every ad and request with its
// numbers. Billing: ad credit, packs, card, receipts. Team: staff who post
// and answer for the business (the owner only).
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ago, api, moneyExact } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, Loading, StatusBadge } from '../components/ui.jsx';
import { celebrate } from '../components/Celebrate.jsx';
import Icon from '../components/Icon.jsx';
import { useApi } from '../hooks.js';
import { formatDateTime, t, tn } from '../i18n.jsx';
import { toDate } from '../api.js';
import { SECTION_ICON, SECTION_LABEL } from '../sections.js';

const bd = (fils) => moneyExact(fils / 1000);
const TABS = ['dashboard', 'ads', 'billing', 'team'];

export default function Business() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const isOwner = !user.actor;
  const tabs = TABS.filter((x) => x !== 'team' || isOwner);
  const tab = tabs.includes(params.get('tab')) ? params.get('tab') : 'dashboard';
  const label = { dashboard: t('Dashboard'), ads: t('Ads'), billing: t('Billing'), team: t('Team') };
  return (
    <div className="stack">
      <div className="row spread">
        <div>
          <h1 style={{ margin: 0 }}>{t('Business panel')}</h1>
          <p className="muted small" style={{ margin: 0 }}><bdi>{user.displayName}</bdi></p>
        </div>
        <Link className="btn ok" to="/requests/new?section=forsale"><Icon name="plus" weight="bold" /> {t('Post an ad')}</Link>
      </div>
      <nav className="chips" aria-label={t('Business panel')}>
        {tabs.map((x) => <button key={x} type="button" className={`chip ${tab === x ? 'on' : ''}`} onClick={() => setParams({ tab: x })}>{label[x]}</button>)}
      </nav>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'ads' && <Ads />}
      {tab === 'billing' && <Billing isOwner={isOwner} />}
      {tab === 'team' && isOwner && <Team />}
    </div>
  );
}

// A number with its change from last week: green up, red down.
function Stat({ label, now, before }) {
  const diff = now - before;
  return (
    <div className="card stat">
      <div className="muted small">{label}</div>
      <div className="stat-n">{now}</div>
      <div className={`small ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'muted'}`}>
        {diff > 0 ? `▲ ${diff}` : diff < 0 ? `▼ ${-diff}` : '–'} <span className="muted">{t('vs last week')}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, loading, error } = useApi('/business/dashboard');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { thisWeek: a, lastWeek: b } = data;
  return (
    <>
      <div className="stats-grid">
        <Stat label={t('People who looked at your ads')} now={a.views} before={b.views} />
        <Stat label={t('Replies to your ads')} now={a.replies} before={b.replies} />
        <Stat label={t('Offers you sent')} now={a.offersSent} before={b.offersSent} />
        <Stat label={t('Ads posted')} now={a.adsPosted} before={b.adsPosted} />
      </div>
      <div className="stats-grid">
        <Link to="/business?tab=ads" className="card stat link-card"><div className="muted small">{t('Open ads')}</div><div className="stat-n">{data.openAds}</div></Link>
        <Link to="/messages" className="card stat link-card"><div className="muted small">{t('Unread messages')}</div><div className="stat-n">{data.unread}</div></Link>
        <Link to="/business?tab=billing" className="card stat link-card"><div className="muted small">{t('Ad credit')}</div><div className="stat-n">{bd(data.credit)}</div></Link>
      </div>
    </>
  );
}

function Ads() {
  const { data, loading, error } = useApi('/business/ads');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (data.ads.length === 0) return <p className="muted">{t('No ads here yet.')} <Link to="/requests/new?section=forsale">{t('Post the first one')}</Link></p>;
  return (
    <ul className="ad-list biz-ads">
      {data.ads.map((a) => (
        <li key={a.id}>
          <Link to={`/requests/${a.id}`} className="ad-row">
            <span className="ad-thumb">{a.photoUrl ? <img src={a.photoUrl} alt="" loading="lazy" /> : <Icon name={SECTION_ICON[a.section]} size="1.4em" />}</span>
            <span className="ad-main">
              <span className="ad-title"><bdi>{a.title}</bdi></span>
              <span className="ad-meta">
                {SECTION_LABEL[a.section]()} · <Icon name="eye" /> {a.views} · <Icon name="chat" /> {tn(a.replies, '{n} reply', '{n} replies')} · {ago(a.createdAt)}
                {a.postedBy && <> · {t('by {name}', { name: a.postedBy })}</>}
              </span>
            </span>
            {a.held ? <span className="badge warn">{t('Being checked')}</span> : <StatusBadge status={a.status} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Billing({ isOwner }) {
  const { data, loading, error, reload } = useApi('/business/billing');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  async function buy(pack) {
    if (!window.confirm(t('Pay {price} with your card ending {last4}?', { price: bd(pack.price), last4: data.card?.last4 ?? '' }))) return;
    setBusy(pack.id); setErr(null);
    try {
      await api('/business/billing/packs', { method: 'POST', body: { pack: pack.id } });
      celebrate({ text: t('Ad credit added') });
      reload();
    } catch (e) { setErr(e); } finally { setBusy(null); }
  }
  return (
    <>
      <div className="card">
        <div className="row spread">
          <div><div className="muted small">{t('Ad credit')}</div><div className="stat-n">{bd(data.credit)}</div></div>
          {data.card && <div className="muted small"><Icon name="card" /> {t('Card ending {last4}', { last4: data.card.last4 })}</div>}
        </div>
        <p className="muted small">{t('People post for free. Businesses pay per ad: For sale {forsale}, Housing {housing}, Jobs {jobs}. Wanted requests and offers are free. Ads are paid from your credit first, then your card.', { forsale: bd(data.prices.forsale), housing: bd(data.prices.housing), jobs: bd(data.prices.jobs) })}</p>
      </div>
      <h2>{t('Buy ad credit')}</h2>
      <ErrorBox error={err} />
      <div className="packs">
        {data.packs.map((p) => (
          <div key={p.id} className="card pack">
            <div className="stat-n">{bd(p.credit)}</div>
            <div className="muted small">{t('of ad credit for {price}', { price: bd(p.price) })}</div>
            <div className="badge ok">{t('{bonus} free', { bonus: bd(p.credit - p.price) })}</div>
            {isOwner
              ? <button type="button" className="btn ok block" disabled={busy === p.id || !data.card} onClick={() => buy(p)}>{busy === p.id ? t('Paying…') : t('Buy for {price}', { price: bd(p.price) })}</button>
              : <p className="muted small">{t('Only the business owner can buy credit.')}</p>}
          </div>
        ))}
      </div>
      <h2>{t('Payments and receipts')}</h2>
      {data.payments.length === 0 ? <p className="muted">{t('No payments yet.')}</p> : (
        <div className="table-scroll"><table>
          <thead><tr><th>{t('Date')}</th><th>{t('For')}</th><th>{t('Amount')}</th><th>{t('Receipt')}</th></tr></thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDateTime(toDate(p.createdAt))}</td>
                <td>{p.kind === 'pack' ? t('Ad credit {credit}', { credit: bd(p.credit) }) : <bdi>{p.listingTitle ?? t('Ad')}</bdi>}</td>
                <td>{bd(p.amount)}</td>
                <td><Link to={`/business/receipts/${p.id}`}>{p.receiptNo}</Link></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}

function Team() {
  const { data, loading, error, reload } = useApi('/business/team');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const run = (fn) => async (e) => { e?.preventDefault(); setErr(null); try { await fn(); reload(); } catch (x) { setErr(x); } };
  return (
    <>
      <p className="muted">{t('Team members post ads and answer customers for the business, using their own login. They can’t buy credit, change the card or manage the team.')}</p>
      <ErrorBox error={err} />
      <form className="row" onSubmit={run(async () => { await api('/business/team/invites', { method: 'POST', body: { email } }); setEmail(''); })}>
        <input type="email" required placeholder={t('Email of the person to add')} value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 0 }} aria-label={t('Email')} />
        <button className="btn ok">{t('Invite')}</button>
      </form>
      <div className="card" style={{ padding: 0 }}>
        {data.members.length === 0 && data.invites.length === 0 && <p className="muted" style={{ padding: '1rem' }}>{t('No team members yet.')}</p>}
        {data.members.map((m) => (
          <div key={m.id} className="inbox-item">
            <span style={{ flex: 1 }}><b><bdi>{m.displayName}</bdi></b><div className="muted small ltr">{m.email}</div></span>
            <button type="button" className="btn sm danger-outline" onClick={run(() => window.confirm(t('Remove {name} from the team?', { name: m.displayName })) && api(`/business/team/members/${m.id}`, { method: 'DELETE' }))}>{t('Remove')}</button>
          </div>
        ))}
        {data.invites.map((i) => (
          <div key={i.id} className="inbox-item">
            <span style={{ flex: 1 }}><span className="ltr">{i.email}</span><div className="muted small">{t('Invited, waiting to accept')}</div></span>
            <button type="button" className="btn sm danger-outline" onClick={run(() => api(`/business/team/invites/${i.id}`, { method: 'DELETE' }))}>{t('Cancel invite')}</button>
          </div>
        ))}
      </div>
      <p className="muted small">{tn(data.members.length + data.invites.length, '{n} of {max} places used', '{n} of {max} places used', { max: data.max })}</p>
    </>
  );
}

// A printable receipt (for the business's accountant).
export function Receipt() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/business/billing/receipts/${id}`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const r = data.receipt;
  return (
    <div className="narrow card receipt">
      <div className="row spread">
        <h1 style={{ margin: 0 }}>{t('Receipt')}</h1>
        <button type="button" className="btn secondary sm no-print" onClick={() => window.print()}>{t('Print')}</button>
      </div>
      <p className="muted ltr">{r.receiptNo}</p>
      <table><tbody>
        <tr><th>{t('Date')}</th><td>{formatDateTime(toDate(r.createdAt))}</td></tr>
        <tr><th>{t('Billed to')}</th><td><bdi>{r.business.name}</bdi>{r.business.cr && <div className="muted small">{t('CR {cr}', { cr: r.business.cr })}</div>}</td></tr>
        <tr><th>{t('For')}</th><td>{r.kind === 'pack' ? t('Ad credit {credit}', { credit: bd(r.credit) }) : <bdi>{r.listingTitle ?? t('Ad')}</bdi>}</td></tr>
        {r.paidBy && <tr><th>{t('Posted by')}</th><td><bdi>{r.paidBy}</bdi></td></tr>}
        <tr><th>{t('Paid with')}</th><td className="ltr">{(r.card.brand || '').toUpperCase()} •••• {r.card.last4}</td></tr>
        <tr><th>{t('Amount')}</th><td><b>{bd(r.amount)}</b></td></tr>
      </tbody></table>
      {r.test && <p className="muted small">{t('Unc test site: no real money was taken.')}</p>}
      <Link className="no-print" to="/business?tab=billing">{t('Back to billing')}</Link>
    </div>
  );
}
