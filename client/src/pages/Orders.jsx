// Orders (session 58): every chat where a price was accepted or a deal was
// recorded, in two tabs like a shop's orders page. Each one says where it
// stands and links to its chat. Payment still goes directly between the
// two people (Tap Payments is not connected yet).
import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Link } from 'react-router-dom';
import { ago, money } from '../api.js';
import { Avatar, ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t, tj, tn } from '../i18n.jsx';

const STAGE = {
  agreed: () => ['warn', t('Price agreed · not marked found yet')],
  paying: () => ['warn', t('Paying in parts')],
  rate: () => ['warn', t('Rate them')],
  done: () => ['ok', t('Done')],
  ended: () => ['grey', t('Closed without this deal')],
};

export default function Orders() {
  const [tab, setTab] = useState('inProgress');
  const { data, error, loading } = useApi('/orders');
  const list = data?.[tab] ?? [];
  return (
    <div className="narrow" style={{ maxWidth: 760 }}>
      <h1>{t('Orders')}</h1>
      <div className="tabs" role="tablist">
        {[['inProgress', t('In progress')], ['completed', t('Completed')]].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {label}{data && <span className="muted"> ({data[k].length})</span>}
          </button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : list.length === 0 ? (
        <div className="card empty">
          <Icon name="box" size="1.6em" /> <b>{t('No orders here yet')}</b>
          <p className="muted">{tab === 'inProgress' ? t('When you and a seller (or a buyer) agree a price, it shows here until it is done.') : t('Finished deals show here.')}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {list.map((o) => {
            const [tone, label] = STAGE[o.stage]();
            return (
              <Link key={o.conversationId} className="inbox-item order-row" to={`/messages/${o.conversationId}`}>
                {o.listing.photoUrl ? <img className="order-photo" src={o.listing.photoUrl} alt="" loading="lazy" /> : <Avatar name={o.other.displayName} src={o.other.avatarUrl} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b dir="auto">{o.listing.title}</b>
                  <div className="small muted">
                    {tj(o.myRole === 'buyer' ? 'From {name}' : 'To {name}', { name: <bdi>{o.other.displayName}</bdi> })}
                    {o.price != null && <> · {money(o.price, o.currency)}</>} · {ago(o.at)}
                  </div>
                  <span className={`badge ${tone}`}>{label}</span>
                  {o.plan?.status === 'active' && <span className="small muted"> {tn(o.plan.partsLeft, '{n} payment left', '{n} payments left')}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <p className="hint">{t('Payment goes directly between you for now. Paying through Unc is coming.')}</p>
    </div>
  );
}
