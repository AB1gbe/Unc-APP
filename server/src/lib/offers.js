// Offer details (session 34): what a seller promises with a price, so
// buyers compare more than the number. All optional.
import { HttpError } from './http.js';
import * as v from './validate.js';

export const CONDITIONS = ['new', 'like-new', 'good', 'fair'];
export const WARRANTIES = ['none', '1m', '3m', '6m', '12m'];
export const RETURNS = ['none', '3d', '7d'];
export const MAX_VALID_DAYS = 60;

const today = () => new Date().toISOString().slice(0, 10);

// From a request body. Only a seller may add details, and only to a price.
export function readOfferDetails(body, { isSeller, hasPrice }) {
  const d = {
    condition: v.oneOf(body, 'condition', CONDITIONS, { optional: true }),
    warranty: v.oneOf(body, 'warranty', WARRANTIES, { optional: true }),
    returns: v.oneOf(body, 'returns', RETURNS, { optional: true }),
    validUntil: v.isoDate(body, 'validUntil', { optional: true }),
  };
  if (!Object.values(d).some((x) => x !== null)) return null;
  if (!isSeller || !hasPrice) throw new HttpError(400, 'Offer details go with a seller’s price.', { field: 'offerPrice' });
  if (d.validUntil) {
    const last = new Date(Date.now() + MAX_VALID_DAYS * 86_400_000).toISOString().slice(0, 10);
    if (d.validUntil < today() || d.validUntil > last) throw new HttpError(400, 'Choose a date from today up to 60 days ahead.', { field: 'validUntil' });
  }
  return d;
}

// messages row -> { condition, warranty, returns, validUntil, expired } or null
export function offerDetailsView(m) {
  if (!m.offer_condition && !m.offer_warranty && !m.offer_returns && !m.offer_valid_until) return null;
  return {
    condition: m.offer_condition, warranty: m.offer_warranty, returns: m.offer_returns,
    validUntil: m.offer_valid_until, expired: isExpired(m),
  };
}

// "Valid until" is the last day it can be accepted.
export const isExpired = (m) => Boolean(m.offer_valid_until && m.offer_valid_until < today());
