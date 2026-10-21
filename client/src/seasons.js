// Time-of-day greeting and seasonal touches for the home page (session 20).
// Plain JS with no imports, so the server tests can check it too
// (server/test/seasons.test.js). Returns English keys; the page translates.

export function partOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

// Islamic (Umm al-Qura) month and day, worked out by the browser's own
// calendar: no table of dates to update every year.
export function hijri(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric', day: 'numeric' }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return { month: get('month'), day: get('day') };
}

// 'ramadan' | 'eid-fitr' | 'eid-adha' | 'national-day' | null
export function season(date = new Date()) {
  const { month, day } = hijri(date);
  if (month === 9) return 'ramadan';
  if (month === 10 && day <= 3) return 'eid-fitr';
  if (month === 12 && day >= 10 && day <= 13) return 'eid-adha';
  if (date.getMonth() === 11 && (date.getDate() === 16 || date.getDate() === 17)) return 'national-day'; // Bahrain, 16–17 Dec
  return null;
}
