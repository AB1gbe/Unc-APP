// Live counters (session 56): "3 members active now · 5 requests posted
// today · 2 offers made today". Real numbers from GET /api/feed/pulse;
// a count of 0 isn't shown, and nothing shows when everything is 0.
import { useApi } from '../hooks.js';
import Icon from './Icon.jsx';
import { tn } from '../i18n.jsx';

export default function LivePulse() {
  const { data } = useApi('/feed/pulse');
  if (!data) return null;
  const parts = [
    data.active > 0 && <span key="active" className="pulse-item"><span className="pulse-dot" aria-hidden />{tn(data.active, '{n} member active now', '{n} members active now')}</span>,
    data.requests > 0 && <span key="requests" className="pulse-item"><Icon name="note" /> {tn(data.requests, '{n} request posted today', '{n} requests posted today')}</span>,
    data.offers > 0 && <span key="offers" className="pulse-item"><Icon name="chat" /> {tn(data.offers, '{n} offer made today', '{n} offers made today')}</span>,
  ].filter(Boolean);
  if (!parts.length) return null;
  return <div className="live-pulse" role="status">{parts}</div>;
}
