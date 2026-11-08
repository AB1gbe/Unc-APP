// "⏳ Closes in 2 days" on request cards (session 56). Plain JS so the
// server tests can check it. Shown only in the last SHOW_DAYS days, so it
// means something when it appears.
export const SHOW_DAYS = 3;

// closesAt: 'YYYY-MM-DD HH:MM:SS' (UTC, from the server).
// Returns null (don't show), 0 (closes today: under 24 hours) or the days
// left, rounded to the nearest day (1 day 23 hours is "2 days", not "1").
export function closingDays(closesAt, now = Date.now()) {
  if (!closesAt) return null;
  const left = Date.parse(`${closesAt.replace(' ', 'T')}Z`) - now;
  if (left <= 0 || left > SHOW_DAYS * 86_400_000) return null;
  if (left < 86_400_000) return 0;
  return Math.round(left / 86_400_000);
}
