// Tips to get more offers on your own request (session 31). Plain JS with
// no imports, so the server tests can check it. Returns up to 2 keys, most
// useful first; the page turns them into text.
const DAY = 24 * 60 * 60 * 1000;
const parse = (s) => new Date(String(s).includes('T') ? s : `${String(s).replace(' ', 'T')}Z`);

export function requestTips(listing, { offers = 0, views = 0, now = new Date() } = {}) {
  if (listing.status !== 'open') return [];
  const ageDays = (now - parse(listing.createdAt)) / DAY;
  const tips = [];
  if (!listing.images?.length) tips.push('photo');
  if ((listing.description || '').trim().length < 40) tips.push('details');
  if (listing.budgetMin == null && listing.budgetMax == null) tips.push('budget');
  if (offers === 0 && ageDays >= 2) tips.push('quiet');
  if (views === 0 && ageDays >= 0.5) tips.push('share');
  return tips.slice(0, 2);
}
