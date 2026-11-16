// Search that understands how people really type (session 103).
//
// Arabic is written many ways: أ إ آ ا are all "a", ة/ه and ى/ي are mixed
// up, short-vowel marks and the stretch letter ـ are optional, and digits
// can be Arabic (٢٥٦) or Western (256). Both the ads and the search words
// are brought to one form before matching, so "ايفون" finds "آيفون" and
// "شقة" finds "شقه".
//
// Each word must appear somewhere (title, description, area or category),
// in any order: "iphone purple" finds "iPhone 14 Pro, deep purple". A few
// common words also match their English or Arabic twin ("ايفون" ↔ "iphone").
//
// The same rules exist twice: normalizeSearch() in JavaScript (for the
// search words) and sqlNormalize() as SQL (for the ads), so they must stay
// in step. At a few thousand ads this is fast enough; above ~50,000 switch
// to a stored search column.

const LETTERS = [
  ['أ', 'ا'], ['إ', 'ا'], ['آ', 'ا'], ['ٱ', 'ا'], ['ة', 'ه'], ['ى', 'ي'], ['ؤ', 'و'], ['ئ', 'ي'], ['ـ', ''],
  // Short-vowel marks (fatha, damma, kasra, sukun, shadda and tanween).
  ...['ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ّ', 'ْ'].map((c) => [c, '']),
  // Arabic-Indic digits.
  ...[...'٠١٢٣٤٥٦٧٨٩'].map((c, i) => [c, String(i)]),
];

export function normalizeSearch(text) {
  let s = String(text ?? '').toLowerCase();
  for (const [a, b] of LETTERS) s = s.split(a).join(b);
  return s;
}

// The same as normalizeSearch, as an SQL expression around `expr`.
// (LIKE already ignores the case of English letters.)
export function sqlNormalize(expr) {
  return LETTERS.reduce((e, [a, b]) => `replace(${e}, '${a}', '${b}')`, expr);
}

// Words that should also find their twin in the other language. Written
// already normalized (ة → ه, أ → ا).
const TWINS = [
  ['ايفون', 'iphone'], ['سامسونج', 'samsung'], ['بلايستيشن', 'playstation'], ['بلاستيشن', 'playstation'],
  ['لابتوب', 'laptop'], ['ايباد', 'ipad'], ['تلفزيون', 'tv'], ['جوال', 'phone'], ['هاتف', 'phone'], ['موبايل', 'phone'],
  ['سياره', 'car'], ['دراجه', 'bike'], ['كنب', 'sofa'], ['طاوله', 'table'], ['سرير', 'bed'], ['ثلاجه', 'fridge'], ['غساله', 'washing'],
  ['شقه', 'flat'], ['غرفه', 'room'], ['فيلا', 'villa'], ['مكتب', 'office'], ['وظيفه', 'job'],
];
const TWIN = new Map();
for (const [ar, en] of TWINS) {
  TWIN.set(ar, [...(TWIN.get(ar) ?? []), en]);
  TWIN.set(en, [...(TWIN.get(en) ?? []), ar]);
}

// The search words, each with the spellings that count as a match:
// [["ايفون", "iphone"], ["256"]]. At most 6 words.
export function searchTerms(q) {
  const all = normalizeSearch(String(q ?? '').slice(0, 100)).split(/[\s,،.;:!?؟()[\]{}"'/\\]+/).filter(Boolean);
  // One-letter words are ignored, unless that's all there is.
  const words = (all.some((w) => w.length >= 2) ? all.filter((w) => w.length >= 2) : all).slice(0, 6);
  return words.map((w) => {
    const alts = new Set([w]);
    // "الايفون" → also "ايفون" (the Arabic "the").
    if (w.startsWith('ال') && w.length > 4) alts.add(w.slice(2));
    for (const a of [...alts]) for (const twin of TWIN.get(a) ?? []) alts.add(twin);
    return [...alts];
  });
}

// For LIKE: % and _ typed by a member are plain characters.
export const likeEscape = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
