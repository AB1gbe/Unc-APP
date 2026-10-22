// Offer details (session 34): condition, warranty, returns and "price
// valid until", picked by the seller and shown with the price.
import { toDate } from '../api.js';
import { formatDate, t } from '../i18n.jsx';

const CONDITION = { new: () => t('New'), 'like-new': () => t('Like new'), good: () => t('Good'), fair: () => t('Fair') };
const CONDITION_HINT = {
  new: () => t('Never used, in its box'), 'like-new': () => t('Used a little, no marks'),
  good: () => t('Normal signs of use, works perfectly'), fair: () => t('Visible wear, works'),
};
const WARRANTY = { none: () => t('No warranty'), '1m': () => t('1-month warranty'), '3m': () => t('3-month warranty'), '6m': () => t('6-month warranty'), '12m': () => t('1-year warranty') };
const RETURNS = { none: () => t('No returns'), '3d': () => t('Returns within 3 days'), '7d': () => t('Returns within 7 days') };

export const EMPTY_DETAILS = { condition: '', warranty: '', returns: '', validUntil: '' };
const iso = (d) => d.toISOString().slice(0, 10);

// The four optional fields, as a small grid.
export function OfferDetailFields({ value, onChange, idPrefix = 'offer' }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="offer-details-fields">
      <label>{t('Condition')}
        <select id={`${idPrefix}-condition`} value={value.condition} onChange={set('condition')}>
          <option value="">—</option>
          {Object.entries(CONDITION).map(([k, f]) => <option key={k} value={k}>{f()} · {CONDITION_HINT[k]()}</option>)}
        </select>
      </label>
      <label>{t('Warranty')}
        <select id={`${idPrefix}-warranty`} value={value.warranty} onChange={set('warranty')}>
          <option value="">—</option>
          {Object.entries(WARRANTY).map(([k, f]) => <option key={k} value={k}>{f()}</option>)}
        </select>
      </label>
      <label>{t('Returns')}
        <select id={`${idPrefix}-returns`} value={value.returns} onChange={set('returns')}>
          <option value="">—</option>
          {Object.entries(RETURNS).map(([k, f]) => <option key={k} value={k}>{f()}</option>)}
        </select>
      </label>
      <label>{t('Price valid until')}
        <input id={`${idPrefix}-validUntil`} type="date" value={value.validUntil} onChange={set('validUntil')}
          min={iso(new Date())} max={iso(new Date(Date.now() + 60 * 86_400_000))} />
      </label>
    </div>
  );
}

// Adds the filled-in details to a FormData or a plain object.
export function addDetails(target, details) {
  for (const [k, v] of Object.entries(details)) {
    if (v === '') continue;
    if (target instanceof FormData) target.append(k, v); else target[k] = v;
  }
  return target;
}

// "Like new · 3-month warranty · Returns within 3 days · Valid until 25 Oct"
export function OfferDetailsLine({ details }) {
  if (!details) return null;
  const parts = [
    details.condition && CONDITION[details.condition]?.(),
    details.warranty && WARRANTY[details.warranty]?.(),
    details.returns && RETURNS[details.returns]?.(),
  ].filter(Boolean);
  return (
    <div className="offer-details small">
      {parts.map((p) => <span key={p} className="badge grey">{p}</span>)}
      {details.validUntil && (
        <span className={details.expired ? 'expired' : 'muted'}>
          {details.expired ? t('Price expired') : t('Valid until {date}', { date: formatDate(toDate(details.validUntil), { day: 'numeric', month: 'short' }) })}
        </span>
      )}
    </div>
  );
}
