// "Your shop" on the Account page, business accounts only (session 24):
// cover photo, area and opening hours. No phone, website or email fields on
// purpose: buyers contact shops through their requests (the server also
// refuses contact details typed into the text).
import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { shrinkImage } from '../images.js';
import { ErrorBox } from './ui.jsx';
import { dayName } from './ShopHours.jsx';
import { t } from '../i18n.jsx';

const DEFAULT_DAY = { open: '09:00', close: '21:00' };

export default function ShopEditor() {
  const { user, setUser } = useAuth();
  const [area, setArea] = useState(user.shopArea ?? '');
  const [hours, setHours] = useState(() => user.shopHours ?? Array(7).fill(null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const setDay = (d, value) => { setHours((all) => all.map((h, i) => (i === d ? value : h))); setSaved(false); };

  async function run(fn) {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); }
  }
  const uploadCover = (e) => run(async () => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const fd = new FormData();
    fd.append('cover', await shrinkImage(f, 2000));
    setUser((await api('/auth/cover', { method: 'POST', form: fd })).user);
  });
  const removeCover = () => run(async () => setUser((await api('/auth/cover', { method: 'DELETE' })).user));
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      const shopHours = hours.some(Boolean) ? hours : null;
      setUser((await api('/auth/me', { method: 'PATCH', body: { shopArea: area, shopHours } })).user);
      setSaved(true);
    });
  };

  return (
    <form className="card shop-editor" onSubmit={save}>
      <h2>{t('Your shop page')}</h2>
      <p className="muted small">{t('Business accounts get a shop page. Buyers still contact you only through their requests, so phone numbers, links and emails are not allowed here.')}</p>
      <ErrorBox error={error} />

      <label>{t('Cover photo')}</label>
      {user.coverUrl ? <img className="shop-cover-preview" src={user.coverUrl} alt="" /> : <div className="shop-cover-preview empty">{t('A wide photo of your shop front or products.')}</div>}
      <div className="row" style={{ margin: '.5rem 0 1rem' }}>
        <label className="btn sm secondary" style={{ margin: 0 }}>
          {user.coverUrl ? t('Change cover') : t('Add a cover photo')}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadCover} data-testid="cover-input" />
        </label>
        {user.coverUrl && <button type="button" className="linkish" onClick={removeCover} disabled={busy}>{t('Remove')}</button>}
      </div>

      <label htmlFor="shopArea">{t('Area')}</label>
      <input id="shopArea" dir="auto" maxLength={80} value={area} placeholder={t('e.g. Seef, Manama')} onChange={(e) => { setArea(e.target.value); setSaved(false); }} />
      <p className="hint">{t('Shown with a map link. A neighbourhood or block is enough.')}</p>

      <label>{t('Opening hours')}</label>
      <div className="hours-editor">
        {hours.map((h, d) => (
          <div key={d} className="hours-row">
            <label className="toggle-row">
              <input type="checkbox" checked={Boolean(h)} onChange={(e) => setDay(d, e.target.checked ? (hours.find(Boolean) ?? DEFAULT_DAY) : null)} />
              <span>{dayName(d)}</span>
            </label>
            {h ? (
              <span className="row hours-times">
                <input type="time" value={h.open} required aria-label={t('Opens at')} onChange={(e) => setDay(d, { ...h, open: e.target.value })} />
                <span>–</span>
                <input type="time" value={h.close} required aria-label={t('Closes at')} onChange={(e) => setDay(d, { ...h, close: e.target.value })} />
              </span>
            ) : <span className="muted small">{t('Closed')}</span>}
          </div>
        ))}
      </div>
      <p className="hint">{t('Closing earlier than opening means you close after midnight.')}</p>
      <div className="row">
        <button className="btn" disabled={busy}>{t('Save shop page')}</button>
        {saved && <span className="small" role="status">{t('Saved ✓')}</span>}
      </div>
    </form>
  );
}
