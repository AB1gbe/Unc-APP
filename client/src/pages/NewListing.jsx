// Used for both "post a new request" and "edit my request", and (session
// 82) for Housing and Jobs ads: ?section=housing|jobs picks the form.
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, currencyName } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import { celebrate } from '../components/Celebrate.jsx';
import CityField from '../components/CityField.jsx';
import { checkAd } from '../../../shared/scam-check.js';
import { JOB_TYPE_LABEL, SECTION_LABEL, SECTION_ORDER } from '../sections.js';

const EMPTY = { title: '', description: '', category: '', budgetMin: '', budgetMax: '', currency: 'BHD', city: '', neededBy: '', contactRule: 'anyone', condition: 'any', rent: '', bedrooms: '', furnished: '', jobType: '' };

export default function NewListing() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState({ ...EMPTY, city: user.city || '' });
  const [section, setSection] = useState(SECTION_ORDER.includes(params.get('section')) ? params.get('section') : 'wanted');
  const categories = section === 'wanted' ? meta.categories : (meta.sections?.[section] ?? []);
  const ad = section !== 'wanted';
  // The same scam check the server runs, as a warning while typing.
  const check = checkAd({ section, title: form.title, description: form.description, category: form.category,
    price: Number(section === 'housing' ? form.rent : form.budgetMin) || null, priceMax: Number(form.budgetMax) || null });
  function pickSection(next) {
    setSection(next);
    setForm({ ...form, category: '' });
    setParams(next === 'wanted' ? {} : { section: next }, { replace: true });
  }
  const [images, setImages] = useState([]);     // new photos to upload
  const [existing, setExisting] = useState([]); // photos already on the request (editing)
  const [loaded, setLoaded] = useState(!editing);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!editing) return;
    api(`/listings/${id}`).then(({ listing: l }) => {
      setSection(l.section ?? 'wanted');
      setForm({
        title: l.title, description: l.description, category: l.category, budgetMin: l.budgetMin ?? '',
        budgetMax: l.budgetMax ?? '', currency: 'BHD', city: l.city, neededBy: l.neededBy ?? '', contactRule: l.contactRule ?? 'anyone', condition: l.condition ?? 'any',
        rent: l.section === 'housing' ? l.budgetMin ?? '' : '', bedrooms: l.bedrooms ?? '', furnished: l.furnished == null ? '' : String(l.furnished), jobType: l.jobType ?? '',
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
      let held = [];
      const body = { ...form, section };
      if (editing) {
        ({ listing } = await api(`/listings/${id}`, { method: 'PATCH', body }));
        if (images.length) {
          const fd = new FormData();
          images.forEach((f) => fd.append('images', f));
          ({ listing } = await api(`/listings/${id}/images`, { method: 'POST', form: fd }));
        }
      } else {
        const fd = new FormData();
        Object.entries(body).forEach(([k, v]) => v !== '' && fd.append(k, v));
        images.forEach((f) => fd.append('images', f));
        ({ listing, held = [] } = await api('/listings', { method: 'POST', form: fd }));
        celebrate({ text: held.length ? t('Posted. The Unc team will check it before it shows.') : ad ? t('Posted! Your ad is up.') : t('Posted! Sellers can see your request now.'), confetti: !held.length });
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
      {!editing && (
        <div className="section-pick" role="radiogroup" aria-label={t('Section')}>
          {SECTION_ORDER.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={section === s} className={section === s ? 'on' : ''} onClick={() => pickSection(s)}>{SECTION_LABEL[s]()}</button>
          ))}
        </div>
      )}
      <h1>{editing ? (ad ? t('Edit your ad') : t('Edit your request')) : section === 'housing' ? t('Post a housing ad') : section === 'jobs' ? t('Post a job ad') : t('What are you looking for?')}</h1>
      <p className="muted">{ad ? t('People reply in a private chat on Unc. Your number and email are never shown.') : t('Be specific — sellers will contact you privately about this request.')}</p>
      <ErrorBox error={error} />
      <div className="field">
        <label htmlFor="title">{t('Title')}</label>
        <input id="title" required minLength={5} maxLength={100} placeholder={section === 'housing' ? t('e.g. 2 bedroom flat in Juffair, sea view') : section === 'jobs' ? t('e.g. Barista for a cafe in Seef') : t('e.g. Looking for an iPhone 15, 128GB, any colour')} value={form.title} onChange={set('title')} />
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
        <textarea id="description" required minLength={10} maxLength={3000} placeholder={section === 'housing' ? t('Size, floor, bills included, parking, available from…') : section === 'jobs' ? t('Duties, hours, experience needed, how to apply in the chat…') : t('Condition, model, size, colour, must-haves, deal-breakers…')} value={form.description} onChange={set('description')} />
      </div>
      {check.block && <div className="alert error" role="alert">{t(check.block)}</div>}
      {!check.block && check.hold.length > 0 && <div className="alert warn" role="status">{t('This ad will be checked by the Unc team before it shows:')} {check.hold.map((h) => t(h)).join(', ')}</div>}
      {section === 'housing' && (
        <div className="field-row three">
          <div className="field">
            <label htmlFor="rent">{t('Rent per month in {currency}', { currency: currencyName() })}</label>
            <input id="rent" type="number" min="1" required value={form.rent} onChange={set('rent')} />
          </div>
          <div className="field">
            <label htmlFor="bedrooms">{t('Bedrooms')} <span className="muted">{t('(optional)')}</span></label>
            <input id="bedrooms" type="number" min="0" max="20" value={form.bedrooms} onChange={set('bedrooms')} />
          </div>
          <div className="field">
            <label htmlFor="furnished">{t('Furnished')}</label>
            <select id="furnished" value={form.furnished} onChange={set('furnished')}>
              <option value="">{t('Not said')}</option>
              <option value="true">{t('Furnished')}</option>
              <option value="false">{t('Unfurnished')}</option>
            </select>
          </div>
        </div>
      )}
      {section === 'jobs' && (
        <div className="field">
          <label htmlFor="jobType">{t('Job type')}</label>
          <select id="jobType" required value={form.jobType} onChange={set('jobType')}>
            <option value="" disabled>{t('Choose')}</option>
            {(meta.jobTypes ?? []).map((j) => <option key={j} value={j}>{JOB_TYPE_LABEL[j]?.() ?? j}</option>)}
          </select>
        </div>
      )}
      {section !== 'housing' && (
      <div className="field">
        <label>{section === 'jobs' ? t('Pay per month in {currency}', { currency: currencyName() }) : t('Budget in {currency}', { currency: currencyName() })} <span className="muted">{t('(optional)')}</span></label>
        <div className="field-row">
          <input type="number" min="0" placeholder={t('Min')} value={form.budgetMin} onChange={set('budgetMin')} aria-label={t('Minimum budget')} />
          <input type="number" min="0" placeholder={t('Max')} value={form.budgetMax} onChange={set('budgetMax')} aria-label={t('Maximum budget')} />
        </div>
      </div>
      )}
      <div className={ad ? 'field-row one' : 'field-row'}>
        <div className="field">
          <label htmlFor="city">{t('City')}</label>
          <CityField id="city" required value={form.city} onChange={set('city')} />
        </div>
        {!ad && (
        <div className="field">
          <label htmlFor="neededBy">{t('Needed by')} <span className="muted">{t('(optional)')}</span></label>
          <input id="neededBy" type="date" value={form.neededBy} onChange={set('neededBy')} />
        </div>
        )}
      </div>
      {!ad && <>
      <div className="field">
        <label htmlFor="condition">{t('Condition')}</label>
        <select id="condition" value={form.condition} onChange={set('condition')}>
          <option value="any">{t('New or used')}</option>
          <option value="new">{t('New only')}</option>
          <option value="used">{t('Used is fine')}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="contactRule">{t('Who can make offers?')}</label>
        <select id="contactRule" value={form.contactRule} onChange={set('contactRule')}>
          <option value="anyone">{t('Any verified seller')}</option>
          <option value="shops">{t('Only shops')}</option>
          <option value="rated">{t('Only sellers rated 4★ or more')}</option>
          <option value="favourites">{t('Only my favourite sellers')}</option>
        </select>
        <div className="hint">{t('Sellers who already contacted you can keep talking to you.')}</div>
      </div>
      </>}
      <div className="field">
        <label htmlFor="images">{ad ? t('Photos') : t('Reference photos')} <span className="muted">{t('(optional, up to 6)')}</span></label>
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
        <div className="hint">{section === 'housing' ? t('Real photos of the place get more replies.') : section === 'jobs' ? t('A photo of the shop or workplace helps.') : t('A photo of what you want helps sellers understand.')}</div>
      </div>
      <button className="btn block" disabled={busy || Boolean(check.block)}>{busy ? t('Saving…') : editing ? t('Save changes') : ad ? t('Post ad') : t('Post request')}</button>
    </form>
  );
}
