// Inbox. Conversations are grouped under the request they belong to, so it
// is always obvious what each chat is about.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ago } from '../api.js';
import { Avatar, ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';

export default function Inbox() {
  const { data, error, loading } = useApi('/conversations');
  const [tab, setTab] = useState('all');

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const convs = data.conversations.filter((c) => tab === 'all' || c.myRole === tab);
  const groups = new Map();
  for (const c of convs) {
    if (!groups.has(c.listing.id)) groups.set(c.listing.id, { listing: c.listing, items: [] });
    groups.get(c.listing.id).items.push(c);
  }

  return (
    <>
      <h1>Messages</h1>
      <div className="row" style={{ marginBottom: '1rem', gap: '.5rem' }}>
        {[['all', 'All'], ['buyer', 'Offers I received'], ['vendor', 'Offers I sent']].map(([v, l]) => (
          <button key={v} className={`btn sm ${tab === v ? '' : 'secondary'}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      {groups.size === 0 ? (
        <div className="card empty">
          <p>No conversations yet.</p>
          <p className="small">Conversations start when a seller makes an offer on a request. <Link to="/">Browse requests</Link></p>
        </div>
      ) : (
        <div className="stack">
          {[...groups.values()].map(({ listing, items }) => (
            <section key={listing.id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: '.8rem 1rem', borderBottom: '1px solid var(--border)' }} className="row spread">
                <div>
                  <span className="muted small">Request</span>{' '}
                  <Link to={`/requests/${listing.id}`}><b>{listing.title}</b></Link>
                </div>
                {listing.status !== 'open' && <span className="badge grey">{listing.status}</span>}
              </div>
              {items.map((c) => (
                <Link key={c.id} to={`/messages/${c.id}`} className="inbox-item">
                  <Avatar name={c.other.displayName} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row spread">
                      <b>{c.other.displayName}</b>
                      <span className="muted small">{ago(c.lastMessageAt)}</span>
                    </div>
                    <div className="muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.myRole === 'buyer' ? 'Offer from seller' : 'Your offer'} · {c.lastMessage}
                    </div>
                  </div>
                  {c.unread > 0 && <span className="unread-dot">{c.unread}</span>}
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
