// "Numbers are hidden until you agree a price" (session 40), shared by the
// server (which hides them) and the website (which warns while typing).
// Finds phone numbers (any separators, Arabic digits, or spelled out),
// emails, links and @handles. Dates like 2026-12-01 are not phone numbers.

const PHONE = /\+?[\d٠-٩](?:[\s\-–.()/]*[\d٠-٩]){6,}/g;   // 7+ digits
const DATE = /^(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}[-./]\d{2,4})$/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const LINK = /(?:https?:\/\/|www\.)\S+|\b(?:wa\.me|t\.me|instagram\.com|snapchat\.com|facebook\.com)\/?\S*|\b[a-z0-9-]+\.(?:com|net|org|bh|io|me|co|app|store|shop|biz|info|xyz|online)\b\S*/gi;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/gi;
// Seven or more number words in a row: "three nine one two three four five".
const WORDS = 'zero|oh|one|two|three|four|five|six|seven|eight|nine|صفر|واحد|اثنين|اثنان|ثلاثة|ثلاث|أربعة|اربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تسعة|تسع';
const SPELLED = new RegExp(`(?:\\b(?:${WORDS})\\b[\\s,\\-]*){7,}`, 'gi');

export const HIDDEN = '📵';

// { text: with contact details replaced by 📵, found: true/false }
export function maskContacts(input) {
  if (!input) return { text: input, found: false };
  let found = false;
  const hide = () => { found = true; return HIDDEN; };
  let text = input
    .replace(EMAIL, hide)
    .replace(HANDLE, (m, space) => { found = true; return `${space}${HIDDEN}`; })
    .replace(LINK, hide)
    .replace(PHONE, (m) => (DATE.test(m.trim()) ? m : hide(m)))
    .replace(SPELLED, (m) => `${hide(m)} `);
  return { text: text.trimEnd(), found };
}

export const hasContacts = (text) => maskContacts(text).found;
