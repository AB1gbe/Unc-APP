// Used for both "post a new request" and "edit my request".
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';

const EMPTY = { title: '', description: '', category: '', budgetMin: '', budgetMax: '', currency: 'USD', city: '', neededBy: '' };

export default function NewListing() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const { categories, currencies } = useMeta();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...EMPTY, city: user.city || '' });
  const [images, setImages] = useState([]);     // new photos to upload
  const [existing, setExisting] = useState([]); // photos already on the request (editing)
  const [loaded, setLoaded] = useState(!editing);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!editing) return;
    api(`/listings/${id}`).then(({ listing: l }) => {
      setForm({
        title: l.title, description: l.description, category: l.category, budgetMin: l.budgetMin ?? '',
        budgetMax: l.budgetMax ?? '', currency: l.currency, city: l.city, neededBy: l.neededBy ?? '',
      });
      setExisting(l.photos ?? []);
      setLoaded(true);
    }).catch(setError);
  }, [editing, id]);

  // Removing a photo that's already saved happens straight away.
  async function removeExisting(photoId) {
    if (!window.confirm(t('Remove this photo?'))) return;
    try {
      const { listing } = await api(`/listings/${id}/images/${photoId}`, { method: 'DELETE' });
      setExisting(listing.photos);
    } catch (err) {
      setError(err);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let listing;
      if (editing) {
        ({ listing } = await api(`/listings/${id}`, { method: 'PATCH', body: form }));
        if (images.length) {
          const fd = new FormData();
          images.forEach((f) => fd.append('images', f));
          ({ listing } = await api(`/listings/${id}/images`, { method: 'POST', form: fd }));
        }
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
        images.forEach((f) => fd.append('images', f));
        ({ listing } = await api('/listings', { method: 'POST', form: fd }));
      }
      navigate(`/requests/${listing.id}`);
    } catch (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return error ? <ErrorBox error={error} /> : <Loading />;

  return (
    <form className="narrow card" onSubmit={submit}>
      <h1>{editing ? t('Edit your request') : t('What are you looking for?')}</h1>
      <p className="muted">{t('Be specific — sellers will contact you privately about this request.')}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="title">{t('Title')}</label>
        <input id="title" required minLength={5} maxLength={100} placeholder={t('e.g. Looking for an iPhone 15, 128GB, any colour')} value={form.title} onChange={set('title')} />
      </div>
      <div className="field">
        <label htmlFor="category">{t('Category')}</label>
        <select id="category" required value={form.category} onChange={set('category')}>
          <option value="" disabled>{t('Choose a category')}</option>
          {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">{t('Details')}</label>
        <textarea id="description" required minLength={10} maxLength={3000} placeholder={t('Condition, model, size, colour, must-haves, deal-breakers…')} value={form.description} onChange={set('description')} />
      </div>
      <div className="field">
        <label>{t('Budget')} <span className="muted">{t('(optional)')}</span></label>
        <div className="field-row" style={{ gridTemplateColumns: '1fr 1fr 110px' }}>
          <input type="number" min="0" placeholder={t('Min')} value={form.budgetMin} onChange={set('budgetMin')} aria-label={t('Minimum budget')} />
          <input type="number" min="0" placeholder={t('Max')} value={form.budgetMax} onChange={set('budgetMax')} aria-label={t('Maximum budget')} />
          <select value={form.currency} onChange={set('currency')} aria-label={t('Currency')}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="city">{t('City')}</label>
          <input id="city" required value={form.city} onChange={set('city')} />
        </div>
        <div className="field">
          <label htmlFor="neededBy">{t('Needed by')} <span className="muted">{t('(optional)')}</span></label>
          <input id="neededBy" type="date" value={form.neededBy} onChange={set('neededBy')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="images">{t('Reference photos')} <span className="muted">{t('(optional, up to 6)')}</span></label>
        {existing.length > 0 && (
          <div className="thumbs">
            {existing.map((p) => (
              <div key={p.id} className="thumb">
                <img src={p.url} alt="" />
                <button type="button" className="thumb-x" aria-label={t('Remove')} onClick={() => removeExisting(p.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <PhotoPicker id="images" files={images} onChange={setImages} max={6} existing={existing.length} />
        <div className="hint">{t('A photo of what you want helps sellers understand.')}</div>
      </div>
      <button className="btn block" disabled={busy}>{busy ? t('Saving…') : editing ? t('Save changes') : t('Post request')}</button>
    </form>
  );
}
