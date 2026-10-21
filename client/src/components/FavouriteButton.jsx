// "♡ Favourite" a seller (session 28). When you later post a request in a
// category they deal in, they hear about it first, and answer through the
// request like everyone else.
import { useState } from 'react';
import { api } from '../api.js';
import { celebrate } from './Celebrate.jsx';
import { t, tj } from '../i18n.jsx';

export default function FavouriteButton({ memberId, name, initial, onChange, wide = false }) {
  const [on, setOn] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      await api(`/members/${memberId}/favourite`, { method: on ? 'DELETE' : 'PUT' });
      setOn(!on);
      onChange?.(!on);
      if (!on) celebrate({ text: t("Added to your favourite sellers. They'll hear first when you post in their categories.") });
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className={`btn sm secondary fav-btn ${on ? 'on' : ''}`} onClick={toggle} disabled={busy} aria-pressed={on}>
      {on ? t('♥ Favourite seller') : wide ? tj('♡ Add {name} to favourite sellers', { name: <bdi>{name}</bdi> }) : t('♡ Favourite')}
    </button>
  );
}
