// Refer a friend (session 58): my invite link, how to share it, and how it
// is going (counts only: I don't see who joined). The friend must be fully
// verified before anyone gets credit, so fake accounts earn nothing.
import { useState } from 'react';
import { moneyExact } from '../api.js';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useApi } from '../hooks.js';
import { t } from '../i18n.jsx';

export default function Invite() {
  const { data, error, loading } = useApi('/referrals');
  const [copied, setCopied] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const credit = (fils) => moneyExact(fils / 1000, data.currency);
  // Built from the address this page was opened at, so it works on a phone
  // test address too (the server's APP_URL may still say localhost).
  const link = `${window.location.origin}/register?ref=${data.code}`;
  const message = t('Join me on Unc: post what you need and verified sellers come to you with offers. {link}', { link });

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setCopied(false); }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Unc', text: message }); } catch { /* closed the share sheet */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    }
  }

  return (
    <div className="narrow" style={{ maxWidth: 680 }}>
      <div className="card invite">
        <h1>{t('🎁 Invite friends to Unc')}</h1>
        <p>{t('You get {reward} of Unc credit for every friend who joins with your link and gets verified. They get {welcome} too.', { reward: credit(data.reward), welcome: credit(data.welcome) })}</p>
        <label htmlFor="inviteLink" className="small">{t('Your invite link')}</label>
        <div className="row invite-link">
          <input id="inviteLink" className="ltr" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn secondary" onClick={copy}>{copied ? t('Copied ✓') : t('Copy')}</button>
          <button type="button" className="btn" onClick={share}>{t('Share')}</button>
        </div>
        <div className="stat-tiles invite-stats">
          <div className="stat-tile"><div className="muted small">{t('Joined')}</div><div className="stat-value">{data.joined}</div></div>
          <div className="stat-tile"><div className="muted small">{t('Verified')}</div><div className="stat-value">{data.verified}</div></div>
          <div className="stat-tile"><div className="muted small">{t('Credit earned')}</div><div className="stat-value">{credit(data.earned)}</div></div>
        </div>
        <h2>{t('How it works')}</h2>
        <ol className="small">
          <li>{t('Share your link with a friend.')}</li>
          <li>{t('They sign up with it, confirm their email, pass the identity check and add a card.')}</li>
          <li>{t('You both get Unc credit in your wallet. It counts towards Unc fees once Unc starts charging them.')}</li>
        </ol>
        <p className="hint">{t('You see how many friends joined, never who. One real person can only have one account, so invites to yourself earn nothing.')}</p>
      </div>
    </div>
  );
}
