import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toDate } from '../../api.js';
import { ErrorBox, Loading } from '../../components/ui.jsx';
import { useApi } from '../../hooks.js';
import { ACCOUNT_TYPE, ID_TYPE, KYC_STATUS, label } from '../../kycReasons.js';
import { formatDateTime, t, tj } from '../../i18n.jsx';

export default function AdminHome() {
  const stats = useApi('/admin/stats');
  const [status, setStatus] = useState('pending');
  const kyc = useApi(`/admin/kyc?status=${status}`);
  const reports = useApi('/admin/reports');

  return (
    <div className="stack">
      <h1>{t('Admin')}</h1>
      {stats.data && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {[[t('Users'), 'users'], [t('Pending KYC'), 'pendingKyc'], [t('Open requests'), 'openListings'], [t('Conversations'), 'conversations'], [t('Open reports'), 'openReports']].map(([label, k]) => (
            <div key={k} className="card"><div className="muted small">{label}</div><div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats.data[k]}</div></div>
          ))}
        </div>
      )}

      <section className="card">
        <div className="row spread">
          <h2>{t('Identity verification')}</h2>
          <div className="row" style={{ gap: '.4rem' }}>
            {['pending', 'approved', 'rejected'].map((s) => (
              <button key={s} className={`btn sm ${status === s ? '' : 'secondary'}`} onClick={() => setStatus(s)}>{label(KYC_STATUS, s)}</button>
            ))}
          </div>
        </div>
        {kyc.loading ? <Loading /> : kyc.data?.submissions.length === 0 ? <p className="muted">{t('Nothing here.')}</p> : (
          <div className="table-scroll"><table>
            <thead><tr><th>{t('Submitted')}</th><th>{t('Legal name')}</th><th>{t('Account')}</th><th>{t('Type')}</th><th>{t('ID')}</th><th></th></tr></thead>
            <tbody>
              {kyc.data?.submissions.map((s) => (
                <tr key={s.id}>
                  <td>{formatDateTime(toDate(s.submitted_at))}</td>
                  <td dir="auto">{s.legal_name}</td>
                  <td><bdi>{s.display_name}</bdi><div className="muted small ltr">{s.email}</div></td>
                  <td>{label(ACCOUNT_TYPE, s.account_type)}</td>
                  <td>{label(ID_TYPE, s.id_type)} · <bdi>{s.country}</bdi></td>
                  <td><Link className="btn sm" to={`/admin/kyc/${s.id}`}>{t('Review')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </section>

      <section className="card">
        <h2>{t('Reports')}</h2>
        {reports.loading ? <Loading /> : reports.data?.reports.length === 0 ? <p className="muted">{t('No open reports.')}</p> : (
          reports.data?.reports.map((r) => <ReportRow key={r.id} report={r} onDone={() => { reports.reload(); stats.reload(); }} />)
        )}
      </section>
    </div>
  );
}

function ReportRow({ report: r, onDone }) {
  const [thread, setThread] = useState(null);
  const [error, setError] = useState(null);
  const act = (fn) => async () => { try { await fn(); } catch (e) { setError(e); } };

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '.75rem 0' }}>
      <ErrorBox error={error} />
      <div className="row spread">
        <div>
          {tj('{kind} on “{title}” · reported by {name} ({email})', {
            kind: <b>{r.deal_id ? t('Deal problem') : r.conversation_id ? t('Conversation') : t('Request')}</b>,
            title: <bdi>{r.listing_title}</bdi>, name: <bdi>{r.reporter_name}</bdi>, email: <span className="ltr">{r.reporter_email}</span>,
          })}
          <div className="muted small">{formatDateTime(toDate(r.created_at))}</div>
          {r.kind && <span className="badge warn">{{ 'not-as-described': t('Not as described'), 'no-show': t('No-show'), payment: t('Payment'), other: t('Other') }[r.kind]}</span>}
          <p style={{ margin: '.3rem 0 0' }}>{tj('“{text}”', { text: <bdi>{r.reason}</bdi> })}</p>
        </div>
        <div className="row" style={{ gap: '.4rem' }}>
          {r.listing_id && <Link className="btn sm secondary" to={`/requests/${r.listing_id}`}>{t('View request')}</Link>}
          {r.conversation_id && !thread && (
            <button className="btn sm secondary" onClick={act(async () => setThread(await api(`/admin/reports/${r.id}/conversation`)))}>{t('Read conversation')}</button>
          )}
          <button className="btn sm" onClick={act(async () => { await api(`/admin/reports/${r.id}/resolve`, { method: 'POST' }); onDone(); })}>{t('Mark resolved')}</button>
        </div>
      </div>
      {thread && (
        <div className="card" style={{ marginTop: '.75rem', background: 'var(--bg)' }}>
          <p className="small">{t('Buyer:')} <b><bdi>{thread.conversation.buyer_name}</bdi></b> (<span className="ltr">{thread.conversation.buyer_email}</span>) ·
            {t('Vendor:')} <b><bdi>{thread.conversation.vendor_name}</bdi></b> (<span className="ltr">{thread.conversation.vendor_email}</span>)</p>
          {thread.messages.map((m) => (
            <p key={m.id} className="small">
              <b>{m.sender_id === thread.conversation.buyer_id ? t('Buyer:') : t('Vendor:')}</b> <bdi>{m.body}</bdi>
              {m.imageUrl && <> <a href={m.imageUrl} target="_blank" rel="noreferrer">{t('📷 Photo')}</a></>}
              {m.offer_price !== null && ` [${t('offer {price}', { price: m.offer_price })}]`}
            </p>
          ))}
          <div className="row" style={{ gap: '.4rem' }}>
            {[['buyer_id', t('Ban buyer')], ['vendor_id', t('Ban vendor')]].map(([k, banLabel]) => (
              <button key={k} className="btn sm danger" onClick={act(async () => {
                if (!window.confirm(t('{action}? They will be logged out immediately.', { action: banLabel }))) return;
                await api(`/admin/users/${thread.conversation[k]}/ban`, { method: 'POST', body: { banned: true } });
                window.alert(t('User banned.'));
              })}>{banLabel}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
