// Teams I'm on (session 88): accept an invitation from a business, then
// "Switch to" it to post and answer for it. Anyone with an account.
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Avatar, ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';

export default function Team() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/team');
  const [err, setErr] = useState(null);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const run = (fn) => async () => { setErr(null); try { await fn(); } catch (x) { setErr(x); } };
  const switchTo = (id) => run(async () => { await api(`/team/switch/${id}`, { method: 'POST' }); await refresh(); navigate('/business'); });
  return (
    <div className="narrow stack">
      <h1>{t('Teams')}</h1>
      <p className="muted">{t('Businesses can add you to their team. You then post ads and answer customers for them with your own login.')}</p>
      <ErrorBox error={err} />
      {data.actingFor && <p className="alert info">{t('You are using {name} now. Switch back to your own account to manage your teams.', { name: data.actingFor.displayName })}</p>}
      {!data.emailVerified && <p className="alert warn">{t('Confirm your email to see invitations sent to it.')}</p>}
      {data.invites.length > 0 && (
        <section className="card" style={{ padding: 0 }}>
          <h2 style={{ padding: '1rem 1rem 0' }}>{t('Invitations')}</h2>
          {data.invites.map((i) => (
            <div key={i.id} className="inbox-item">
              <Avatar name={i.business.displayName} src={i.business.avatarUrl} />
              <span style={{ flex: 1 }}><b><bdi>{i.business.displayName}</bdi></b><div className="muted small">{t('wants you on their team')}</div></span>
              <button type="button" className="btn sm ok" onClick={run(async () => { await api(`/team/invites/${i.id}/accept`, { method: 'POST' }); reload(); })}>{t('Join')}</button>
              <button type="button" className="btn sm danger-outline" onClick={run(async () => { await api(`/team/invites/${i.id}/decline`, { method: 'POST' }); reload(); })}>{t('Decline')}</button>
            </div>
          ))}
        </section>
      )}
      <section className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>{t('My teams')}</h2>
        {data.businesses.length === 0 ? <p className="muted" style={{ padding: '0 1rem 1rem' }}>{t('You are not on any business team yet.')}</p> : data.businesses.map((b) => (
          <div key={b.id} className="inbox-item">
            <Avatar name={b.displayName} src={b.avatarUrl} />
            <span style={{ flex: 1 }}><b><bdi>{b.displayName}</bdi></b></span>
            {!data.actingFor && <button type="button" className="btn sm" onClick={switchTo(b.id)}>{t('Switch to this business')}</button>}
            {!data.actingFor && <button type="button" className="btn sm danger-outline" onClick={run(async () => { if (window.confirm(t('Leave this team?'))) { await api(`/team/${b.id}`, { method: 'DELETE' }); reload(); } })}>{t('Leave')}</button>}
          </div>
        ))}
      </section>
    </div>
  );
}
