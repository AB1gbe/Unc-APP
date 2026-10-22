// "Compare offers" (session 31): every offer on the buyer's request side by
// side, so choosing is easy. Only the request's buyer gets this data.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../api.js';
import { useApi } from '../hooks.js';
import { Avatar, Badges, RatingBadge } from './ui.jsx';
import { t } from '../i18n.jsx';

const REPLY = {
  hour: () => t('within an hour'),
  hours: () => t('within a few hours'),
  day: () => t('within a day'),
  days: () => t('in a few days'),
};
const SORTS = {
  price: (a, b) => (a.c.price ?? Infinity) - (b.c.price ?? Infinity),
  rating: (a, b) => (b.o.other.rating?.average ?? 0) - (a.o.other.rating?.average ?? 0),
  reply: (a, b) => ['hour', 'hours', 'day', 'days', null].indexOf(a.c.replyTime) - ['hour', 'hours', 'day', 'days', null].indexOf(b.c.replyTime),
};

export default function CompareOffers({ listing }) {
  const { data } = useApi(`/listings/${listing.id}/conversations`);
  const [sort, setSort] = useState('price');
  const rows = (data?.conversations ?? []).map((o) => ({ o, c: o.compare })).sort(SORTS[sort]);
  if (rows.length < 2) return null;
  const cheapest = Math.min(...rows.map((r) => r.c.price ?? Infinity));

  return (
    <section className="card compare" style={{ marginTop: '1.5rem' }}>
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{t('Compare offers')}</h2>
        <label className="compare-sort small">
          {t('Sort by')}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price">{t('Lowest price')}</option>
            <option value="rating">{t('Best rating')}</option>
            <option value="reply">{t('Fastest replies')}</option>
          </select>
        </label>
      </div>
      <div className="compare-grid">
        {rows.map(({ o, c }) => (
          <Link key={o.id} to={`/messages/${o.id}`} className={`compare-item ${o.id === listing.dealConversationId ? 'deal' : ''}`}>
            {c.photoUrl ? <img src={c.photoUrl} alt="" loading="lazy" /> : <div className="compare-nophoto" aria-hidden>📦</div>}
            <div className="compare-body">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <Avatar name={o.other.displayName} src={o.other.avatarUrl} size={32} />
                <b><bdi>{o.other.displayName}</bdi></b>
                {c.unread > 0 && <span className="unread-dot">{c.unread}</span>}
              </div>
              <div className="compare-price">
                {c.agreedPrice != null
                  ? <span className="badge ok">{t('Agreed: {price}', { price: money(c.agreedPrice, listing.currency) })}</span>
                  : c.price != null
                    ? <>{money(c.price, listing.currency)} {c.price === cheapest && <span className="badge">{t('Lowest')}</span>}</>
                    : <span className="muted small">{t('No price yet')}</span>}
              </div>
              <dl>
                <dt>{t('Rating')}</dt><dd><RatingBadge rating={o.other.rating} /></dd>
                <dt>{t('Replies')}</dt><dd>{c.replyTime ? REPLY[c.replyTime]() : <span className="muted">{t('Not enough chats yet')}</span>}</dd>
              </dl>
              <Badges badges={c.badges} />
              {c.firstMessage && <p className="small muted compare-msg" dir="auto">{c.firstMessage}</p>}
              <span className="small">{t('Open chat')} <span className="flip">→</span></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
