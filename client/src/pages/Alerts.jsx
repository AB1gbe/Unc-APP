// Request alerts (session 31): saved searches for sellers. Every new
// request that matches reaches them in the 🔔 (and as a phone push).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { ErrorBox, Loading } from '../components/ui.jsx';
import { useApi, useMeta } from '../hooks.js';
import { t } from '../i18n.jsx';
import CityField from '../components/CityField.jsx';

function describe(a) {
  const parts = [];
  if (a.q) parts.push(t('“{words}”', { words: a.q }));
  if (a.category) parts.push(t(a.category));
  if (a.city) parts.push(t('in {city}', { city: a.city }));
  if (a.minBudget != null) parts.push(t('budget at least {amount}', { amount: a.minBudget }));
  return parts.join(' · ');
}

export default function Alerts() {
  const { categories } = useMeta();
  const [params] = useSearchParams();
  const { data, loading, reload } = useApi('/alerts');
  const [form, setForm] = useState({ q: params.get('q') || '', category: params.get('category') || '', city: params.get('city') || '', minBudget: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api('/alerts', { method: 'POST', body });
      setForm({ q: '', category: '', city: '', minBudget: '' });
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id) {
    await api(`/alerts/${id}`, { method: 'DELETE' });
    await reload();
  }

  return (
    <div className="narrow stack" style={{ maxWidth: 720 }}>
      <div>
        <h1>{t('Request alerts')}</h1>
        <p className="muted">{t("Tell us what you sell. When someone posts a matching request, you'll get a notification (and a push, if it's on) so you can be first to offer.")}</p>
      </div>
      <form className="card" onSubmit={add}>
        <h2>{t('New alert')}</h2>
        <ErrorBox error={error} />
        <div className="field-row">
          <div className="field">
            <label htmlFor="alertQ">{t('Words')} <span className="muted">{t('(optional)')}</span></label>
            <input id="alertQ" value={form.q} maxLength={80} placeholder={t('e.g. ps5 controller')} onChange={(e) => setForm({ ...form, q: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="alertCategory">{t('Category')}</label>
            <select id="alertCategory" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">{t('All categories')}</option>
              {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="alertCity">{t('City')} <span className="muted">{t('(optional)')}</span></label>
            <CityField governorates id="alertCity" value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="alertBudget">{t('Budget at least')} <span className="muted">{t('(optional)')}</span></label>
            <input id="alertBudget" type="number" min="0" value={form.minBudget} onChange={(e) => setForm({ ...form, minBudget: e.target.value })} />
          </div>
        </div>
        <button className="btn" disabled={busy}>{t('Save alert')}</button>
      </form>
      <div className="card" style={{ padding: 0 }}>
        <h2 style={{ padding: '1rem 1rem 0' }}>{t('Your alerts')}</h2>
        {loading ? <div style={{ padding: '1rem' }}><Loading /></div> : data?.alerts.length === 0 ? (
          <p className="muted" style={{ padding: '0 1rem 1rem' }}>{t('No alerts yet.')} <Link to="/browse">{t('Browse requests')}</Link></p>
        ) : data?.alerts.map((a) => (
          <div key={a.id} className="inbox-item alert-row">
            <span aria-hidden>🔔</span>
            <span style={{ flex: 1 }} dir="auto">{describe(a)}</span>
            <button type="button" className="linkish" onClick={() => remove(a.id)}>{t('Delete')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
