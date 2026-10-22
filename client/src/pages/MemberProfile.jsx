// Public profile: who someone is and what others said about them after
// deals. There is deliberately NO "message" button - members can only be
// contacted about a specific request.
import { Link, useParams } from 'react-router-dom';
import { ago, toDate } from '../api.js';
import { Activity, Avatar, Badges, ErrorBox, KycBadge, ListingCard, Loading, Stars } from '../components/ui.jsx';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { formatDate, t, tj, tn } from '../i18n.jsx';
import { StoryCard } from '../components/Stories.jsx';
import ShopHours, { OpenNow } from '../components/ShopHours.jsx';
import FavouriteButton from '../components/FavouriteButton.jsx';
import { Place } from '../components/CityField.jsx';

export default function MemberProfile() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/members/${id}`);
  const { user } = useAuth();
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { member: m, reviews, openRequests, stories = [] } = data;
  const isMe = user?.id === m.id;

  return (
    <div className="narrow stack" style={{ maxWidth: 720 }}>
      <div className={`card ${m.coverUrl ? 'has-cover' : ''}`}>
        {m.coverUrl && <img className="shop-cover" src={m.coverUrl} alt="" />}
        <div className="row profile-head">
          <Avatar name={m.displayName} src={m.avatarUrl} size={96} />
          <div style={{ flex: 1 }}>
            <h1 dir="auto" style={{ margin: 0 }}>{m.displayName}</h1>
            <div className="meta">
              <KycBadge status="approved" />
              {m.accountType === 'business' && <span className="badge grey">{t('Business')}</span>}
              <span>{t('Member since {date}', { date: formatDate(toDate(m.memberSince), { month: 'long', year: 'numeric' }) })}</span>
              <span>{tn(m.deals, '{n} deal', '{n} deals')}</span>
            </div>
            <Badges badges={m.badges} />
            {(user && !isMe) || m.favouriteCount > 0 ? (
              <div className="row" style={{ marginTop: '.4rem', gap: '.5rem' }}>
                {user && !isMe && <FavouriteButton memberId={m.id} initial={m.favourite} />}
                {m.favouriteCount > 0 && <span className="muted small">{tn(m.favouriteCount, '♥ {n} member favourited this seller', '♥ {n} members favourited this seller')}</span>}
              </div>
            ) : null}
            {m.shopArea ? (
              <div className="muted small" style={{ marginTop: '.3rem' }}>
                📍 <bdi>{m.shopArea}</bdi> ·{' '}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.shopArea)}`} target="_blank" rel="noreferrer">{t('Map')} ↗</a>
              </div>
            ) : m.city && <div className="muted small" style={{ marginTop: '.3rem' }}>📍 <Place city={m.city} /></div>}
            {m.shopHours && <div className="small" style={{ marginTop: '.3rem' }}><OpenNow hours={m.shopHours} /></div>}
            <div style={{ marginTop: '.3rem' }}><Activity activity={m.activity} /></div>
          </div>
          <div className="center profile-rating">
            {m.rating.count ? (
              <>
                <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{m.rating.average.toFixed(1)}</div>
                <Stars value={m.rating.average} />
                <div className="muted small">{tn(m.rating.count, '{n} rating', '{n} ratings')}</div>
              </>
            ) : <span className="muted small">{t('No ratings yet')}</span>}
          </div>
        </div>
      </div>
      {(m.bio || m.interests.length > 0 || isMe) && (
        <div className="card">
          <div className="row spread">
            <h2 style={{ margin: 0 }}>{tj('About {name}', { name: <bdi>{m.displayName}</bdi> })}</h2>
            {isMe && <Link className="btn sm secondary" to="/account">{t('Edit profile')}</Link>}
          </div>
          {m.bio ? <p className="bio" dir="auto">{m.bio}</p> : isMe && <p className="muted">{t('Add a few words about yourself so people know who they are dealing with.')}</p>}
          {m.interests.length > 0 && (
            <div className="chips" style={{ marginTop: '.75rem' }}>
              {m.interests.map((c) => <span key={c} className="chip">{t(c)}</span>)}
            </div>
          )}
        </div>
      )}
      {m.shopHours && <ShopHours hours={m.shopHours} />}
      {openRequests.length > 0 && (
        <div>
          <h2>{t('Looking for right now')}</h2>
          <div className="grid">{openRequests.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </div>
      )}
      {stories.length > 0 && (
        <div>
          <h2>{t('Found on Unc 🎉')}</h2>
          <div className="grid">{stories.map((s) => <StoryCard key={s.id} story={s} />)}</div>
        </div>
      )}
      <div className="card">
        <h2>{t('Reviews')}</h2>
        {reviews.length === 0 ? (
          <p className="muted">{t('No reviews yet. Reviews appear after completed deals.')}</p>
        ) : reviews.map((r, i) => (
          <div key={i} className="review">
            <div className="row spread">
              <span><Stars value={r.stars} /> <b><bdi>{r.from.displayName}</bdi></b> <span className="muted small">· {r.role === 'vendor' ? t('as seller') : t('as buyer')}</span></span>
              <span className="muted small">{ago(r.createdAt)}</span>
            </div>
            {r.comment && <p dir="auto" style={{ margin: '.3rem 0 0' }}>{r.comment}</p>}
            <div className="muted small">{tj('Deal: {title}', { title: <bdi>{r.listingTitle}</bdi> })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
