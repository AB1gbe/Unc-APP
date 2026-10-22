// Bahrain's governorates and main areas (session 31), shared by the server
// and the website. Plain JS, no imports. The city on requests and profiles
// stays free text (any town still works), but known areas are tidied to one
// spelling and shown in the reader's language.
// To add an area: add it to the right list below (English, Arabic, other
// spellings people type).

export const GOVERNORATES = [
  { key: 'Capital', en: 'Capital Governorate', ar: 'محافظة العاصمة', areas: [
    ['Manama', 'المنامة', ['manama city', 'al manama']], ['Juffair', 'الجفير', ['jufair']], ['Adliya', 'العدلية', ['adliyah']],
    ['Seef', 'السيف', ['al seef', 'seef district']], ['Gudaibiya', 'القضيبية', ['gudaibiyah']], ['Hoora', 'الحورة', ['hura']],
    ['Umm Al Hassam', 'أم الحصم', ['um al hassam']], ['Sanabis', 'السنابس', []], ['Salmaniya', 'السلمانية', ['salmaniyah']],
    ['Zinj', 'الزنج', []], ['Mahooz', 'الماحوز', ['mahuz']], ['Tubli', 'توبلي', []], ['Sitra', 'سترة', []],
    ['Diplomatic Area', 'المنطقة الدبلوماسية', []], ['Bahrain Bay', 'خليج البحرين', []],
  ] },
  { key: 'Muharraq', en: 'Muharraq Governorate', ar: 'محافظة المحرق', areas: [
    ['Muharraq', 'المحرق', ['al muharraq']], ['Arad', 'عراد', []], ['Busaiteen', 'البسيتين', ['busaiten']], ['Hidd', 'الحد', ['al hidd']],
    ['Galali', 'قلالي', ['qalali']], ['Amwaj Islands', 'جزر أمواج', ['amwaj']], ['Diyar Al Muharraq', 'ديار المحرق', ['diyar']],
    ['Samaheej', 'سماهيج', []], ['Dair', 'الدير', ['al dair']],
  ] },
  { key: 'Northern', en: 'Northern Governorate', ar: 'المحافظة الشمالية', areas: [
    ['Budaiya', 'البديع', ['budaya', 'al budaiya']], ['Jidhafs', 'جدحفص', []], ['Saar', 'سار', []], ['Hamad Town', 'مدينة حمد', ['madinat hamad']],
    ['Janabiya', 'الجنبية', ['janabiyah']], ['Diraz', 'الدراز', ['duraz']], ['Barbar', 'باربار', []], ['Karbabad', 'كرباباد', []],
    ['Bani Jamra', 'بني جمرة', []],
  ] },
  { key: 'Southern', en: 'Southern Governorate', ar: 'المحافظة الجنوبية', areas: [
    ['Riffa', 'الرفاع', ['al riffa', 'rifa']], ['East Riffa', 'الرفاع الشرقي', []], ['West Riffa', 'الرفاع الغربي', []],
    ['Isa Town', 'مدينة عيسى', ['madinat isa']], ['Awali', 'عوالي', []], ['Zallaq', 'الزلاق', []], ['Sakhir', 'الصخير', []],
    ['Askar', 'عسكر', []], ['Jaw', 'جو', []], ['Durrat Al Bahrain', 'درة البحرين', ['durrat']],
  ] },
];

// One lookup for every spelling: lower-case, no "al-", no "city", no punctuation.
const key = (s) => String(s).toLowerCase().normalize('NFKC')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[.,'’`-]/g, ' ').replace(/\b(al|el)\s+/g, '').replace(/\bcity\b/g, '').replace(/\s+/g, ' ').trim();

const BY_KEY = new Map();
const AREA = new Map(); // canonical English -> { ar, governorate }
for (const g of GOVERNORATES) {
  BY_KEY.set(key(g.en), { gov: g.key });
  BY_KEY.set(key(g.ar), { gov: g.key });
  for (const [en, ar, others] of g.areas) {
    AREA.set(en, { ar, governorate: g.key });
    for (const s of [en, ar, ...others]) BY_KEY.set(key(s), { area: en });
  }
}

// "manama", "المنامة", "Manama City" -> "Manama". Unknown places stay as
// typed (trimmed), so nobody is blocked.
export function normalizeCity(text) {
  if (text == null) return text;
  const trimmed = String(text).trim().replace(/\s+/g, ' ');
  const hit = BY_KEY.get(key(trimmed));
  return hit?.area ?? trimmed;
}

// "Capital" for "Manama"; also accepts a governorate's own name. Else null.
export function governorateOf(text) {
  if (!text) return null;
  const hit = BY_KEY.get(key(text));
  if (hit?.gov) return hit.gov;
  return hit?.area ? AREA.get(hit.area).governorate : null;
}

// Is this text a governorate name (e.g. "Capital Governorate" or "محافظة العاصمة")?
export function governorateNamed(text) {
  return text ? BY_KEY.get(key(text))?.gov ?? null : null;
}

export const areasOf = (gov) => GOVERNORATES.find((g) => g.key === gov)?.areas.map(([en]) => en) ?? [];

// The name to show: Arabic for known areas when the page is Arabic.
export function placeName(city, lang) {
  if (!city) return city;
  if (lang !== 'ar') return city;
  const a = AREA.get(city);
  if (a) return a.ar;
  const g = GOVERNORATES.find((x) => x.en === city);
  return g ? g.ar : city;
}
