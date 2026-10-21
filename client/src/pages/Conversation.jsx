// A single conversation. Polls every 4 seconds for new messages (simple and
// reliable; see docs/Decisions for why not WebSockets yet).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, budget, money, toDate } from '../api.js';
import { Avatar, ErrorBox, KycBadge, Loading } from '../components/ui.jsx';
import { ReportLink } from './ListingDetail.jsx';

export default function Conversation() {
  const { id } = useParams();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [offer, setOffer] = useState('');
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const bodyRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api(`/conversations/${id}?after=${lastId.current}`);
      setConv(r.conversation);
      if (r.messages.some((m) => !m.mine)) window.dispatchEvent(new Event('unc:read'));
      if (r.messages.length) {
        lastId.current = Math.max(lastId.current, r.messages.at(-1).id);
        // Two polls can overlap (e.g. React StrictMode in dev), so skip ids we already have.
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...r.messages.filter((m) => !seen.has(m.id))];
        });
      }
    } catch (err) {
      setError(err);
    }
  }, [id]);

  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api(`/conversations/${id}/messages`, {
        method: 'POST', body: { message: text, offerPrice: offer === '' ? undefined : Number(offer) },
      });
      setText('');
      setOffer('');
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  if (!conv) return error ? <ErrorBox error={error} /> : <Loading />;
  const l = conv.listing;

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <p className="small"><Link to="/messages">← All messages</Link></p>
      <div className="card chat">
        <div className="chat-head">
          <div className="row">
            <Avatar name={conv.other.displayName} />
            <div style={{ flex: 1 }}>
              <b>{conv.other.displayName}</b>{' '}
              {conv.other.accountType === 'business' && <span className="badge grey">Business</span>}{' '}
              <KycBadge status={conv.other.verified ? 'approved' : 'unverified'} />
              <div className="small muted">
                About: <Link to={`/requests/${l.id}`}><b>{l.title}</b></Link> · {budget(l)} · {l.city}
              </div>
            </div>
          </div>
        </div>
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
              {m.offerPrice !== null && <div className="offer">💰 Offer: {money(m.offerPrice, l.currency)}</div>}
              {m.body}
              <div className="time">{toDate(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}{m.mine && m.readAt ? ' · Seen' : ''}</div>
            </div>
          ))}
        </div>
        {error && <div style={{ padding: '0 1rem' }}><ErrorBox error={error} /></div>}
        {conv.readOnly ? (
          <div className="chat-form muted small" style={{ justifyContent: 'center' }}>
            This request is {l.status}. The conversation is read-only.
          </div>
        ) : (
          <form className="chat-form" onSubmit={send}>
            <textarea placeholder={`Message about "${l.title}"…`} value={text} maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }} />
            {conv.myRole === 'vendor' && (
              <input type="number" min="0" placeholder="Price" value={offer} onChange={(e) => setOffer(e.target.value)} aria-label="Offer price" />
            )}
            <button className="btn" disabled={sending || !text.trim()}>Send</button>
          </form>
        )}
      </div>
      <ReportLink conversationId={conv.id} />
    </div>
  );
}
