// The wallet (session 58): Unc credit and its history. Not real money yet:
// it can't be paid out, and it will count towards Unc's fees once Unc
// charges any (after Tap Payments is connected).
import { Link } from 'react-router-dom';
import { moneyExact, toDate } from '../api.js';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { formatDate, t } from '../i18n.jsx';

const REASON = {
  referral: () => t('A friend you invited joined and got verified 🎉'),
  'referral-welcome': () => t('Welcome credit for joining with a friend’s invite'),
};
const credit = (fils, currency) => moneyExact(fils / 1000, currency);

export default function Wallet() {
  const { data, error, loading } = useApi('/wallet');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="narrow" style={{ maxWidth: 680 }}>
      <h1>{t('My wallet')}</h1>
      <div className="card wallet-balance">
        <div className="muted small">{t('Unc credit')}</div>
        <div className="wallet-amount">{credit(data.balance, data.currency)}</div>
        <p className="small muted" style={{ margin: 0 }}>{t('Credit counts towards Unc fees once Unc starts charging them. It can’t be paid out.')}</p>
        <Link className="btn sm secondary" to="/invite" style={{ marginTop: '.75rem' }}>{t('🎁 Invite friends to earn credit')}</Link>
      </div>
      <h2>{t('History')}</h2>
      {data.entries.length === 0 ? <div className="card empty">{t('No credit yet.')}</div> : (
        <div className="card" style={{ padding: 0 }}>
          {data.entries.map((e, i) => (
            <div key={i} className="row spread wallet-entry">
              <span>{(REASON[e.reason] ?? (() => e.reason))()}<div className="small muted">{formatDate(toDate(e.createdAt))}</div></span>
              <b className={e.amount >= 0 ? 'plus' : 'minus'}>{e.amount >= 0 ? '+' : ''}{credit(e.amount, data.currency)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
