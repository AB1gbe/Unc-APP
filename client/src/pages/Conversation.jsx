// A single conversation. Polls every 4 seconds for new messages (simple and
// reliable; see docs/Decisions for why not WebSockets yet).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, budget, money, toDate } from '../api.js';
import { Avatar, ErrorBox, KycBadge, Loading, RatingBadge, StarInput, Stars } from '../components/ui.jsx';
import { ReportLink } from './ListingDetail.jsx';
import { usePolling } from '../hooks.js';
import Lightbox from '../components/Lightbox.jsx';
import { shrinkImage } from '../images.js';
import { formatDateTime, t, tj } from '../i18n.jsx';

export default function Conversation() {
  const { id } = useParams();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);         // from sending
  const [pollError, setPollError] = useState(null); // from loading; clears when a poll works
  const [text, setText] = useState('');
  const [offer, setOffer] = useState('');
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState(null);        // photo to send (already shrunk)
  const [viewing, setViewing] = useState(null);    // photo URL open full-screen
  const lastId = useRef(0);
  const currentId = useRef(id);
  const bodyRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api(`/conversations/${id}?after=${lastId.current}`);
      // The user may have switched to another conversation while this was loading.
      if (currentId.current !== id) return;
      setConv(r.conversation);
      setPollError(null);
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
      if (currentId.current === id) setPollError(err);
    }
  }, [id]);

  // Opening another conversation: start from an empty list. (Declared before
  // usePolling so it runs first.)
  useEffect(() => {
    currentId.current = id;
    lastId.current = 0;
    setMessages([]);
    setConv(null);
    setError(null);
    setPollError(null);
  }, [id]);
  usePolling(load, 4000);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    // Enter can be pressed again (or held down) while a send is in progress;
    // the button is disabled but the keyboard shortcut isn't.
    if ((!text.trim() && !photo) || sending) return;
    setSending(true);
    setError(null);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append('message', text);
      if (offer !== '') fd.append('offerPrice', offer);
      if (photo) fd.append('image', photo);
      await api(`/conversations/${id}/messages`, { method: 'POST', form: fd });
      setText('');
      setOffer('');
      setPhoto(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  if (!conv) return pollError ? <ErrorBox error={pollError} /> : <Loading />;
  const l = conv.listing;

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <p className="small"><Link to="/messages"><span className="flip">←</span> {t('All messages')}</Link></p>
      <div className="card chat">
        <div className="chat-head">
          <div className="row">
            <Avatar name={conv.other.displayName} src={conv.other.avatarUrl} />
            <div style={{ flex: 1 }}>
              <Link to={`/members/${conv.other.id}`}><b><bdi>{conv.other.displayName}</bdi></b></Link>{' '}
              {conv.other.accountType === 'business' && <span className="badge grey">{t('Business')}</span>}{' '}
              <KycBadge status={conv.other.verified ? 'approved' : 'unverified'} />{' '}
              <RatingBadge rating={conv.other.rating} />
              <div className="small muted">
                {tj('About: {title}', { title: <Link to={`/requests/${l.id}`}><b><bdi>{l.title}</bdi></b></Link> })} · {budget(l)} · <bdi>{l.city}</bdi>
              </div>
            </div>
          </div>
        </div>
        {conv.deal && <DealBanner conv={conv} onRated={load} />}
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
              {m.offerPrice !== null && <div className="offer">💰 {t('Offer: {price}', { price: money(m.offerPrice, l.currency) })}</div>}
              {m.imageUrl && (
                <button type="button" className="bubble-photo" onClick={() => setViewing(m.imageUrl)} aria-label={t('Open photo')}>
                  <img src={m.imageUrl} alt="" loading="lazy" />
                </button>
              )}
              {m.body && <div dir="auto">{m.body}</div>}
              <div className="time">{formatDateTime(toDate(m.createdAt), { dateStyle: 'short', timeStyle: 'short' })}{m.mine && m.readAt ? ` · ${t('Seen')}` : ''}</div>
            </div>
          ))}
        </div>
        {(error || pollError) && <div style={{ padding: '0 1rem' }}><ErrorBox error={error || pollError} /></div>}
        {conv.readOnly ? (
          <div className="chat-form muted small" style={{ justifyContent: 'center' }}>
            {l.status === 'fulfilled' ? t('This request has been fulfilled. The conversation is read-only.') : t('This request is closed. The conversation is read-only.')}
          </div>
        ) : (
          <>
          {photo && <PhotoPreview file={photo} onRemove={() => setPhoto(null)} />}
          <form className="chat-form" onSubmit={send}>
            <label className="attach" title={t('Add a photo')} aria-label={t('Add a photo')}>
              📷
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) setPhoto(await shrinkImage(f)); }} />
            </label>
            <textarea placeholder={t('Message about “{title}”…', { title: l.title })} value={text} maxLength={2000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }} />
            {conv.myRole === 'vendor' && (
              <input type="number" min="0" placeholder={t('Price')} value={offer} onChange={(e) => setOffer(e.target.value)} aria-label={t('Offer price')} />
            )}
            <button className="btn" disabled={sending || (!text.trim() && !photo)}>{t('Send')}</button>
          </form>
          </>
        )}
      </div>
      <ReportLink conversationId={conv.id} />
      {viewing && <Lightbox photos={[viewing]} onClose={() => setViewing(null)} />}
    </div>
  );
}

// Shown at the top of the conversation the buyer marked as "the deal".
function DealBanner({ conv, onRated }) {
  const { deal, other } = conv;
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/deals/${deal.id}/rating`, { method: 'POST', body: { stars, comment: comment || undefined } });
      await onRated();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (deal.myRating) {
    return (
      <div className="deal-banner small">
        🤝 <b>{t('Deal done.')}</b> {tj('You rated {name}', { name: <bdi>{other.displayName}</bdi> })} <Stars value={deal.myRating.stars} />
        {deal.theirRating ? (
          <> · {t('They rated you')} <Stars value={deal.theirRating.stars} />{deal.theirRating.comment && <> {tj('“{text}”', { text: <bdi>{deal.theirRating.comment}</bdi> })}</>}</>
        ) : (
          <span className="muted"> · {deal.otherHasRated ? t('They rated you too.') : tj('Waiting for {name} to rate you.', { name: <bdi>{other.displayName}</bdi> })} {t("Ratings show on profiles once you've both rated (or after 14 days).")}</span>
        )}
      </div>
    );
  }
  if (!deal.canRate) {
    return <div className="deal-banner small">🤝 <b>{t('Deal done.')}</b> <span className="muted">{t('The 30-day rating window has closed.')}</span></div>;
  }
  return (
    <form className="deal-banner" onSubmit={submit}>
      <p style={{ margin: 0 }}>🤝 <b>{t('Deal done!')}</b> {conv.myRole === 'buyer'
        ? tj('How was {name} as a seller?', { name: <bdi>{other.displayName}</bdi> })
        : tj('How was {name} as a buyer?', { name: <bdi>{other.displayName}</bdi> })}</p>
      {deal.otherHasRated && <p className="small muted" style={{ margin: 0 }}>{tj('{name} has already rated you — rate them to see it.', { name: <bdi>{other.displayName}</bdi> })}</p>}
      <ErrorBox error={error} />
      <StarInput value={stars} onChange={setStars} />
      <div className="row" style={{ gap: '.5rem', alignItems: 'flex-end' }}>
        <textarea placeholder={t('Optional: a few words for other members (shown on their profile)')} maxLength={500} value={comment}
          onChange={(e) => setComment(e.target.value)} style={{ flex: 1, minHeight: 44, height: 44 }} />
        <button className="btn" disabled={!stars || busy}>{busy ? t('Saving…') : t('Submit rating')}</button>
      </div>
      <p className="hint" style={{ margin: 0 }}>{t("Ratings are hidden until you've both rated, so nobody can retaliate. You can't change it later.")}</p>
    </form>
  );
}

// The photo waiting to be sent, with a ✕ to drop it.
function PhotoPreview({ file, onRemove }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="attach-preview">
      <img src={url} alt="" />
      <button type="button" className="thumb-x" onClick={onRemove} aria-label={t('Remove')}>✕</button>
    </div>
  );
}
