// The logged-in member's home: what needs attention, their requests, and
// requests they could help with. Logged-out visitors get Browse instead.
import { Link } from 'react-router-dom';
import { ago } from '../api.js';
import { useAuth, isVerified } from '../auth.jsx';
import { Avatar, CardsLoading, ListingCard, Loading, StatusBadge } from '../components/ui.jsx';
import { partOfDay, season } from '../seasons.js';
import { useApi } from '../hooks.js';
import { t, tj, tn } from '../i18n.jsx';

// Written out in full so the translation test can find every text.
const GREETING = {
  morning: (v) => tj('Good morning, {name}', v),
  afternoon: (v) => tj('Good afternoon, {name}', v),
  evening: (v) => tj('Good evening, {name}', v),
};
const SEASON = {
  ramadan: () => t('Ramadan Kareem 🌙 Wishing you a blessed month.'),
  'eid-fitr': () => t('Eid Mubarak! 🎉 Enjoy the celebrations.'),
  'eid-adha': () => t('Eid al-Adha Mubarak! 🎉'),
  'national-day': () => t('Happy National Day, Bahrain! 🇧🇭'),
};

export default function Home() {
  const { user } = useAuth();
  const convs = useApi('/conversations');
  const mine = useApi('/listings/mine');
  const forYou = useApi('/listings/for-you');
  const saved = useApi('/listings/saved');

  const conversations = convs.data?.conversations ?? [];
  const attention = conversations
    .filter((c) => c.unread > 0 || c.needsRating)
    .slice(0, 6);
  const openRequests = (mine.data?.listings ?? []).filter((l) => l.status === 'open');

  return (
    <div className="stack">
      <div className="row spread">
        <div className="row" style={{ flexWrap: 'nowrap', flex: 1, minWidth: 0 }}>
          <Avatar name={user.displayName} src={user.avatarUrl} size={48} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0 }}>{GREETING[partOfDay()]({ name: <bdi>{user.displayName}</bdi> })}</h1>
            <div className="muted small">{SEASON[season()]?.() ?? t('Here is what is happening with your requests and offers.')}</div>
          </div>
        </div>
        <Link className="btn hide-phone" to="/requests/new">{t('+ Post a request')}</Link>
      </div>

      <ProfileChecklist user={user} />

      <section className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>{t('Needs your attention')}</h2>
        {convs.loading ? <div style={{ padding: '0 1rem 1rem' }}><Loading /></div> : attention.length === 0 ? (
          <p className="muted" style={{ padding: '0 1rem 1rem' }}>{t("You're all caught up ✓")}</p>
        ) : attention.map((c) => (
          <Link key={c.id} to={`/messages/${c.id}`} className="inbox-item">
            <Avatar name={c.other.displayName} src={c.other.avatarUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                {c.needsRating
                  ? tj('Rate {name} for your deal', { name: <b><bdi>{c.other.displayName}</bdi></b> })
                  : c.myRole === 'buyer'
                    ? tj('New offer or message from {name}', { name: <b><bdi>{c.other.displayName}</bdi></b> })
                    : tj('{name} replied to your offer', { name: <b><bdi>{c.other.displayName}</bdi></b> })}
              </div>
              <div className="muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <bdi>{c.listing.title}</bdi> · {ago(c.lastMessageAt)}
              </div>
            </div>
            {c.needsRating ? <span className="badge warn">{t('★ Rate')}</span> : <span className="unread-dot">{c.unread}</span>}
          </Link>
        ))}
      </section>

      <section>
        <div className="row spread" style={{ marginBottom: '.6rem' }}>
          <h2 style={{ margin: 0 }}>{t('Your open requests')}</h2>
          <Link to="/my-requests">{t('See all')} <span className="flip">→</span></Link>
        </div>
        {mine.loading ? <CardsLoading /> : openRequests.length === 0 ? (
          <div className="card empty">
            <p>{t('Looking for something? Post it and let sellers come to you.')}</p>
            {isVerified(user) && <Link className="btn" to="/requests/new">{t('Post a request')}</Link>}
          </div>
        ) : (
          <div className="grid">
            {openRequests.slice(0, 3).map((l) => (
              <div key={l.id} style={{ position: 'relative' }}>
                <ListingCard listing={l} />
                <div style={{ position: 'absolute', top: '-8px', insetInlineEnd: '10px' }}><StatusBadge status={l.status} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {saved.data?.listings.length > 0 && (
        <section>
          <div className="row spread" style={{ marginBottom: '.6rem' }}>
            <h2 style={{ margin: 0 }}>{t('♥ Saved for later')}</h2>
            <Link to="/saved">{t('See all')} <span className="flip">→</span></Link>
          </div>
          <div className="grid">{saved.data.listings.slice(0, 3).map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </section>
      )}

      <section>
        <div className="row spread" style={{ marginBottom: '.6rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{t('Requests you could help with')}</h2>
            <div className="muted small">
              {forYou.data?.basedOnInterests
                ? t('Matched to your interests, nearest first.')
                : tj('Newest requests. {link} to see ones that match what you sell.', { link: <Link to="/account">{t('Add interests')}</Link> })}
            </div>
          </div>
          <Link to="/browse">{t('Browse all')} <span className="flip">→</span></Link>
        </div>
        {forYou.loading ? <CardsLoading /> : (forYou.data?.listings.length ?? 0) === 0 ? (
          <div className="card empty">{t("You're all caught up! New requests show up here as soon as they're posted.")}</div>
        ) : (
          <div className="grid">{forYou.data.listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        )}
      </section>
    </div>
  );
}

// "Your profile is 60% complete" with the missing steps as links.
function ProfileChecklist({ user }) {
  const steps = [
    [user.emailVerified, t('Confirm your email'), '/verify-email'],
    [Boolean(user.avatarUrl), t('Add a profile photo'), '/account'],
    [Boolean(user.bio), t('Write a few words about yourself'), '/account'],
    [user.interests?.length > 0, t('Choose your interests'), '/account'],
    [user.kycStatus === 'approved', user.kycStatus === 'pending' ? t('Identity check in review') : t('Verify your identity'), '/verification'],
  ];
  const done = steps.filter(([ok]) => ok).length;
  if (done === steps.length) return null;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <section className="card">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{t('Finish your profile')}</h2>
        <span className="muted small">{t('{pct}% complete', { pct })}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${pct}%` }} /></div>
      <p className="muted small">{tn(steps.length - done, '{n} step left — complete profiles get more replies.', '{n} steps left — complete profiles get more replies.')}</p>
      <div className="chips">
        {steps.filter(([ok]) => !ok).map(([, label, to]) => <Link key={label} className="chip" to={to}>{label}</Link>)}
      </div>
    </section>
  );
}
