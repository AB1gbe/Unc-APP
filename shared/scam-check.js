// Scam checks for ads (session 82). Craigslist's weakness was scams; Unc
// checks every Housing and Jobs ad before it goes up. Used by the server
// (the real check) and by the posting form (a warning while typing).
//
// checkAd() returns { block, hold }:
//   block: a reason the ad is refused outright (English text; translated
//          on screen), or null;
//   hold:  reasons the ad is held back until the Unc team checks it.
//
// Rules, kept simple and explainable:
//  - Payment before viewing or before a job starts (money transfer
//    services, gift cards, crypto, "deposit before viewing", "visa fee",
//    "registration fee"...) is how most rental and job scams work: refused.
//  - Phone numbers, links and emails in the ad: refused. Replies go
//    through the ad's chat (the same rule as Unc's profiles).
//  - A rent far below Bahrain's normal prices, very high pay, "work from
//    home, no experience" or "I'm abroad, keys by courier": held for a check.
import { hasContactDetails } from './contact-details.js';

const PAY_FIRST = [
  /western\s*union/i, /money\s*gram/i, /wire\s+(the\s+)?(money|transfer|payment)/i, /gift\s*cards?/i, /itunes\s*cards?/i,
  /\b(bitcoin|btc|crypto|usdt|binance)\b/i,
  /(deposit|advance|payment|pay)\s+(\w+\s+){0,3}(before|prior to)\s+(the\s+)?(viewing|visit|seeing|interview|start)/i,
  /(visa|registration|training|processing|application|uniform)\s+fees?/i,
  /send\s+(the\s+)?money\s+first/i,
  /ويسترن\s*يونيون/, /موني\s*جرام/, /بطاق(ة|ات)\s*(هدايا|ايتونز|آيتونز)/, /(بيتكوين|عملات?\s*رقمية|كريبتو)/,
  /رسوم\s*(تسجيل|تأشيرة|التأشيرة|تدريب|معاملة)/, /(عربون|دفعة|مقدم)\s+قبل\s+(المعاينة|الزيارة|المقابلة)/, /حو(ا|ّا)ل(ة|ه)?\s+(المبلغ\s+)?(أولا|اولا|مقدما)/,
];
const TOO_GOOD = [
  /work\s+from\s+home.{0,60}no\s+experience|no\s+experience.{0,60}work\s+from\s+home/i,
  /earn\s+(bd\s*)?\d[\d,]*\s*(bd\s*)?(a|per)\s+(day|week)/i,
  /(i\s*'?\s*a?m|we\s+are|currently|living)\s+(abroad|overseas|out\s+of\s+(the\s+)?country)/i,
  /keys?\s+(by|via|through)\s+(post|courier|mail|dhl|aramex)/i,
  /العمل\s+من\s+المنزل.{0,40}بدون\s+خبرة|بدون\s+خبرة.{0,40}العمل\s+من\s+المنزل/, /(أنا|انا)\s+(خارج|في\s+الخارج)/, /المفاتيح\s+(بالبريد|عبر\s+البريد|مع\s+المندوب)/,
];

// Lowest believable monthly rent in Bahrain, in BD (2026 prices, rounded
// down a lot so honest cheap ads pass). Below this an ad is held.
export const MIN_RENT = { 'Rooms & shared': 40, 'Flats & apartments': 100, 'Villas & houses': 250, 'Offices & shops': 80 };
// Monthly pay above this is held: rare for a public job ad in Bahrain.
export const MAX_PAY = 3000;

export function checkAd({ section, title = '', description = '', category = '', price = null, priceMax = null }) {
  if (section !== 'housing' && section !== 'jobs') return { block: null, hold: [] };
  const text = `${title}\n${description}`;
  if (PAY_FIRST.some((re) => re.test(text))) {
    return { block: 'Ads may not ask for money before a viewing or before a job starts (transfers, gift cards, crypto, fees). Unc removes these: they are the most common scam.', hold: [] };
  }
  if (hasContactDetails(text)) {
    return { block: "Please don't put phone numbers, links or emails in the ad. People reply through the ad's chat on Unc, so your number stays private.", hold: [] };
  }
  const hold = [];
  if (TOO_GOOD.some((re) => re.test(text))) hold.push('Wording often used in scams');
  if (section === 'housing' && price != null && MIN_RENT[category] && price < MIN_RENT[category]) hold.push('Rent much lower than usual');
  if (section === 'jobs' && Math.max(price ?? 0, priceMax ?? 0) > MAX_PAY) hold.push('Pay much higher than usual');
  return { block: null, hold };
}
