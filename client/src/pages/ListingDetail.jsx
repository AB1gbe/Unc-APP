import { useState } from 'react';
import { categoryArt } from '../art.js';
import Icon from '../components/Icon.jsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ago, budget, currencyName, money, toDate } from '../api.js';
import { useAuth, isVerified } from '../auth.jsx';
import { Activity, Avatar, Badges, ClosesBadge, ContactRule, ErrorBox, KycBadge, Loading, RatingBadge, StatusBadge, VerifyPrompt, conditionLabel, daysLeft, replyLabel } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { formatDate, t, tj, tn } from '../i18n.jsx';
import Lightbox from '../components/Lightbox.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { celebrate } from '../components/Celebrate.jsx';
import ShareButton from '../components/ShareButton.jsx';
import CompareOffers from '../components/CompareOffers.jsx';
import { Place } from '../components/CityField.jsx';
import { requestTips } from '../tips.js';
import { EMPTY_DETAILS, OfferDetailFields, addDetails } from '../components/OfferDetails.jsx';
import { hasContacts } from '../../../shared/contact-mask.js';
import ContactNudge from '../components/ContactNudge.jsx';
import { VideoPreview, pickVideo } from '../components/VideoPicker.jsx';
import { JOB_TYPE_LABEL, SECTION_LABEL, SECTION_PATH, adPrice } from '../sections.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(`/listings/${id}`);
  const [viewing, setViewing] = useState(null); // index of the photo open full-screen

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const l = data.listing;
  const isOwner = user?.id === l.buyer.id;
  // Housing and Jobs ads (session 82) share this page with requests.
  const ad = l.section && l.section !== 'wanted';

  return (
    <>
    <div className="two-col">
      <article className="card">
        <div className="row spread">
          <span className="cat-label">{ad && <><Link to={SECTION_PATH[l.section]}>{SECTION_LABEL[l.section]()}</Link> › </>}{t(l.category)}</span>
          <div className="row" style={{ gap: '.5rem' }}>
            {l.status === 'open' && <ShareButton listing={l} mine={isOwner} />}
            {user && !isOwner && l.status === 'open' && <SaveButton listing={l} />}
            <StatusBadge status={l.status} />
          </div>
        </div>
        {l.held && <p className="alert warn small">{t('The Unc team is checking this ad before it shows to others. This usually takes less than a day.')}</p>}
        {l.sample && <p className="sample-note small">{ad ? t('Sample ad from the demo data. It shows how Unc works; it is not a real advertiser.') : t('Sample request from the demo data. It shows how Unc works; it is not a real buyer.')}</p>}
        <h1 dir="auto" style={{ marginTop: '.75rem' }}>{l.title}</h1>
        <p className="detail-price">{ad ? adPrice(l, money) ?? t('Pay not stated') : budget(l)}</p>
        {ad ? (
          <div className="detail-facts">
            {l.section === 'housing' && <span><b>{l.bedrooms == null ? t('Not said') : l.bedrooms === 0 ? t('Studio') : l.bedrooms}</b><small>{t('Bedrooms')}</small></span>}
            {l.section === 'housing' && <span><b>{l.furnished == null ? t('Not said') : l.furnished ? t('Furnished') : t('Unfurnished')}</b><small>{t('Furnishing')}</small></span>}
            {l.section === 'jobs' && <span><b>{JOB_TYPE_LABEL[l.jobType]?.() ?? t('Not said')}</b><small>{t('Job type')}</small></span>}
          </div>
        ) : (
        <div className="detail-facts">
          <span><b>{conditionLabel(l.condition)}</b><small>{t('Condition')}</small></span>
          <span><b>{tn(l.offerCount ?? 0, '{n} offer', '{n} offers')}</b><small>{t('So far')}</small></span>
          {l.status === 'open' && daysLeft(l.closesAt) !== null && <span><b>{daysLeft(l.closesAt) === 0 ? t('Last day') : tn(daysLeft(l.closesAt), '{n} day left', '{n} days left')}</b><small>{t('Open for offers')}</small></span>}
        </div>
        )}
        <div className="meta" style={{ marginBottom: '1rem' }}>
          <span><Place city={l.city} /></span>
          <span>{t('Posted {time}', { time: ago(l.createdAt) })}</span>
          {l.neededBy && <span>{t('Needed by {date}', { date: formatDate(toDate(l.neededBy)) })}</span>}
          {!ad && <ContactRule rule={l.contactRule} />}
          {!isOwner && <ClosesBadge closesAt={l.closesAt} />}
        </div>
        <p dir="auto" style={{ whiteSpace: 'pre-wrap' }}>{l.description}</p>
        {/* No photo: show the category's picture, marked as an example, so the
            page isn't just text (session 68). */}
        {l.images.length === 0 && !ad && (
          <figure className="gallery-fallback">
            <img src={categoryArt(l.category)} alt="" />
            <figcaption>{t('Example picture. The buyer hasn’t added a photo.')}</figcaption>
          </figure>
        )}
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
            <div className="small"><RatingBadge rating={l.buyer.rating} /> <span className="muted">· {ad ? t('Posted by an ID-checked member') : t('Requested by a verified member')}</span></div>
            {!isOwner && <Activity activity={l.buyer.activity} />} <Badges badges={l.buyer.badges} />
          </div>
        </div>
      </article>
      <aside>
        {ad
          ? (isOwner ? <AdOwnerPanel listing={l} onChange={reload} /> : <AdReplyPanel listing={l} />)
          : (isOwner ? <OwnerPanel listing={l} onChange={reload} /> : <OfferPanel listing={l} />)}
        {!isOwner && user && <ReportLink listingId={l.id} />}
      </aside>
    </div>
    {isOwner && !ad && <CompareOffers listing={l} />}
    {isOwner && !ad && l.status === 'open' && (l.offerCount ?? 0) > 0 && <ChoosingSteps />}
    {/* The buyer sees every offer above; everyone else sees who answered. */}
    {!isOwner && !ad && <WhoAnswered listing={l} isOwner={false} />}
    </>
  );
}

// Housing and Jobs ads (session 82): reply to the advertiser in a private
// chat about this ad. No price or offer: just a message (and a photo).
function AdReplyPanel({ listing }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const jobs = listing.section === 'jobs';
  const warn = jobs
    ? t('Real employers never ask you to pay for a visa, training or a uniform.')
    : t('Never pay a deposit before you have seen the place and met the owner.');

  if (listing.status !== 'open') return <div className="card"><p className="muted">{t('This ad is no longer open.')}</p></div>;
  if (listing.myConversationId) {
    return (
      <div className="card">
        <h2>{t('You replied to this ad')}</h2>
        <Link className="btn block" to={`/messages/${listing.myConversationId}`}>{t('Open conversation')}</Link>
      </div>
    );
  }
  if (!isVerified(user)) return <div className="card"><h2>{jobs ? t('Apply for this job') : t('Interested?')}</h2><VerifyPrompt action="reply" /><p className="hint">{warn}</p></div>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('message', message);
      const { conversation } = await api(`/listings/${listing.id}/contact`, { method: 'POST', form: fd });
      celebrate({ text: t("Sent! You'll be notified when they reply.") });
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
      <h2>{jobs ? t('Apply for this job') : t('Interested? Send a message')}</h2>
      <p className="muted small">{tj('Your message goes privately to {name}. Your number and email stay hidden.', { name: <bdi>{listing.buyer.displayName}</bdi> })}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="message">{t('Message')}</label>
        <textarea id="message" required minLength={2} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={jobs ? t('Your experience, when you can start, and a good time to talk…') : t('When you would like to view it, how long you want to stay, who will live there…')} />
        {hasContacts(message) && <ContactNudge />}
      </div>
      <button className="btn block" disabled={busy}>{busy ? t('Sending…') : t('Send message')}</button>
      <p className="hint"><Icon name="warning" /> {warn}</p>
    </form>
  );
}

// The advertiser's panel on their own ad: replies, edit, taken, close.
function AdOwnerPanel({ listing, onChange }) {
  const { data } = useApi(`/listings/${listing.id}/conversations`);
  const [error, setError] = useState(null);
  const replies = data?.conversations ?? [];
  async function setStatus(status, message) {
    if (message && !window.confirm(message)) return;
    setError(null);
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
        <h2>{t('Your ad')}</h2>
        {listing.status === 'open' && <p className="small muted"><Icon name="eye" /> {tn(listing.viewCount ?? 0, '{n} person looked at it', '{n} people looked at it')} · <Icon name="chat" /> {tn(replies.length, '{n} reply', '{n} replies')}</p>}
        <ErrorBox error={error} />
        {listing.status === 'open' ? (
          <div className="stack">
            <Link className="btn secondary block" to={`/requests/${listing.id}/edit`}>{t('Edit')}</Link>
            <button className="btn ok block" onClick={() => setStatus('fulfilled', listing.section === 'jobs' ? t('Mark the job as filled? The ad will close.') : t('Mark the place as rented? The ad will close.'))}>
              {listing.section === 'jobs' ? t('Job filled') : t('Rented')}
            </button>
            <button className="btn secondary block" onClick={() => setStatus('closed', t('Close this ad? Conversations about it will become read-only.'))}>{t('Close ad')}</button>
          </div>
        ) : (
          <button className="btn secondary block" onClick={() => setStatus('open', t('Reopen this ad?'))}>{t('Reopen ad')}</button>
        )}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>{t('Replies ({count})', { count: replies.length })}</h2>
        {!data ? <p className="muted" style={{ padding: '1rem' }}>{t('Loading…')}</p> : replies.length === 0 ? (
          <p className="muted" style={{ padding: '0 1rem 1rem' }}>{t('No replies yet. People who are interested will message you here.')}</p>
        ) : replies.map((c) => (
          <Link key={c.id} className="inbox-item" to={`/messages/${c.id}`}>
            <Avatar name={c.other.displayName} src={c.other.avatarUrl} />
            <div>
              <b><bdi>{c.other.displayName}</bdi></b>
              <div><RatingBadge rating={c.other.rating} /> <span className="muted small">· {ago(c.lastMessageAt)}</span></div>
            </div>
          </Link>
        ))}
      </div>
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
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [video, setVideo] = useState(null); // optional short video of the item (session 58)
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (listing.status !== 'open') return <div className="card"><p className="muted">{t('This request is no longer accepting offers.')}</p></div>;
  if (listing.myConversationId) {
    return (
      <div className="card">
        <h2>{t("You've already made an offer")}</h2>
        {listing.myOffer && listing.myOffer.status !== 'message' && <OfferStatus status={listing.myOffer.status} />}
        <p className="muted">{tj('Continue the conversation with {name}.', { name: <bdi>{listing.buyer.displayName}</bdi> })}</p>
        <Link className="btn block" to={`/messages/${listing.myConversationId}`}>{t('Open conversation')}</Link>
      </div>
    );
  }
  if (!isVerified(user)) return <div className="card"><h2>{t('Have this?')}</h2><VerifyPrompt action="contact" /></div>;
  if (listing.contactBlocked) {
    const why = {
      shops: t('The buyer chose to hear from shops only.'),
      rated: t('The buyer chose to hear from sellers rated 4★ or more. Finish a few deals well and you can answer requests like this.'),
      favourites: t("The buyer chose to hear only from their favourite sellers."),
    }[listing.contactBlocked];
    return <div className="card"><h2>{t('Have this?')}</h2><p className="muted">{why}</p></div>;
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('message', message);
      if (offerPrice !== '') { fd.append('offerPrice', offerPrice); addDetails(fd, details); }
      if (photos[0]) fd.append('image', photos[0]);
      if (video) fd.append('video', video);
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
        <label htmlFor="offerPrice">{t('Your price ({currency})', { currency: currencyName(listing.currency) })} <span className="muted">{t('(optional)')}</span></label>
        <input id="offerPrice" type="number" min="0" step="1" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} />
      </div>
      {offerPrice !== '' && <OfferDetailFields value={details} onChange={setDetails} />}
      <div className="field">
        <label htmlFor="message">{t('Message')}</label>
        <textarea id="message" required maxLength={2000} placeholder={t('Describe what you have: condition, photos available, when you can deliver…')} value={message} onChange={(e) => setMessage(e.target.value)} />
        {hasContacts(message) && <ContactNudge />}
      </div>
      <div className="field">
        <label>{t('Photo of your item')} <span className="muted">{t('(optional)')}</span></label>
        <PhotoPicker id="offerPhoto" files={photos} onChange={setPhotos} max={1} />
      </div>
      <div className="field">
        <label htmlFor="offerVideo">{t('Short video of your item')} <span className="muted">{t('(optional, up to 1 minute)')}</span></label>
        {video ? <VideoPreview file={video} onRemove={() => setVideo(null)} /> : (
          <input id="offerVideo" type="file" accept="video/mp4,video/quicktime,video/webm"
            onChange={async (e) => {
              const f = e.target.files[0]; e.target.value = '';
              if (!f) return;
              const picked = await pickVideo(f);
              if (picked.error) setError(new Error(picked.error)); else { setError(null); setVideo(picked.file); }
            }} />
        )}
        <div className="hint">{t('Show it working: only this buyer can watch it.')}</div>
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
        celebrate({ text: conversationId ? t("Found it! Don't forget to rate the seller.") : t('Glad you found it!'), confetti: true });
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
        {listing.status === 'open' && (
          <p className="small muted">
            <Icon name="eye" /> {tn(listing.viewCount ?? 0, '{n} person looked at it', '{n} people looked at it')} · <Icon name="chat" /> {tn(offers.length, '{n} offer', '{n} offers')}
            {(listing.viewCount ?? 0) === 0 && <> · {t('Share it to reach more sellers.')}</>}
          </p>
        )}
        {listing.status === 'open' && listing.expiresAt && <ExpiryLine listing={listing} onChange={onChange} />}
        {listing.status === 'open' && <Tips listing={listing} offers={offers.length} />}
        {listing.status === 'open' && <RaiseBudget listing={listing} onChange={onChange} />}
        {listing.status === 'closed' && listing.expiredAt && <p className="small muted">{t('This request closed by itself after 30 days. Reopen it if you are still looking.')}</p>}
        <ErrorBox error={error} />
        {listing.status === 'open' && !picking && (
          <div className="stack">
            <Link className="btn secondary block" to={`/requests/${listing.id}/edit`}>{t('Edit')}</Link>
            <button className="btn ok block" onClick={() => setPicking(true)}>{t('I found it!')}</button>
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
                <Icon name="deal" /> {tj('Bought from {name}.', { name: <b><bdi>{offers.find((c) => c.id === listing.dealConversationId)?.other.displayName ?? t('a seller')}</bdi></b> })}{' '}
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
      {saved ? t('Saved') : t('Save')}
    </button>
  );
}

// "Open until 21 Nov · Keep it open" (session 31). The button shows in
// the last week; it starts the 30 days again.
function ExpiryLine({ listing, onChange }) {
  const [busy, setBusy] = useState(false);
  const ends = toDate(listing.expiresAt);
  const soon = ends - Date.now() < 7 * 24 * 60 * 60 * 1000;
  async function renew() {
    setBusy(true);
    try {
      await api(`/listings/${listing.id}/renew`, { method: 'POST' });
      celebrate({ text: t('Kept open for another 30 days.') });
      onChange();
    } finally {
      setBusy(false);
    }
  }
  return (
    <p className={`small ${soon ? 'expiry-soon' : 'muted'}`}>
      <Icon name="hourglass" /> {t('Open until {date}', { date: formatDate(ends, { day: 'numeric', month: 'short' }) })}
      {soon && <> · <button type="button" className="linkish small" onClick={renew} disabled={busy}>{t('Keep it open')}</button></>}
    </p>
  );
}

// "Raise my budget" (session 37): once a day; sellers who looked at or
// saved the request are told.
function RaiseBudget({ listing, onChange }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { told } = await api(`/listings/${listing.id}/budget`, { method: 'POST', body: { budgetMax: amount } });
      celebrate({ text: tn(told, 'Budget raised. We told {n} seller who looked at it.', 'Budget raised. We told {n} sellers who looked at it.') });
      setOpen(false);
      setAmount('');
      onChange();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  if (!open) return <p className="small"><button type="button" className="linkish small" onClick={() => setOpen(true)}>{t('Raise my budget')}</button></p>;
  return (
    <form className="raise-budget" onSubmit={submit}>
      <ErrorBox error={error} />
      <label htmlFor="raiseBudget" className="small">{t('New top budget ({currency})', { currency: currencyName(listing.currency) })}</label>
      <div className="row">
        <input id="raiseBudget" type="number" min={(listing.budgetMax ?? listing.budgetMin ?? 0) + 1} required value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 120 }} />
        <button className="btn sm" disabled={busy || amount === ''}>{t('Raise')}</button>
        <button type="button" className="btn sm secondary" onClick={() => setOpen(false)}>{t('Cancel')}</button>
      </div>
      <p className="hint" style={{ margin: 0 }}>{t('Sellers who looked at or saved your request are told. Once a day.')}</p>
    </form>
  );
}

// Tips to get more offers (session 31): at most 2, only the useful ones.
const TIPS = {
  photo: () => t('Add a photo: requests with one get more offers.'),
  details: () => t('Add a few more details (size, model, condition) so sellers know exactly what you want.'),
  budget: () => t('Add a budget: sellers answer faster when they know what you can spend.'),
  quiet: () => t('No offers yet? Try a wider budget or area, or share it.'),
  share: () => t('Nobody has looked yet. Share it on WhatsApp to reach more sellers.'),
};
function Tips({ listing, offers }) {
  const tips = requestTips(listing, { offers, views: listing.viewCount ?? 0 });
  if (!tips.length) return null;
  return (
    <div className="tips">
      <b>{t('Tips to get more offers')}</b>
      <ul>
        {tips.map((k) => <li key={k}>{TIPS[k]()}</li>)}
      </ul>
      <Link className="small" to={`/requests/${listing.id}/edit`}>{t('Edit request')} <span className="flip">→</span></Link>
    </div>
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
      {sent ? <span className="muted">{t('Thanks — our team will review it.')}</span> : <button className="linkish" onClick={report}>{t('Report')}</button>}
    </p>
  );
}


// Where a seller's offer stands (session 77): Sent → Seen → Accepted/Declined.
function OfferStatus({ status }) {
  const steps = [['sent', t('Sent')], ['seen', t('Seen by the buyer')], [status === 'declined' ? 'declined' : 'accepted', status === 'declined' ? t('Declined') : t('Accepted')]];
  const reached = { sent: 1, seen: 2, accepted: 3, declined: 3 }[status] ?? 1;
  return (
    <ol className="offer-status">
      {steps.map(([key, label], i) => (
        <li key={key} className={`${i < reached ? 'done' : ''} ${key === 'declined' && i < reached ? 'declined' : ''}`}>{label}</li>
      ))}
    </ol>
  );
}

// What happens when the buyer chooses an offer (session 77).
function ChoosingSteps() {
  return (
    <section className="card choosing">
      <h2>{t('What happens when you choose an offer')}</h2>
      <ol>
        <li>{t('Open the offer’s chat and press Accept. You both agree the price and to finish the deal on Unc.')}</li>
        <li>{t('Phone numbers unlock in that chat. Agree on pickup or delivery.')}</li>
        <li>{t('Pay the seller when you get the item, or in parts if you both agreed a plan.')}</li>
        <li>{t('Press “I found it” and rate each other. The other sellers are told the request is closed.')}</li>
      </ol>
    </section>
  );
}

// Who answered (session 77, the owner's choice): shops and finders with
// rating, area and reply speed; prices stay private to the buyer.
function WhoAnswered({ listing, isOwner }) {
  const list = listing.responders ?? [];
  return (
    <section className="who-answered">
      <div className="section-head">
        <h2>{t('Who answered')}</h2>
        <span className="muted small">{isOwner ? t('Prices are in each chat and in Compare offers. Only you see them.') : t('Prices are private to the buyer.')}</span>
      </div>
      {list.length === 0 ? <p className="muted">{t('No offers yet. Be the first.')}</p> : (
        <ul className="responder-list">
          {list.map((r) => (
            <li key={r.id}>
              <Avatar name={r.displayName} src={r.avatarUrl} size={40} />
              <div className="responder-main">
                <Link to={`/members/${r.id}`}><b><bdi>{r.displayName}</bdi></b></Link>{' '}
                <span className="verified-tick" title={t('Identity checked by Unc')}><Icon name="check" /></span>
                <div className="muted small">
                  {r.accountType === 'business' ? t('Shop') : t('Finder')}
                  {r.area && <> · <bdi>{r.area}</bdi></>}
                  {r.rating?.count > 0 && <> · <Icon name="star" /> {r.rating.average.toFixed(1)} ({r.rating.count})</>}
                  {replyLabel(r.replyTime) && <> · {replyLabel(r.replyTime)}</>}
                </div>
              </div>
              <span className="muted small">{ago(r.answeredAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
