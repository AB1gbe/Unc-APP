// Craigslist-style sections (session 82): their names and paths in one
// place, written out in full so the translation test finds every text.
import { t } from './i18n.jsx';

export const SECTION_ORDER = ['forsale', 'housing', 'jobs', 'wanted'];
export const SECTION_LABEL = {
  housing: () => t('Housing'),
  jobs: () => t('Jobs'),
  forsale: () => t('For sale'),
  wanted: () => t('Wanted'),
};
export const SECTION_PATH = { forsale: '/for-sale', housing: '/housing', jobs: '/jobs', wanted: '/browse' };
// The icon shown when an ad has no photo (session 84).
export const SECTION_ICON = { forsale: 'tag', housing: 'building', jobs: 'briefcase', wanted: 'search' };
export const JOB_TYPE_LABEL = {
  'full-time': () => t('Full-time'),
  'part-time': () => t('Part-time'),
  contract: () => t('Contract'),
};
// Category names for Housing and Jobs, for the translation test.
export const AD_CATEGORY_TEXT = () => [
  t('Flats & apartments'), t('Rooms & shared'), t('Villas & houses'), t('Offices & shops'),
  t('Sales & retail'), t('Food & hospitality'), t('Office & admin'), t('Drivers & delivery'),
  t('Trades & construction'), t('IT & tech'), t('Health & beauty'), t('Other jobs'),
];
// The scam check's messages (shared/scam-check.js), for the translation test.
export const SCAM_TEXT = () => [
  t('Ads may not ask for money before a viewing or before a job starts (transfers, gift cards, crypto, fees). Unc removes these: they are the most common scam.'),
  t("Please don't put phone numbers, links or emails in the ad. People reply through the ad's chat on Unc, so your number stays private."),
  t('Wording often used in scams'), t('Rent much lower than usual'), t('Pay much higher than usual'),
];
// One-line price for an ad or request row: "BD 350 / month", "BD 300–400 / month".
export function adPrice(l, money) {
  if (l.section === 'housing') return l.budgetMin != null ? t('{price} / month', { price: money(l.budgetMin, l.currency) }) : null;
  if (l.section === 'forsale') return l.budgetMin != null ? money(l.budgetMin, l.currency) : null;
  const lo = l.budgetMin != null ? money(l.budgetMin, l.currency) : null;
  const hi = l.budgetMax != null && l.budgetMax !== l.budgetMin ? money(l.budgetMax, l.currency) : null;
  const range = lo && hi ? `${lo} – ${hi}` : lo || hi;
  if (!range) return null;
  return l.section === 'jobs' ? t('{price} / month', { price: range }) : range;
}
