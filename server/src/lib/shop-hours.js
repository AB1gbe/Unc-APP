// Opening hours for shop pages (session 24): one entry per weekday,
// 0 = Sunday … 6 = Saturday (like JavaScript's getDay), each either null
// (closed) or { open: 'HH:MM', close: 'HH:MM' }. A close time earlier than
// the open time means "past midnight" (e.g. 18:00–02:00).
import { HttpError } from './http.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function readShopHours(value) {
  const bad = () => new HttpError(400, 'Opening hours are not valid. Use a time like 09:00 for each open day.', { field: 'shopHours' });
  if (value === null) return null;
  if (!Array.isArray(value) || value.length !== 7) throw bad();
  return value.map((day) => {
    if (day === null) return null;
    if (typeof day !== 'object' || !TIME.test(day.open) || !TIME.test(day.close) || day.open === day.close) throw bad();
    return { open: day.open, close: day.close };
  });
}
