// "Found it" stories (session 20): short public thank-yous with a photo,
// shared after a deal. Shown on Home, on the landing page and on profiles.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ago } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useApi } from '../hooks.js';
import { Avatar, ErrorBox } from './ui.jsx';
import PhotoPicker from './PhotoPicker.jsx';
import { celebrate } from './Celebrate.jsx';
import { t, tj } from '../i18n.jsx';

export function StoryCard({ story: s, onHidden }) {
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  async function hide() {
    if (!window.confirm(t('Hide this story for everyone?'))) return;
    await api(`/admin/stories/${s.id}/hide`, { method: 'POST' });
    setHidden(true);
    onHidden?.();
  }
  return (
    <figure className="card story">
      {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" className="story-photo" />}
      <blockquote dir="auto">{s.body}</blockquote>
      <figcaption className="row small">
        <Avatar name={s.author.displayName} src={s.author.avatarUrl} size={28} />
        <span>
          <Link to={`/members/${s.author.id}`}><b><bdi>{s.author.displayName}</bdi></b></Link>{' '}
          <span className="muted">{tj('with {name} · {time}', { name: <Link to={`/members/${s.other.id}`}><bdi>{s.other.displayName}</bdi></Link>, time: ago(s.createdAt) })}</span>
        </span>
        {user?.role === 'admin' && <button type="button" className="linkish small" onClick={hide}>{t('Hide')}</button>}
      </figcaption>
    </figure>
  );
}

// "Found on Unc 🎉": the newest stories. Hidden when there are none yet.
export function StoriesStrip({ limit = 3 }) {
  const { data } = useApi('/stories');
  const stories = data?.stories.slice(0, limit) ?? [];
  if (!stories.length) return null;
  return (
    <section>
      <h2 style={{ marginBottom: '.2rem' }}>{t('Found on Unc 🎉')}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>{t('Real people, real finds.')}</p>
      <div className="grid">{stories.map((s) => <StoryCard key={s.id} story={s} />)}</div>
    </section>
  );
}

// Inside the "Deal done" banner, after rating: optional, public.
export function StoryForm({ dealId, otherName, onShared }) {
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('story', text);
      if (photos[0]) fd.append('image', photos[0]);
      await api(`/deals/${dealId}/story`, { method: 'POST', form: fd });
      celebrate({ text: t('Story shared! 🎉 Thanks for spreading the word.'), confetti: true });
      await onShared();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="story-form" onSubmit={submit}>
      <b>{t('Share your story? (optional)')}</b>
      <span className="hint">{tj('A sentence and a photo of what you got. It shows on the home page and on your and {name}’s profiles.', { name: <bdi>{otherName}</bdi> })}</span>
      <ErrorBox error={error} />
      <textarea dir="auto" maxLength={280} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('e.g. Got my bike the same day, thanks Ali! 🚲')} aria-label={t('Your story')} />
      <PhotoPicker id="storyPhoto" files={photos} onChange={setPhotos} max={1} />
      <div className="row">
        <button className="btn sm" disabled={busy || text.trim().length < 5}>{t('Share publicly')}</button>
        <button type="button" className="btn sm secondary" onClick={() => setClosed(true)}>{t('Not now')}</button>
      </div>
    </form>
  );
}
