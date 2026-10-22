// The 🔔 page. Opening it marks everything as read; the ones that were new
// stay highlighted until you leave. The wording lives here (not on the
// server) so it shows in the reader's language.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, ago } from '../api.js';
import { Avatar, ErrorBox, Loading } from '../components/ui.jsx';
import PushSettings from '../components/PushSettings.jsx';
import { useApi } from '../hooks.js';
import { t, tj } from '../i18n.jsx';

function describe(n) {
  const name = <b><bdi>{n.actor?.displayName ?? t('A member')}</bdi></b>;
  const title = <bdi>{n.listing?.title ?? ''}</bdi>;
  const chat = n.conversationId ? `/messages/${n.conversationId}` : '/messages';
  switch (n.kind) {
    case 'offer': return [tj('{name} made an offer on “{title}”', { name, title }), chat];
    case 'deal': return [tj('{name} picked your offer for “{title}”. Deal done! 🤝', { name, title }), chat];
    case 'rating': return [tj('{name} rated your deal on “{title}”.', { name, title }), chat];
    case 'favourite-request': return [tj('{name}, who favourited you, is looking for “{title}”. Make an offer?', { name, title }), `/requests/${n.listing?.id}`];
    case 'alert-match': return [tj('New request matching your alert: “{title}”', { title }), `/requests/${n.listing?.id}`];
    case 'expiring': return [tj('Still looking for “{title}”? It closes in 3 days. Open it to keep it going.', { title }), `/requests/${n.listing?.id}`];
    case 'expired': return [tj('“{title}” closed after 30 days. You can reopen it any time.', { title }), `/requests/${n.listing?.id}`];
    case 'found-elsewhere': return [tj('{name} found what they needed for “{title}”. Thanks for your offer 🙏', { name, title }), chat];
    case 'request-closed': return [tj('“{title}” is closed now. Thanks for your offer 🙏', { title }), chat];
    case 'report-action': return [n.listing ? tj('Thanks for your report about “{title}”. Our team looked at it and took action.', { title }) : t('Thanks for your report. Our team looked at it and took action.'), n.listing ? `/requests/${n.listing.id}` : '/'];
    case 'report-no-action': return [n.listing ? tj('Thanks for your report about “{title}”. Our team looked at it and found nothing against the rules this time.', { title }) : t('Thanks for your report. Our team looked at it and found nothing against the rules this time.'), '/'];
    case 'budget-raised': return [tj('{name} raised the budget for “{title}”. Take another look?', { name, title }), `/requests/${n.listing?.id}`];
    case 'kyc_approved': return [t('Your identity is verified ✓ You can now post requests and make offers.'), '/'];
    case 'kyc_rejected': return [t('Your identity check was not approved. See why and try again.'), '/verification'];
    default: return [n.kind, '/'];
  }
}

const ICON = { offer: '💬', deal: '🤝', rating: '★', kyc_approved: '✓', kyc_rejected: '!', 'favourite-request': '♥', 'alert-match': '🔔', expiring: '⏳', expired: '⏳', 'found-elsewhere': '🙏', 'request-closed': '🙏', 'report-action': '⚑', 'report-no-action': '⚑', 'budget-raised': '💸' };

export default function Notifications() {
  const { data, error, loading } = useApi('/notifications');

  useEffect(() => {
    if (!data?.unread) return;
    api('/notifications/read', { method: 'POST' })
      .then(() => window.dispatchEvent(new Event('unc:read')))
      .catch(() => {});
  }, [data]);

  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <h1>{t('Notifications')}</h1>
      <PushSettings hideWhenOn />
      <ErrorBox error={error} />
      {loading ? <Loading /> : data?.notifications.length === 0 ? (
        <div className="card empty">{t('Nothing yet. Offers, deals, ratings and identity check results will show up here.')}</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {data?.notifications.map((n) => {
            const [text, to] = describe(n);
            return (
              <Link key={n.id} to={to} className={`inbox-item ${n.read ? '' : 'unread'}`}>
                {n.actor
                  ? <Avatar name={n.actor.displayName} src={n.actor.avatarUrl} />
                  : <div className="avatar" aria-hidden>{ICON[n.kind]}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>{text}</div>
                  <div className="muted small">{n.actor && <>{ICON[n.kind]} · </>}{ago(n.createdAt)}</div>
                </div>
                {!n.read && <span className="new-dot" role="img" aria-label={t('New')} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
