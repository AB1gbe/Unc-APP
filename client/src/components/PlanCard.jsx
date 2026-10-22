// Paying in parts (session 40), shown in the chat once a price is agreed.
// The buyer and seller agree a plan; Unc records it and reminds the buyer;
// money goes directly between them (the Terms, section 5). Later an
// installment partner can be offered here too (provider 'partner').
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, toDate } from '../api.js';
import { useApi } from '../hooks.js';
import { ErrorBox } from './ui.jsx';
import { celebrate } from './Celebrate.jsx';
import { formatDate, t, tj } from '../i18n.jsx';

const EVERY = { week: () => t('every week'), '2weeks': () => t('every 2 weeks'), month: () => t('every month') };
const iso = (d) => d.toISOString().slice(0, 10);
const shortDate = (s) => formatDate(toDate(s), { day: 'numeric', month: 'short' });

export default function PlanCard({ conv, price }) {
  const { data, reload } = useApi(`/conversations/${conv.id}/plan`);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const plan = data?.plan;
  const currency = conv.listing.currency;
  const iAmBuyer = conv.myRole === 'buyer';

  const run = (fn) => async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try { await fn(); await reload(); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (!data) return null;
  if (!plan) return <ProposePlan conv={conv} price={price} onDone={reload} />;

  const statusLine = {
    proposed: plan.proposedByMe ? tj('Waiting for {name} to accept this plan.', { name: <bdi>{conv.other.displayName}</bdi> }) : tj('{name} suggests paying in parts.', { name: <bdi>{conv.other.displayName}</bdi> }),
    active: t('{paid} of {total} paid', { paid: money(plan.paid, currency), total: money(plan.total, currency) }),
    completed: t('All paid ✓'),
  }[plan.status];

  return (
    <div className="plan">
      <b>{t('💳 Paying in parts')}</b> <span className="muted small">{statusLine}</span>
      <ErrorBox error={error} />
      {plan.status !== 'proposed' && <div className="plan-progress" aria-hidden><span style={{ width: `${(plan.paid / plan.total) * 100}%` }} /></div>}
      <ol className="plan-parts">
        {plan.parts.map((p) => (
          <li key={p.n} className={p.confirmedAt ? 'done' : p.late ? 'late' : ''}>
            <span>{t('{amount} on {date}', { amount: money(p.amount, currency), date: shortDate(p.dueOn) })}</span>
            <span className="small">
              {p.confirmedAt ? t('✓ Received')
                : p.paidAt ? (iAmBuyer ? t('Paid, waiting for the seller') : <button type="button" className="btn sm ok" disabled={busy} onClick={run(() => api(`/plans/${plan.id}/parts/${p.n}/confirm`, { method: 'POST' }))}>{t('Received ✓')}</button>)
                  : plan.status === 'active' && (
                    <>
                      {p.late && <span className="badge bad">{t('Late')}</span>}{' '}
                      {iAmBuyer
                        ? <button type="button" className="btn sm" disabled={busy} onClick={run(() => api(`/plans/${plan.id}/parts/${p.n}/paid`, { method: 'POST' }))}>{t("I've paid this")}</button>
                        : <button type="button" className="btn sm secondary" disabled={busy} onClick={run(() => api(`/plans/${plan.id}/parts/${p.n}/confirm`, { method: 'POST' }))}>{t('Received ✓')}</button>}
                    </>
                  )}
            </span>
          </li>
        ))}
      </ol>
      {plan.status === 'proposed' && !plan.proposedByMe && (
        <div className="row">
          <button type="button" className="btn sm ok" disabled={busy} onClick={run(async () => { await api(`/plans/${plan.id}/respond`, { method: 'POST', body: { action: 'accept' } }); celebrate({ text: t('Plan agreed 🤝') }); })}>{t('Accept plan')}</button>
          <button type="button" className="btn sm secondary" disabled={busy} onClick={run(() => api(`/plans/${plan.id}/respond`, { method: 'POST', body: { action: 'decline' } }))}>{t('Not for me')}</button>
        </div>
      )}
      {plan.status === 'proposed' && plan.proposedByMe && (
        <button type="button" className="linkish small" onClick={run(() => api(`/plans/${plan.id}/cancel`, { method: 'POST' }))}>{t('Withdraw')}</button>
      )}
      <p className="hint" style={{ margin: 0 }}>{tj('Payments go directly between you; Unc keeps the record and reminds the buyer. {terms}', { terms: <Link to="/terms">{t('Terms of use')}</Link> })}</p>
    </div>
  );
}

function ProposePlan({ conv, price, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ parts: '3', every: 'month', firstDue: iso(new Date(Date.now() + 7 * 86_400_000)) });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  if (price == null) return null;
  if (!open) {
    return (
      <p className="plan small" style={{ margin: 0 }}>
        <button type="button" className="linkish small" onClick={() => setOpen(true)}>{t('💳 Pay in parts?')}</button>{' '}
        <span className="muted">{t('Agree a plan to split {price} into smaller payments.', { price: money(price, conv.listing.currency) })}</span>
      </p>
    );
  }
  const each = Math.floor(price / Number(form.parts));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/conversations/${conv.id}/plan`, { method: 'POST', body: { parts: Number(form.parts), every: form.every, firstDue: form.firstDue } });
      await onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="plan plan-form" onSubmit={submit}>
      <b>{t('💳 Suggest paying in parts')}</b>
      <ErrorBox error={error} />
      <div className="plan-fields">
        <label>{t('Payments')}
          <select id="planParts" value={form.parts} onChange={set('parts')}>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label>{t('How often')}
          <select id="planEvery" value={form.every} onChange={set('every')}>
            {Object.entries(EVERY).map(([k, f]) => <option key={k} value={k}>{f()}</option>)}
          </select>
        </label>
        <label>{t('First payment')}
          <input id="planFirst" type="date" required value={form.firstDue} onChange={set('firstDue')}
            min={iso(new Date())} max={iso(new Date(Date.now() + 30 * 86_400_000))} />
        </label>
      </div>
      <p className="small muted" style={{ margin: 0 }}>{t('About {each} each, {every}.', { each: money(each, conv.listing.currency), every: EVERY[form.every]() })}</p>
      <div className="row">
        <button className="btn sm" disabled={busy}>{t('Suggest this plan')}</button>
        <button type="button" className="btn sm secondary" onClick={() => setOpen(false)}>{t('Cancel')}</button>
      </div>
    </form>
  );
}
