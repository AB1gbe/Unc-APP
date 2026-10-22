// Add or replace the payment card (session 40). Everyone adds one when
// joining. Showcase ('test' provider): the form below makes a token in the
// browser and sends only that; with Tap connected, Tap's own card form
// takes this form's place and returns the token.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { celebrate } from '../components/Celebrate.jsx';
import { t } from '../i18n.jsx';
import { brandOf, luhnOk, readExpiry, testToken } from '../cards.js';

export default function PaymentCard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const brand = brandOf(form.number);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!luhnOk(form.number) || !brand) return setError(new Error(t('Please check the card number.')));
    if (!readExpiry(form.expiry)) return setError(new Error(t('Please enter the expiry as MM/YY.')));
    if (!/^\d{3,4}$/.test(form.cvc)) return setError(new Error(t('Please check the security code.')));
    setBusy(true);
    try {
      await api('/payments/card', { method: 'POST', body: { token: testToken(form.number, form.expiry) } });
      setUser((await api('/auth/me')).user);
      celebrate({ text: t('Card added ✓') });
      navigate(params.get('next') || (user.kycStatus === 'approved' ? '/' : '/verification'));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="narrow card" onSubmit={submit} autoComplete="on">
      <h1>{user.hasCard ? t('Replace your payment card') : t('Add a payment card')}</h1>
      <p className="muted">{t('Every member adds a card, so people who break the rules can be held to them. Nothing is charged now.')}</p>
      <p className="alert info small">{t('Showcase mode: no real card is checked or charged. Try 4242 4242 4242 4242, any future date and any 3 digits. 4000 0000 0000 0002 shows a declined card.')}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="cardNumber">{t('Card number')} {brand && <span className="badge grey"><bdi>{brand.toUpperCase()}</bdi></span>}</label>
        <input id="cardNumber" className="ltr" inputMode="numeric" autoComplete="cc-number" required maxLength={23} value={form.number} onChange={set('number')} placeholder="1234 5678 9012 3456" />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="cardExpiry">{t('Expiry (MM/YY)')}</label>
          <input id="cardExpiry" className="ltr" inputMode="numeric" autoComplete="cc-exp" required maxLength={5} value={form.expiry} onChange={set('expiry')} placeholder="12/29" />
        </div>
        <div className="field">
          <label htmlFor="cardCvc">{t('Security code')}</label>
          <input id="cardCvc" className="ltr" inputMode="numeric" autoComplete="cc-csc" required maxLength={4} value={form.cvc} onChange={set('cvc')} placeholder="123" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cardName">{t('Name on card')}</label>
        <input id="cardName" autoComplete="cc-name" required maxLength={80} value={form.name} onChange={set('name')} />
      </div>
      <button className="btn block" disabled={busy}>{busy ? t('Saving…') : t('Save card')}</button>
      <p className="hint">{t('🔒 Your card number goes only to our payment company (Tap Payments). Unc keeps just the last 4 digits and the expiry.')}</p>
    </form>
  );
}
