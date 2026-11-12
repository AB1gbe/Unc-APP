// Prices in Bahraini Dinar (session 80). Plain JS shared by the website,
// emails and link previews. Unc works in Bahrain, so every price is BHD.
// English: "BD 120", "BD 12.500". Arabic: "120 د.ب".
// Whole dinars show no decimals; a price with fils shows all 3.
export const CURRENCY = 'BHD';

export function formatMoney(n, { lang = 'en', currency = CURRENCY, exact = false } = {}) {
  if (n === null || n === undefined || n === '') return null;
  const num = Number(n);
  if (currency !== 'BHD') {
    // Old data in another currency (shouldn't remain after migration 41).
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-BH-u-nu-latn' : 'en-US', {
      style: 'currency', currency, currencyDisplay: lang === 'ar' ? 'code' : 'symbol', maximumFractionDigits: exact ? undefined : 0,
    }).format(num);
  }
  const digits = exact || !Number.isInteger(num) ? 3 : 0;
  const text = new Intl.NumberFormat(lang === 'ar' ? 'ar-BH-u-nu-latn' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num);
  return lang === 'ar' ? `${text} د.ب` : `BD ${text}`;
}
