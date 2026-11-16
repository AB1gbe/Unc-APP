// Link previews (session 20; session 103: every section, page titles,
// Cloudflare). When someone pastes an Unc link into WhatsApp, Instagram, X
// or iMessage, those apps fetch the page and read these <meta> tags (Open
// Graph) to show a card with a picture and a title. Google reads the
// <title> and description. None of them run JavaScript, so the server
// writes the tags into index.html (shared/page-meta.js applyMeta).
import { config } from '../config.js';
import { formatMoney } from '../../../shared/money.js';
import { applyMeta, esc } from '../../../shared/page-meta.js';

const TEXT = {
  en: {
    site: 'Unc — Buy, sell and connect near you',
    about: 'Buy, sell, rent and find jobs in Bahrain. Post what you need and ID-checked shops send offers. Private chat and scam checks.',
    cta: {
      wanted: 'Have one? Make an offer on Unc.',
      forsale: 'For sale on Unc. Ask the seller in a private chat.',
      housing: 'For rent on Unc. Ask in a private chat.',
      jobs: 'Job on Unc. Apply in a private chat.',
    },
    month: ' / month',
  },
  ar: {
    site: 'Unc — اشترِ وبِع وتواصل من حولك',
    about: 'اشترِ وبِع واستأجر وابحث عن عمل في البحرين. انشر ما تحتاجه وترسل لك المحلات الموثّقة عروضها. محادثة خاصة وفحص للاحتيال.',
    cta: {
      wanted: 'لديك واحد؟ قدّم عرضك على Unc.',
      forsale: 'للبيع على Unc. اسأل البائع في محادثة خاصة.',
      housing: 'للإيجار على Unc. اسأل في محادثة خاصة.',
      jobs: 'وظيفة على Unc. قدّم في محادثة خاصة.',
    },
    month: ' شهريًا',
  },
};

// Section pages get their own title and description (for Google).
const PAGES = {
  '/for-sale': ['Things for sale in Bahrain · Unc', 'Phones, furniture, cars and more for sale in Bahrain from ID-checked shops and phone-checked people. Ask in a private chat.'],
  '/housing': ['Flats, rooms and villas for rent in Bahrain · Unc', 'Flats, rooms and villas for rent in Bahrain. Every advertiser is ID-checked; ads asking for money before a viewing are blocked.'],
  '/jobs': ['Jobs in Bahrain · Unc', 'Jobs in Bahrain from ID-checked employers. Apply in a private chat; never pay to get a job.'],
  '/browse': ['What people in Bahrain are looking for · Unc', 'Requests from people in Bahrain. Have one of these? Make an offer.'],
  '/shops': ['Verified shops in Bahrain · Unc', 'Shops in Bahrain that passed an ID and CR check.'],
};

function price(l, lang) {
  const fmt = (n) => formatMoney(n, { lang, currency: l.currency });
  const lo = l.budget_min ?? l.budget_max;
  const hi = l.budget_max ?? l.budget_min;
  if (lo == null) return '';
  const text = lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`;
  return l.section === 'housing' || l.section === 'jobs' ? text + TEXT[lang].month : text;
}

const snippet = (s, n = 140) => {
  const one = String(s ?? '').replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n - 1).trimEnd()}…` : one;
};

// listing: a listings row + buyer_language + first_image, or null.
// Returns { title, description, tags } for applyMeta().
export function pageMeta(listing, path) {
  const lang = listing?.buyer_language === 'ar' ? 'ar' : 'en';
  const text = TEXT[lang];
  const clean = path.replace(/\/+$/, '') || '/';
  const url = `${config.appUrl}${clean === '/' ? '/' : clean}`;
  const image = listing?.first_image ? `${config.appUrl}/uploads/listings/${listing.first_image}` : `${config.appUrl}/icons/icon-512.png`;
  let title; let description; let ogTitle; let ogDescription;
  if (listing) {
    const facts = [price(listing, lang), listing.city].filter(Boolean).join(' · ');
    const cta = text.cta[listing.section] ?? text.cta.wanted;
    title = `${listing.title} · Unc`;
    ogTitle = listing.title;
    ogDescription = [facts, cta].filter(Boolean).join(' · ');
    description = [facts, snippet(listing.description), cta].filter(Boolean).join(' · ');
  } else if (PAGES[clean]) {
    [title, description] = PAGES[clean];
    ogTitle = title; ogDescription = description;
  } else {
    title = text.site; description = text.about;
    ogTitle = title; ogDescription = description;
  }
  const tags = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="Unc" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(ogTitle)}" />`,
    `<meta property="og:description" content="${esc(ogDescription)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="${lang === 'ar' ? 'ar_BH' : 'en_US'}" />`,
    `<meta name="twitter:card" content="${listing?.first_image ? 'summary_large_image' : 'summary'}" />`,
  ].join('\n    ');
  return { title, description, tags };
}

// Kept for older callers: the page with its tags.
export const withPreview = (html, listing, path) => applyMeta(html, pageMeta(listing, path));
