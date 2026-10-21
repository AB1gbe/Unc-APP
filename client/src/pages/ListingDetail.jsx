import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ago, budget, toDate } from '../api.js';
import { useAuth, isVerified } from '../auth.jsx';
import { Avatar, ErrorBox, KycBadge, Loading, RatingBadge, StatusBadge, VerifyPrompt } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { formatDate, t, tj } from '../i18n.jsx';
import Lightbox from '../components/Lightbox.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { celebrate } from '../components/Celebrate.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(`/listings/${id}`);
  const [viewing, setViewing] = useState(null); // index of the photo open full-screen

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const l = data.listing;
  const isOwner = user?.id === l.buyer.id;

  return (
    <div className="two-col">
      <article className="card">
        <div className="row spread">
          <span className="badge">{t(l.category)}</span>
          <div className="row" style={{ gap: '.5rem' }}>
            {user && !isOwner && l.status === 'open' && <SaveButton listing={l} />}
            <StatusBadge status={l.status} />
          </div>
        </div>
        <h1 dir="auto" style={{ marginTop: '.75rem' }}>{l.title}</h1>
        <p className="price" style={{ fontSize: '1.2rem' }}>{budget(l)}</p>
        <div className="meta" style={{ marginBottom: '1rem' }}>
          <span>📍 <bdi>{l.city}</bdi></span>
          <span>🕒 {t('Posted {time}', { time: ago(l.createdAt) })}</span>
          {l.neededBy && <span>📅 {t('Needed by {date}', { date: formatDate(toDate(l.neededBy)) })}</span>}
        </div>
        <p dir="auto" style={{ whiteSpace: 'pre-wrap' }}>{l.description}</p>
        {l.images.length > 0 && (
          <div className="gallery">
            {l.images.map((src, i) => (
              <button type="button" key={src} onClick={() => setViewing(i)} aria-label={t('Photo {n} of {total}', { n: i + 1, total: l.images.length })}>
                <img src={src} alt={t('Reference photo')} loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {viewing !== null && <Lightbox photos={l.images} start={viewing} onClose={() => setViewing(null)} />}
        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
        <div className="row">
          <Avatar name={l.buyer.displayName} src={l.buyer.avatarUrl} />
          <div>
            <Link to={`/members/${l.buyer.id}`}><b><bdi>{l.buyer.displayName}</bdi></b></Link> <KycBadge status="approved" />
            <div className="small"><RatingBadge rating={l.buyer.rating} /> <span className="muted">· {t('Requested by a verified member')}</span></div>
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
  const [photos, setPhotos] = useState([]); // optional photo of the item (max 1)
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (listing.status !== 'open') return <div className="card"><p className="muted">{t('This request is no longer accepting offers.')}</p></div>;
  if (listing.myConversationId) {
    return (
      <div className="card">
        <h2>{t("You've already made an offer")}</h2>
        <p className="muted">{tj('Continue the conversation with {name}.', { name: <bdi>{listing.buyer.displayName}</bdi> })}</p>
        <Link className="btn block" to={`/messages/${listing.myConversationId}`}>{t('Open conversation')}</Link>
      </div>
    );
  }
  if (!isVerified(user)) return <div className="card"><h2>{t('Have this?')}</h2><VerifyPrompt action="contact" /></div>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('message', message);
      if (offerPrice !== '') fd.append('offerPrice', offerPrice);
      if (photos[0]) fd.append('image', photos[0]);
      const { conversation } = await api(`/listings/${listing.id}/contact`, { method: 'POST', form: fd });
      celebrate({ text: t("Offer sent! You'll be notified when they reply.") });
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
      <h2>{t('Have this? Make an offer')}</h2>
      <p className="muted small">{tj('Your message goes privately to {name} and stays attached to this request.', { name: <bdi>{listing.buyer.displayName}</bdi> })}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="offerPrice">{t('Your price ({currency})', { currency: listing.currency })} <span className="muted">{t('(optional)')}</span></label>
        <input id="offerPrice" type="number" min="0" step="1" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="message">{t('Message')}</label>
        <textarea id="message" required maxLength={2000} placeholder={t('Describe what you have: condition, photos available, when you can deliver…')} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div className="field">
        <label>{t('Photo of your item')} <span className="muted">{t('(optional)')}</span></label>
        <PhotoPicker id="offerPhoto" files={photos} onChange={setPhotos} max={1} />
      </div>
      <button className="btn block" disabled={busy}>{busy ? t('Sending…') : t('Send offer')}</button>
      <p className="hint">{t('Never pay or ask for payment outside a method you trust. Report anything suspicious.')}</p>
    </form>
  );
}

// What the buyer sees on their own request: offers received + controls.
function OwnerPanel({ listing, onChange }) {
  const { data } = useApi(`/listings/${listing.id}/conversations`);
  const [error, setError] = useState(null);
  const [picking, setPicking] = useState(false); // "who did you buy from?" step
  const [dealWith, setDealWith] = useState('');
  const offers = data?.conversations ?? [];

  async function setStatus(status, conversationId) {
    setError(null);
    try {
      await api(`/listings/${listing.id}/status`, { method: 'POST', body: { status, conversationId } });
      if (status === 'fulfilled') {
        celebrate({ text: conversationId ? t("Found it! 🎉 Don't forget to rate the seller.") : t('Glad you found it! 🎉'), confetti: true });
      }
      setPicking(false);
      onChange();
    } catch (err) {
      setError(err);
    }
  }

  function confirmThen(status, message) {
    if (window.confirm(message)) setStatus(status);
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>{t('Your request')}</h2>
        <ErrorBox error={error} />
        {listing.status === 'open' && !picking && (
          <div className="stack">
            <Link className="btn secondary block" to={`/requests/${listing.id}/edit`}>{t('Edit')}</Link>
            <button className="btn ok block" onClick={() => setPicking(true)}>{t('I found it! 🎉')}</button>
            <button className="btn secondary block" onClick={() => confirmThen('closed', t('Close this request without buying? Conversations about it will become read-only.'))}>
              {t('Close without buying')}
            </button>
          </div>
        )}
        {listing.status === 'open' && picking && (
          <form onSubmit={(e) => { e.preventDefault(); setStatus('fulfilled', dealWith === 'elsewhere' ? undefined : Number(dealWith)); }}>
            <p><b>{t('Great! Who did you buy from?')}</b></p>
            <p className="muted small">{t("You'll both be able to rate each other. Conversations about this request will become read-only.")}</p>
            {offers.map((c) => (
              <label key={c.id} className="choice">
                <input type="radio" name="dealWith" value={c.id} checked={dealWith === String(c.id)} onChange={(e) => setDealWith(e.target.value)} required />
                <Avatar name={c.other.displayName} src={c.other.avatarUrl} />
                <span><b><bdi>{c.other.displayName}</bdi></b><br /><RatingBadge rating={c.other.rating} /></span>
              </label>
            ))}
            <label className="choice">
              <input type="radio" name="dealWith" value="elsewhere" checked={dealWith === 'elsewhere'} onChange={(e) => setDealWith(e.target.value)} required />
              <span>{t('Someone else / not through Unc')}</span>
            </label>
            <div className="row" style={{ marginTop: '.5rem' }}>
              <button className="btn ok" disabled={!dealWith}>{t('Yes, I found it')}</button>
              <button type="button" className="btn secondary" onClick={() => setPicking(false)}>{t('Cancel')}</button>
            </div>
          </form>
        )}
        {listing.status !== 'open' && (
          <div className="stack">
            {listing.dealConversationId && (
              <p>
                🤝 {tj('Bought from {name}.', { name: <b><bdi>{offers.find((c) => c.id === listing.dealConversationId)?.other.displayName ?? t('a seller')}</bdi></b> })}{' '}
                <Link to={`/messages/${listing.dealConversationId}`}>{t('Rate them')}</Link>
              </p>
            )}
            <button className="btn secondary block" onClick={() => confirmThen('open', t('Reopen this request?'))}>{t('Reopen request')}</button>
          </div>
        )}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>{t('Offers ({count})', { count: offers.length })}</h2>
        {!data ? <p className="muted" style={{ padding: '1rem' }}>{t('Loading…')}</p> : offers.length === 0 ? (
          <p className="muted" style={{ padding: '0 1rem 1rem' }}>{t('No offers yet. Sellers who have what you need will message you here.')}</p>
        ) : offers.map((c) => (
          <Link key={c.id} className="inbox-item" to={`/messages/${c.id}`}>
            <Avatar name={c.other.displayName} src={c.other.avatarUrl} />
            <div>
              <b><bdi>{c.other.displayName}</bdi></b> {c.other.accountType === 'business' && <span className="badge grey">{t('Business')}</span>}
              {c.id === listing.dealConversationId && <span className="badge ok">{t('Deal')}</span>}
              <div><RatingBadge rating={c.other.rating} /> <span className="muted small">· {ago(c.lastMessageAt)}</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// "♡ Save" / "♥ Saved": keeps the request in the member's saved list.
function SaveButton({ listing }) {
  const [saved, setSaved] = useState(Boolean(listing.saved));
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await api(`/listings/${listing.id}/save`, { method: saved ? 'DELETE' : 'PUT' });
      setSaved(!saved);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className={`btn sm secondary save-btn ${saved ? 'on' : ''}`} onClick={toggle} disabled={busy} aria-pressed={saved}>
      {saved ? t('♥ Saved') : t('♡ Save')}
    </button>
  );
}

export function ReportLink({ listingId, conversationId }) {
  const [sent, setSent] = useState(false);
  async function report() {
    const reason = window.prompt(t('What is wrong? (e.g. scam, offensive, prohibited item)'));
    if (!reason || reason.trim().length < 5) return;
    await api('/reports', { method: 'POST', body: { listingId, conversationId, reason } });
    setSent(true);
  }
  return (
    <p className="small center" style={{ marginTop: '1rem' }}>
      {sent ? <span className="muted">{t('Thanks — our team will review it.')}</span> : <button className="linkish" onClick={report}>{t('⚑ Report')}</button>}
    </p>
  );
}

