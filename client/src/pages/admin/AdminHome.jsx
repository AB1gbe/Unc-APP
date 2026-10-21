import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, toDate } from '../../api.js';
import { ErrorBox, Loading } from '../../components/ui.jsx';
import { useApi } from '../../hooks.js';

export default function AdminHome() {
  const stats = useApi('/admin/stats');
  const [status, setStatus] = useState('pending');
  const kyc = useApi(`/admin/kyc?status=${status}`);
  const reports = useApi('/admin/reports');

  return (
    <div className="stack">
      <h1>Admin</h1>
      {stats.data && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {[['Users', 'users'], ['Pending KYC', 'pendingKyc'], ['Open requests', 'openListings'], ['Conversations', 'conversations'], ['Open reports', 'openReports']].map(([label, k]) => (
            <div key={k} className="card"><div className="muted small">{label}</div><div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats.data[k]}</div></div>
          ))}
        </div>
      )}

      <section className="card">
        <div className="row spread">
          <h2>Identity verification</h2>
          <div className="row" style={{ gap: '.4rem' }}>
            {['pending', 'approved', 'rejected'].map((s) => (
              <button key={s} className={`btn sm ${status === s ? '' : 'secondary'}`} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>
        {kyc.loading ? <Loading /> : kyc.data?.submissions.length === 0 ? <p className="muted">Nothing here.</p> : (
          <table>
            <thead><tr><th>Submitted</th><th>Legal name</th><th>Account</th><th>Type</th><th>ID</th><th></th></tr></thead>
            <tbody>
              {kyc.data?.submissions.map((s) => (
                <tr key={s.id}>
                  <td>{toDate(s.submitted_at).toLocaleString()}</td>
                  <td>{s.legal_name}</td>
                  <td>{s.display_name}<div className="muted small">{s.email}</div></td>
                  <td>{s.account_type}</td>
                  <td>{s.id_type} · {s.country}</td>
                  <td><Link className="btn sm" to={`/admin/kyc/${s.id}`}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Reports</h2>
        {reports.loading ? <Loading /> : reports.data?.reports.length === 0 ? <p className="muted">No open reports.</p> : (
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
          <b>{r.conversation_id ? 'Conversation' : 'Request'}</b> on “{r.listing_title}” · reported by {r.reporter_name} ({r.reporter_email})
          <div className="muted small">{toDate(r.created_at).toLocaleString()}</div>
          <p style={{ margin: '.3rem 0 0' }}>“{r.reason}”</p>
        </div>
        <div className="row" style={{ gap: '.4rem' }}>
          {r.listing_id && <Link className="btn sm secondary" to={`/requests/${r.listing_id}`}>View request</Link>}
          {r.conversation_id && !thread && (
            <button className="btn sm secondary" onClick={act(async () => setThread(await api(`/admin/reports/${r.id}/conversation`)))}>Read conversation</button>
          )}
          <button className="btn sm" onClick={act(async () => { await api(`/admin/reports/${r.id}/resolve`, { method: 'POST' }); onDone(); })}>Mark resolved</button>
        </div>
      </div>
      {thread && (
        <div className="card" style={{ marginTop: '.75rem', background: 'var(--bg)' }}>
          <p className="small">Buyer: <b>{thread.conversation.buyer_name}</b> ({thread.conversation.buyer_email}) ·
            Vendor: <b>{thread.conversation.vendor_name}</b> ({thread.conversation.vendor_email})</p>
          {thread.messages.map((m) => (
            <p key={m.id} className="small">
              <b>{m.sender_id === thread.conversation.buyer_id ? 'Buyer' : 'Vendor'}:</b> {m.body}
              {m.offer_price !== null && ` [offer ${m.offer_price}]`}
            </p>
          ))}
          <div className="row" style={{ gap: '.4rem' }}>
            {[['buyer_id', 'Ban buyer'], ['vendor_id', 'Ban vendor']].map(([k, label]) => (
              <button key={k} className="btn sm danger" onClick={act(async () => {
                if (!window.confirm(`${label}? They will be logged out immediately.`)) return;
                await api(`/admin/users/${thread.conversation[k]}/ban`, { method: 'POST', body: { banned: true } });
                window.alert('User banned.');
              })}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
