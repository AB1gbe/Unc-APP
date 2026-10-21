// Link previews (session 20): when someone pastes an Unc link into
// WhatsApp, Instagram, X or iMessage, those apps fetch the page and read
// these <meta> tags (Open Graph) to show a card with a picture and a title.
// They don't run JavaScript, so the server writes the tags into index.html.
import { config } from '../config.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TEXT = {
  en: { site: 'Unc — Ask for it. Get offers.', about: 'Post what you want. Verified shops and finders bring you offers.', cta: 'Have one? Make an offer on Unc.' },
  ar: { site: 'Unc — اطلب ما تريد واستقبل العروض', about: 'انشر ما تبحث عنه، ويأتيك أصحاب المتاجر والباحثون الموثّقون بالعروض.', cta: 'لديك واحد؟ قدّم عرضك على Unc.' },
};

function price(l, lang) {
  const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar-BH-u-nu-latn' : 'en-US', {
    style: 'currency', currency: l.currency, currencyDisplay: lang === 'ar' ? 'code' : 'symbol', maximumFractionDigits: 0,
  }).format(n);
  if (l.budget_min != null && l.budget_max != null) return `${fmt(l.budget_min)} – ${fmt(l.budget_max)}`;
  if (l.budget_max != null) return fmt(l.budget_max);
  if (l.budget_min != null) return fmt(l.budget_min);
  return '';
}

// listing: a listings row + buyer_language + first_image (or null for any
// other page). Returns the tags to put before </head>.
export function previewTags(listing, path) {
  const lang = listing?.buyer_language === 'ar' ? 'ar' : 'en';
  const text = TEXT[lang];
  const url = `${config.appUrl}${path}`;
  const image = listing?.first_image ? `${config.appUrl}/uploads/listings/${listing.first_image}` : `${config.appUrl}/icons/icon-512.png`;
  const title = listing ? listing.title : text.site;
  const description = listing ? [price(listing, lang), listing.city, text.cta].filter(Boolean).join(' · ') : text.about;
  return [
    `<meta property="og:site_name" content="Unc" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="${lang === 'ar' ? 'ar_BH' : 'en_US'}" />`,
    `<meta name="twitter:card" content="${listing?.first_image ? 'summary_large_image' : 'summary'}" />`,
  ].join('\n    ');
}

// Puts the tags into index.html, and the request's title in <title>.
export function withPreview(html, listing, path) {
  let out = html.replace('</head>', `    ${previewTags(listing, path)}\n  </head>`);
  if (listing) out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(listing.title)} · Unc</title>`);
  return out;
}
