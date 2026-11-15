// Confirm a Bahrain mobile number with a texted code (session 102,
// ADR-082). Enough for a person to sell their own things or ask for
// something; Housing, Jobs and businesses still need the ID check.
import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from './ui.jsx';
import { t, tj } from '../i18n.jsx';

export default function PhoneCheck() {
  const { setUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(null); // { phone, devCode? }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(fn) {
    setBusy(true); setError(null);
    try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); }
  }
  const send = (e) => { e.preventDefault(); run(async () => { setSent(await api('/auth/phone', { method: 'POST', body: { phone } })); setCode(''); }); };
  const verify = (e) => { e.preventDefault(); run(async () => { setUser((await api('/auth/phone/verify', { method: 'POST', body: { code } })).user); }); };

  return (
    <div className="phone-check">
      <h2>{t('Confirm your mobile number')}</h2>
      <p className="muted">{t('To sell your own things or ask for something, confirm a Bahrain mobile number. We text you a 6-digit code. Your number is never shown to anyone.')}</p>
      <ErrorBox error={error} />
      {!sent ? (
        <form onSubmit={send}>
          <label htmlFor="phone">{t('Mobile number')}</label>
          <div className="phone-row" dir="ltr">
            <span className="phone-prefix ltr">+973</span>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" required placeholder="3xxx xxxx" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button className="btn ok" disabled={busy}>{t('Text me a code')}</button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p>{tj('We sent a code to {phone}.', { phone: <b className="ltr">{sent.phone}</b> })}</p>
          {sent.devCode && <div className="alert info small">{tj('Test site: your code is {code} (no text is really sent).', { code: <b className="ltr">{sent.devCode}</b> })}</div>}
          <label htmlFor="phone-code">{t('Code')}</label>
          <input id="phone-code" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} pattern="[0-9]{6}" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <div className="row">
            <button className="btn ok" disabled={busy}>{t('Confirm')}</button>
            <button type="button" className="btn secondary" onClick={() => setSent(null)}>{t('Use a different number')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
