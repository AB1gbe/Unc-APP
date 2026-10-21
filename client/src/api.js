import { getLang, locale, t } from './i18n.jsx';

// One function for every call to the backend. Sends cookies, parses JSON,
// and throws an Error with the server's message when something fails.
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`);
    this.status = status;
    this.body = body || {};
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  // Accept-Language: the server answers error messages in this language.
  const opts = { method, credentials: 'include', headers: { 'Accept-Language': getLang() } };
  if (form) {
    opts.body = form; // FormData: the browser sets the multipart header itself
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, opts);
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export function money(n, currency = 'USD') {
  if (n === null || n === undefined) return null;
  // Arabic: "300 USD" rather than "300 US$" - a loose "$" gets reordered by
  // the right-to-left layout when two prices sit side by side ("$US").
  const display = getLang() === 'ar' ? 'code' : 'symbol';
  return new Intl.NumberFormat(locale(), { style: 'currency', currency, currencyDisplay: display, maximumFractionDigits: 0 }).format(n);
}

export function budget(l) {
  const min = money(l.budgetMin, l.currency);
  const max = money(l.budgetMax, l.currency);
  if (min && max) return `${min} – ${max}`;
  if (max) return t('Up to {amount}', { amount: max });
  if (min) return t('From {amount}', { amount: min });
  return t('Open budget');
}

// SQLite stores UTC "YYYY-MM-DD HH:MM:SS"; make it a real Date.
// A plain date ("2026-01-31") is treated as local midnight.
export function toDate(s) {
  if (s.length === 10) return new Date(`${s}T00:00:00`);
  return new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
}

// "5 minutes ago" / "قبل 5 دقائق". Intl.RelativeTimeFormat knows each
// language's grammar, including Arabic plurals.
export function ago(s) {
  const sec = Math.round((Date.now() - toDate(s).getTime()) / 1000);
  if (sec < 60) return t('just now');
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, 'minute');
  const h = Math.floor(min / 60);
  if (h < 24) return rtf.format(-h, 'hour');
  const d = Math.floor(h / 24);
  if (d < 30) return rtf.format(-d, 'day');
  return toDate(s).toLocaleDateString(locale());
}
