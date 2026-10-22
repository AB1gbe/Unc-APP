// Pickup checklist and big-deal safety (session 37). Plain JS (no React) so
// the server tests can check it. The words live in components/PickupCard.jsx.

// What to check at pickup, by category. Every list ends with the common checks.
const BY_CATEGORY = {
  'Phones & Tablets': ['imei', 'unlocked', 'battery', 'screenCamera', 'boxReceipt'],
  Electronics: ['powerOn', 'allParts', 'serial', 'boxReceipt'],
  Computers: ['powerOn', 'specs', 'signedOut', 'allParts', 'boxReceipt'],
  Appliances: ['measure', 'powerOn', 'damage', 'transport'],
  'Home & Furniture': ['measure', 'damage', 'transport'],
  'Vehicles & Parts': ['partNumber', 'fits', 'damage'],
  Services: ['scope', 'timeAndPrice'],
};
const COMMON = ['asDescribed', 'publicPlace', 'payWhenHappy'];

export function checklistFor(category) {
  return [...(BY_CATEGORY[category] ?? []), ...COMMON];
}

// "Big deal": above this, the safety card shows. Currencies without a
// limit here never show it.
export const BIG_DEAL = { USD: 500, EUR: 500, GBP: 400, CAD: 700, AUD: 750, BHD: 200, SAR: 2000, AED: 2000 };
export const isBigDeal = (price, currency) => price != null && BIG_DEAL[currency] != null && price >= BIG_DEAL[currency];
