// A single conversation. Polls every 4 seconds for new messages (simple and
// reliable; see docs/Decisions for why not WebSockets yet).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, budget, money, toDate } from '../api.js';
import { Activity, Avatar, Badges, ErrorBox, KycBadge, Loading, RatingBadge, StarInput, Stars } from '../components/ui.jsx';
import { ReportLink } from './ListingDetail.jsx';
import { usePolling } from '../hooks.js';
import Lightbox from '../components/Lightbox.jsx';
import { shrinkImage } from '../images.js';
import { formatDateTime, t, tj } from '../i18n.jsx';
import { celebrate } from '../components/Celebrate.jsx';
import { StoryForm } from '../components/Stories.jsx';
import FavouriteButton from '../components/FavouriteButton.jsx';
import { Place } from '../components/CityField.jsx';
import { scamSignals } from '../scam.js';
import { hasContacts } from '../../../shared/contact-mask.js';
import ContactNudge from '../components/ContactNudge.jsx';
import PickupCard from '../components/PickupCard.jsx';
import { EMPTY_DETAILS, OfferDetailFields, OfferDetailsLine, addDetails } from '../components/OfferDetails.jsx';

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
  const [proof, setProof] = useState(false);       // that photo shows the chat's code
  const [details, setDetails] = useState(EMPTY_DETAILS); // condition, warranty… with a price
  const [viewing, setViewing] = useState(null);    // photo URL open full-screen
  const lastId = useRef(0);
  const currentId = useRef(id);
  const agreedRef = useRef(null);  // when a price gets accepted, reload so hidden numbers show
  const bodyRef = useRef(null);
  const textRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api(`/conversations/${id}?after=${lastId.current}`);
      // The user may have switched to another conversation while this was loading.
      if (currentId.current !== id) return;
      setConv(r.conversation);
      setPollError(null);
      if (agreedRef.current === false && r.conversation.agreed) {
        // A price was just accepted: fetch the whole chat again, unhidden.
        agreedRef.current = true;
        const all = await api(`/conversations/${id}?after=0`);
        if (currentId.current !== id) return;
        lastId.current = all.messages.at(-1)?.id ?? 0;
        setMessages(all.messages);
        return;
      }
      agreedRef.current = r.conversation.agreed;
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
    agreedRef.current = null;
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
      if (offer !== '') { fd.append('offerPrice', offer); if (conv.myRole === 'vendor') addDetails(fd, details); }
      if (photo) fd.append('image', photo);
      if (photo && proof) fd.append('proof', '1');
      await api(`/conversations/${id}/messages`, { method: 'POST', form: fd });
      setText('');
      setOffer('');
      setPhoto(null);
      setProof(false);
      setDetails(EMPTY_DETAILS);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  if (!conv) return pollError ? <ErrorBox error={pollError} /> : <Loading />;
  const l = conv.listing;
  // Offer cards: only the newest price can be answered, and only once.
  const newestPriceId = Math.max(0, ...messages.filter((m) => m.offerPrice !== null).map((m) => m.id));
  const answers = new Map(messages.filter((m) => m.kind).map((m) => [m.replyTo, m.kind]));
  // The agreed price, once either side accepted one (for the pickup checklist).
  const accepted = messages.findLast((m) => m.kind === 'accept');
  const agreed = accepted ? messages.find((m) => m.id === accepted.replyTo)?.offerPrice ?? null : null;
  const priceOf = (id) => { const m = messages.find((x) => x.id === id); return m ? money(m.offerPrice, l.currency) : ''; };

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
              <RatingBadge rating={conv.other.rating} />{' '}
              <Activity activity={conv.otherActivity} />{' '}
              <Badges badges={conv.otherBadges} />
              <div className="small muted">
                {tj('About: {title}', { title: <Link to={`/requests/${l.id}`}><b><bdi>{l.title}</bdi></b></Link> })} · {budget(l)} · <Place city={l.city} />
              </div>
            </div>
          </div>
        </div>
        {conv.deal && <DealBanner conv={conv} onRated={load} />}
        {conv.deal && <DealProblem conv={conv} onDone={load} />}
        {(accepted || conv.deal) && <PickupCard convId={conv.id} category={l.category} price={agreed} currency={l.currency} />}
        <div className="chat-body" ref={bodyRef}>
          {messages.map((m) => m.kind === 'proof-ask' ? (
            <ProofAskLine key={m.id} m={m} conv={conv} />
          ) : m.kind ? (
            <AnswerLine key={m.id} m={m} conv={conv} price={priceOf(m.replyTo)} />
          ) : (
            <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
              {m.offerPrice !== null && (
                <OfferCard m={m} conv={conv} answer={answers.get(m.id)} newest={m.id === newestPriceId} onDone={load} />
              )}
              {m.imageUrl && (
                <button type="button" className="bubble-photo" onClick={() => setViewing(m.imageUrl)} aria-label={t('Open photo')}>
                  <img src={m.imageUrl} alt="" loading="lazy" />
                </button>
              )}
              {m.proof && (
                <div className="proof-badge">
                  {t('✓ Proof photo · {code}', { code: conv.proofCode })}
                  {!m.mine && <div className="small">{t('Check that the paper in the photo says {code}.', { code: conv.proofCode })}</div>}
                </div>
              )}
              {m.body && <div dir="auto">{m.body}</div>}
              {m.hiddenContact && <div className="hidden-note">{t('📵 Contact details are hidden until you agree a price.')}</div>}
              {m.hiddenForOther && <div className="hidden-note">{tj('📵 Hidden from {name} until you agree a price.', { name: <bdi>{conv.other.displayName}</bdi> })}</div>}
              {!m.mine && scamSignals(m.body).length > 0 && (
                <div className="scam-warning" role="note">{t("⚠️ Be careful: never send money before you've seen the item, and don't open links from strangers. Unc never asks you to pay by transfer.")}</div>
              )}
              <div className="time">{formatDateTime(toDate(m.createdAt), { dateStyle: 'short', timeStyle: 'short' })}{m.mine && m.readAt ? ` · ${t('Seen')}` : ''}</div>
            </div>
          ))}
        </div>
        {(error || pollError) && <div style={{ padding: '0 1rem' }}><ErrorBox error={error || pollError} /></div>}
        {conv.blocked ? (
          <BlockedNotice conv={conv} onChange={load} />
        ) : conv.readOnly ? (
          <div className="chat-form muted small" style={{ justifyContent: 'center' }}>
            {l.status === 'fulfilled' ? t('Found! 🎉 This request is done, so the chat is now read-only.') : t('This request is closed. The conversation is read-only.')}
          </div>
        ) : (
          <>
          {photo && <PhotoPreview file={photo} onRemove={() => { setPhoto(null); setProof(false); }} />}
          {offer !== '' && conv.myRole === 'vendor' && (
            <div style={{ padding: '0 1rem' }}><OfferDetailFields value={details} onChange={setDetails} idPrefix="chat" /></div>
          )}
          {photo && conv.myRole === 'vendor' && (
            <label className="proof-check small">
              <input type="checkbox" checked={proof} onChange={(e) => setProof(e.target.checked)} />
              {t('This is a proof photo: the code {code} is written on paper next to the item', { code: conv.proofCode })}
            </label>
          )}
          {!text && (
            <QuickReplies role={conv.myRole} onPick={(phrase) => { setText(phrase); textRef.current?.focus(); }} />
          )}
          {!conv.agreed && hasContacts(text) && <ContactNudge />}
          <form className="chat-form" onSubmit={send}>
            <label className="attach" title={t('Add a photo')} aria-label={t('Add a photo')}>
              📷
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) setPhoto(await shrinkImage(f)); }} />
            </label>
            <textarea ref={textRef} placeholder={t('Message about “{title}”…', { title: l.title })} value={text} maxLength={2000}
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
      <div className="row" style={{ justifyContent: 'center', gap: '1.25rem' }}>
        {conv.myRole === 'buyer' && !conv.readOnly && !conv.blocked && <ProofAskButton conv={conv} onDone={load} />}
        <ReportLink conversationId={conv.id} />
        {!conv.iBlocked && <BlockLink conv={conv} onChange={load} />}
      </div>
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
      celebrate({ text: t('Thanks for rating! ⭐ It helps everyone on Unc.'), confetti: stars >= 4 });
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
        {conv.myRole === 'buyer' && !conv.otherFavourite && (
          <div style={{ marginTop: '.6rem' }}><FavouriteButton memberId={other.id} name={other.displayName} wide /></div>
        )}
        {!deal.myStory && <StoryForm dealId={deal.id} otherName={other.displayName} onShared={onRated} />}
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

// "Something went wrong with this deal?" (session 34): goes to the Unc
// team with this chat; the other person isn't told.
const PROBLEMS = {
  'not-as-described': () => t('The item was not as described'),
  'no-show': () => t("They didn't come or stopped answering"),
  payment: () => t('A problem with payment'),
  other: () => t('Something else'),
};
function DealProblem({ conv, onDone }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const status = conv.deal.myProblem;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/deals/${conv.deal.id}/problem`, { method: 'POST', body: { kind, details } });
      setOpen(false);
      await onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'open') return <p className="deal-problem small muted">{t('Thanks for telling us. Our team will read this chat and contact you by email.')}</p>;
  if (!open) {
    return (
      <p className="deal-problem small">
        <button type="button" className="linkish small" onClick={() => setOpen(true)}>{t('⚠️ Something went wrong with this deal?')}</button>
      </p>
    );
  }
  return (
    <form className="deal-problem" onSubmit={submit}>
      <b>{t('What went wrong?')}</b>
      <p className="small muted" style={{ margin: 0 }}>{tj('Only the Unc team sees this, together with this chat. {name} is not told.', { name: <bdi>{conv.other.displayName}</bdi> })}</p>
      <ErrorBox error={error} />
      {Object.entries(PROBLEMS).map(([k, label]) => (
        <label key={k} className="choice">
          <input type="radio" name="problem" value={k} checked={kind === k} onChange={() => setKind(k)} required />
          <span>{label()}</span>
        </label>
      ))}
      <textarea required minLength={10} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)}
        placeholder={t('What happened? Dates and amounts help.')} aria-label={t('What happened?')} />
      <div className="row">
        <button className="btn" disabled={busy || !kind || details.trim().length < 10}>{busy ? t('Sending…') : t('Send to the Unc team')}</button>
        <button type="button" className="btn secondary" onClick={() => setOpen(false)}>{t('Cancel')}</button>
      </div>
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

// A price in the chat, as a card. The other side's newest price gets
// Accept / Counter / Not for me (session 20).
function OfferCard({ m, conv, answer, newest, onDone }) {
  const l = conv.listing;
  const [countering, setCountering] = useState(false);
  const [counter, setCounter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fromSeller = m.mine ? conv.myRole === 'vendor' : conv.myRole === 'buyer';
  const price = money(m.offerPrice, l.currency);
  const canAnswer = !m.mine && newest && !answer && !conv.readOnly;
  const expired = Boolean(m.details?.expired);

  const run = (fn) => async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try { await fn(); await onDone(); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const respond = (action) => run(async () => {
    await api(`/conversations/${conv.id}/messages/${m.id}/respond`, { method: 'POST', body: { action } });
    if (action === 'accept') celebrate({ text: t('Agreed at {price}! 🤝', { price }), confetti: true });
  });
  const sendCounter = run(async () => {
    await api(`/conversations/${conv.id}/messages`, { method: 'POST', body: { offerPrice: counter } });
    setCountering(false);
    setCounter('');
  });

  return (
    <div className={`offer-card ${expired ? 'is-expired' : ''}`}>
      <div className="offer">{fromSeller ? '💰' : '↩️'} {fromSeller ? t('Offer: {price}', { price }) : t('Counter-offer: {price}', { price })}</div>
      {answer === 'accept' && <span className="badge ok">{t('✓ Accepted')}</span>}
      {answer === 'decline' && <span className="badge grey">{t('Declined')}</span>}
      <OfferDetailsLine details={m.details} />
      {!answer && !newest && <span className="small muted">{t('Replaced by a newer price')}</span>}
      <ErrorBox error={error} />
      {canAnswer && !countering && (
        <div className="offer-actions">
          {!expired && <button type="button" className="btn sm ok" disabled={busy} onClick={respond('accept')}>{t('Accept')}</button>}
          <button type="button" className="btn sm secondary" disabled={busy} onClick={() => setCountering(true)}>{t('Counter')}</button>
          <button type="button" className="btn sm secondary" disabled={busy} onClick={respond('decline')}>{t('Not for me')}</button>
          {!expired && <div className="small muted accept-terms">{tj('Accepting means you both finish this deal on Unc ({terms}).', { terms: <Link to="/terms">{t('Terms of use')}</Link> })}</div>}
        </div>
      )}
      {canAnswer && countering && (
        <form className="offer-actions" onSubmit={sendCounter}>
          <input type="number" min="0" required autoFocus value={counter} onChange={(e) => setCounter(e.target.value)}
            placeholder={t('Your price')} aria-label={t('Your price')} style={{ width: 110 }} />
          <button className="btn sm" disabled={busy || counter === ''}>{t('Send')}</button>
          <button type="button" className="btn sm secondary" onClick={() => setCountering(false)}>{t('Cancel')}</button>
        </form>
      )}
    </div>
  );
}

// "Riverside accepted $380 🤝" in the middle of the chat.
function AnswerLine({ m, conv, price }) {
  const name = <bdi>{conv.other.displayName}</bdi>;
  const accepted = m.kind === 'accept';
  return (
    <div className={`answer-line ${accepted ? 'ok' : ''}`} role="note">
      {accepted
        ? (m.mine ? t('You accepted {price} 🤝', { price }) : tj('{name} accepted {price} 🤝', { name, price }))
        : (m.mine ? t('You said no to {price}', { price }) : tj('{name} said no to {price}', { name, price }))}
      {accepted && conv.myRole === 'buyer' && !conv.readOnly && (
        <> · <Link to={`/requests/${conv.listing.id}`}>{t('Got it? Mark the request as found')} <span className="flip">→</span></Link></>
      )}
    </div>
  );
}

// Proof photos (session 34): the buyer asks; the seller is told how.
function ProofAskButton({ conv, onDone }) {
  const [error, setError] = useState(null);
  async function ask() {
    setError(null);
    try {
      await api(`/conversations/${conv.id}/proof-request`, { method: 'POST' });
      await onDone();
    } catch (err) {
      setError(err);
    }
  }
  return (
    <p className="small center" style={{ marginTop: '1rem' }}>
      <button type="button" className="linkish" onClick={ask}>{t('📸 Ask for a proof photo')}</button>
      {error && <span className="muted"> · {error.message}</span>}
    </p>
  );
}

function ProofAskLine({ m, conv }) {
  return (
    <div className="answer-line" role="note">
      {m.mine
        ? t('You asked for a proof photo with the code {code}.', { code: conv.proofCode })
        : <>{tj('{name} asked for a proof photo.', { name: <bdi>{conv.other.displayName}</bdi> })} {t('Write {code} on a piece of paper, put it next to the item, and send a photo of both. Tick “proof photo” before sending.', { code: conv.proofCode })}</>}
    </div>
  );
}

// One-tap starters above the message box; they fill the box so you can edit.
function QuickReplies({ role, onPick }) {
  const phrases = role === 'buyer'
    ? [t('Is it still available?'), t('Can you send more photos?'), t('Where can we meet?'), t('Is the price negotiable?')]
    : [t("Yes, it's still available."), t('I can send more photos.'), t('Where would you like to meet?'), t('I can deliver it.')];
  return (
    <div className="quick-replies" aria-label={t('Quick replies')}>
      {phrases.map((p) => <button key={p} type="button" className="chip" onClick={() => onPick(p)}>{p}</button>)}
    </div>
  );
}

// Block (session 31): they can't contact you or your requests any more.
function BlockLink({ conv, onChange }) {
  async function block() {
    if (!window.confirm(t("Block {name}? They won't be able to contact you or answer your requests, and you won't see their requests. You can unblock them in Account → Privacy.", { name: conv.other.displayName }))) return;
    await api(`/members/${conv.other.id}/block`, { method: 'POST' });
    await onChange();
  }
  return <button type="button" className="linkish small" onClick={block}>{t('🚫 Block')}</button>;
}

function BlockedNotice({ conv, onChange }) {
  async function unblock() {
    await api(`/members/${conv.other.id}/block`, { method: 'DELETE' });
    await onChange();
  }
  return (
    <div className="chat-form muted small blocked-notice" style={{ justifyContent: 'center' }}>
      {conv.iBlocked ? (
        <>{tj("You blocked {name}. They can't contact you or your requests.", { name: <bdi>{conv.other.displayName}</bdi> })} <button type="button" className="linkish" onClick={unblock}>{t('Unblock')}</button></>
      ) : t("You can't reply in this conversation.")}
    </div>
  );
}

