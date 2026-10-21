// "Open now" for shop pages (session 24). Plain JS with no imports, so the
// server tests can check it (server/test/shop.test.js).
// hours: 7 entries, 0 = Sunday … 6 = Saturday, each null or { open, close }
// as 'HH:MM'. A close time earlier than the open time runs past midnight.

const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// { open: true, until: '21:00' } | { open: false, next: { day, time } | null }
export function openState(hours, date = new Date()) {
  if (!Array.isArray(hours)) return null;
  const day = date.getDay();
  const now = date.getHours() * 60 + date.getMinutes();
  const today = hours[day];
  const yesterday = hours[(day + 6) % 7];
  // Still open from yesterday's late shift (e.g. 18:00–02:00)?
  if (yesterday && minutes(yesterday.close) < minutes(yesterday.open) && now < minutes(yesterday.close)) {
    return { open: true, until: yesterday.close };
  }
  if (today) {
    const o = minutes(today.open);
    const c = minutes(today.close);
    const overnight = c < o;
    if (now >= o && (overnight || now < c)) return { open: true, until: today.close };
    if (now < o) return { open: false, next: { day, time: today.open } };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (hours[d]) return { open: false, next: { day: d, time: hours[d].open } };
  }
  return { open: false, next: null };
}
