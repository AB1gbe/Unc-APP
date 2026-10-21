import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ago, budget, toDate } from '../api.js';
import { useAuth, isVerified } from '../auth.jsx';
import { Avatar, ErrorBox, KycBadge, Loading, StatusBadge, VerifyPrompt } from '../components/ui.jsx';
import { useApi } from '../hooks.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(`/listings/${id}`);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const l = data.listing;
  const isOwner = user?.id === l.buyer.id;

  return (
    <div className="two-col">
      <article className="card">
        <div className="row spread">
          <span className="badge">{l.category}</span>
          <StatusBadge status={l.status} />
        </div>
        <h1 style={{ marginTop: '.75rem' }}>{l.title}</h1>
        <p className="price" style={{ fontSize: '1.2rem' }}>{budget(l)}</p>
        <div className="meta" style={{ marginBottom: '1rem' }}>
          <span>📍 {l.city}</span>
          <span>🕒 Posted {ago(l.createdAt)}</span>
          {l.neededBy && <span>📅 Needed by {toDate(l.neededBy).toLocaleDateString()}</span>}
        </div>
        <p style={{ whiteSpace: 'pre-wrap' }}>{l.description}</p>
        {l.images.length > 0 && (
          <div className="thumbs">{l.images.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="Reference" /></a>)}</div>
        )}
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
        <div className="row">
          <Avatar name={l.buyer.displayName} />
          <div>
            <b>{l.buyer.displayName}</b> <KycBadge status="approved" />
            <div className="muted small">Requested by a verified member</div>
          </div>
        </div>
      </article>
      <aside>
        {isOwner ? <OwnerPanel listing={l} onChange={reload} /> : <OfferPanel listing={l} />}
        {!isOwner && user && <ReportLink listingId={l.id} />}
      </aside>
    </div>
  );
}

// What a vendor sees: a form to contact the buyer ABOUT THIS REQUEST.
function OfferPanel({ listing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (listing.status !== 'open') return <div className="card"><p className="muted">This request is no longer accepting offers.</p></div>;
  if (listing.myConversationId) {
    return (
      <div className="card">
        <h2>You've already made an offer</h2>
        <p className="muted">Continue the conversation with {listing.buyer.displayName}.</p>
        <Link className="btn block" to={`/messages/${listing.myConversationId}`}>Open conversation</Link>
      </div>
    );
  }
  if (!isVerified(user)) return <div className="card"><h2>Have this?</h2><VerifyPrompt action="contact this buyer" /></div>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { conversation } = await api(`/listings/${listing.id}/contact`, {
        method: 'POST', body: { message, offerPrice: offerPrice === '' ? undefined : Number(offerPrice) },
      });
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      if (err.body?.conversationId) return navigate(`/messages/${err.body.conversationId}`);
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Have this? Make an offer</h2>
      <p className="muted small">Your message goes privately to {listing.buyer.displayName} and stays attached to this request.</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="offerPrice">Your price ({listing.currency}) <span className="muted">(optional)</span></label>
        <input id="offerPrice" type="number" min="0" step="1" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" required maxLength={2000} placeholder="Describe what you have: condition, photos available, when you can deliver…" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send offer'}</button>
      <p className="hint">Never pay or ask for payment outside a method you trust. Report anything suspicious.</p>
    </form>
  );
}

// What the buyer sees on their own request: offers received + controls.
function OwnerPanel({ listing, onChange }) {
  const { data } = useApi(`/listings/${listing.id}/conversations`);
  const [error, setError] = useState(null);

  async function setStatus(status) {
    const msg = status === 'open' ? 'Reopen this request?' : `Mark this request as ${status}? Conversations about it will become read-only.`;
    if (!window.confirm(msg)) return;
    try {
      await api(`/listings/${listing.id}/status`, { method: 'POST', body: { status } });
      onChange();
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Your request</h2>
        <ErrorBox error={error} />
        {listing.status === 'open' ? (
          <div className="stack">
            <Link className="btn secondary block" to={`/requests/${listing.id}/edit`}>Edit</Link>
            <button className="btn ok block" onClick={() => setStatus('fulfilled')}>I found it — mark fulfilled</button>
            <button className="btn secondary block" onClick={() => setStatus('closed')}>Close without buying</button>
          </div>
        ) : (
          <button className="btn secondary block" onClick={() => setStatus('open')}>Reopen request</button>
        )}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>Offers ({data?.conversations.length ?? 0})</h2>
        {!data ? <p className="muted" style={{ padding: '1rem' }}>Loading…</p> : data.conversations.length === 0 ? (
          <p className="muted" style={{ padding: '0 1rem 1rem' }}>No offers yet. Sellers who have what you need will message you here.</p>
        ) : data.conversations.map((c) => (
          <Link key={c.id} className="inbox-item" to={`/messages/${c.id}`}>
            <Avatar name={c.other.displayName} />
            <div>
              <b>{c.other.displayName}</b> {c.other.accountType === 'business' && <span className="badge grey">Business</span>}
              <div className="muted small">{ago(c.lastMessageAt)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReportLink({ listingId, conversationId }) {
  const [sent, setSent] = useState(false);
  async function report() {
    const reason = window.prompt('What is wrong? (e.g. scam, offensive, prohibited item)');
    if (!reason || reason.trim().length < 5) return;
    await api('/reports', { method: 'POST', body: { listingId, conversationId, reason } });
    setSent(true);
  }
  return (
    <p className="small center" style={{ marginTop: '1rem' }}>
      {sent ? <span className="muted">Thanks — our team will review it.</span> : <button className="linkish" onClick={report}>⚑ Report</button>}
    </p>
  );
}

