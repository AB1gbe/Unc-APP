// Scam warnings in chat (session 31). Plain JS with no imports, so the
// server tests can check it. Looks at a message from the OTHER person and
// returns the reasons to be careful (empty list = nothing suspicious).
// It only shows a warning; it never blocks or reads anything on the server.

const PAY_FIRST = [
  /\b(bank )?transfer\b/i, /\bwire\b/i, /\bdeposit\b/i, /\badvance( payment)?\b/i, /\bpay (me )?(first|upfront|up front|before)\b/i,
  /\bsend (the )?money\b/i, /\bwestern union\b/i, /\bmoneygram\b/i, /\bgift ?cards?\b/i, /\bcrypto|bitcoin|usdt\b/i,
  /تحويل/, /حوالة/, /عربون/, /دفعة مقدمة|مقدم/, /ادفع (اول|أول|مقدما|مقدماً)/,
];
const IBAN = /\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9]{4}[ ]?){3,7}[A-Z0-9]{1,4}\b/;
const LINK = /(https?:\/\/|www\.|bit\.ly|wa\.me|t\.me)/i;

// -> ['payment'] | ['iban'] | ['link'] | several | []
export function scamSignals(text) {
  if (!text) return [];
  const out = [];
  if (PAY_FIRST.some((re) => re.test(text))) out.push('payment');
  if (IBAN.test(text.toUpperCase().replace(/[^A-Z0-9 ]/g, ' '))) out.push('iban');
  if (LINK.test(text)) out.push('link');
  return out;
}
