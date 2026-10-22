// Edit your public profile: photo, name, city, short bio and interests.
// Used on the Account page and in the welcome steps after sign-up.
import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import { shrinkImage } from '../images.js';
import { Avatar, ErrorBox } from './ui.jsx';
import CityField from './CityField.jsx';

export default function ProfileEditor({ onSaved, submitLabel, extraButton }) {
  const { user, setUser } = useAuth();
  const { categories } = useMeta();
  const [form, setForm] = useState({
    displayName: user.displayName,
    city: user.city || '',
    bio: user.bio || '',
    interests: user.interests || [],
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSaved(false); };

  function toggle(category) {
    setSaved(false);
    setForm((f) => {
      const on = f.interests.includes(category);
      if (!on && f.interests.length >= 8) return f;
      return { ...f, interests: on ? f.interests.filter((c) => c !== category) : [...f.interests, category] };
    });
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('avatar', await shrinkImage(file, 512, 0.88));
      const { user: u } = await api('/auth/avatar', { method: 'POST', form: fd });
      setUser(u);
    } catch (err) {
      setError(err);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setError(null);
    try {
      const { user: u } = await api('/auth/avatar', { method: 'DELETE' });
      setUser(u);
    } catch (err) {
      setError(err);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user: u } = await api('/auth/me', { method: 'PATCH', body: form });
      setUser(u);
      setSaved(true);
      onSaved?.(u);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <ErrorBox error={error} />
      {saved && !onSaved && <div className="alert ok">{t('Saved.')}</div>}
      <div className="field">
        <label>{t('Profile photo')}</label>
        <div className="photo-edit">
          <Avatar name={form.displayName} src={user.avatarUrl} size={88} />
          <label className="btn secondary sm" style={{ margin: 0 }}>
            {photoBusy ? t('Uploading…') : user.avatarUrl ? t('Change photo') : t('Add a photo')}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} disabled={photoBusy} hidden />
          </label>
          {user.avatarUrl && <button type="button" className="linkish small" onClick={removePhoto}>{t('Remove')}</button>}
        </div>
        <div className="hint">{t('A clear photo of you or your shop builds trust. Everyone can see it.')}</div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="displayName">{t('Display name')}</label>
          <input id="displayName" required minLength={2} maxLength={60} value={form.displayName} onChange={set('displayName')} />
        </div>
        <div className="field">
          <label htmlFor="city">{t('City')}</label>
          <CityField id="city" maxLength={80} value={form.city} onChange={set('city')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bio">{t('About you')} <span className="muted">{t('(optional)')}</span></label>
        <textarea id="bio" maxLength={300} value={form.bio} onChange={set('bio')}
          placeholder={t('e.g. I collect retro games, or: Family phone shop in Manama since 2010, original parts only.')} />
        <div className="hint">{t('{count}/300', { count: form.bio.length })}</div>
      </div>
      <div className="field">
        <label>{t('What are you into?')} <span className="muted">{t('(up to 8)')}</span></label>
        <div className="hint" style={{ marginBottom: '.5rem' }}>{t('We use these to show you requests you can help with, and things you may want.')}</div>
        <div className="chips">
          {categories.map((c) => (
            <button type="button" key={c} className={`chip ${form.interests.includes(c) ? 'on' : ''}`} aria-pressed={form.interests.includes(c)} onClick={() => toggle(c)}>
              {t(c)}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <button className="btn" disabled={busy}>{busy ? t('Saving…') : submitLabel ?? t('Save')}</button>
        {extraButton}
      </div>
    </form>
  );
}
