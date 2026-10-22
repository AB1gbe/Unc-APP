// The showcase card form's helpers (session 40). Plain JS (no React) so the
// server tests can check it. In 'test' mode the website turns the card into
// a token itself, the way Tap's card form will in 'tap' mode: the card
// number never leaves the browser, only the token does.

export function digitsOf(text) {
  return String(text || '').replace(/[\s-]/g, '');
}

// The Luhn check every card number passes (catches typos).
export function luhnOk(number) {
  const d = digitsOf(number);
  if (!/^\d{12,19}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

export function brandOf(number) {
  const d = digitsOf(number);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return null;
}

// "12/29" -> { month: 12, year: 2029 } or null
export function readExpiry(text) {
  const m = /^\s*(\d{1,2})\s*\/\s*(\d{2})\s*$/.exec(String(text || ''));
  if (!m) return null;
  const month = Number(m[1]);
  return month >= 1 && month <= 12 ? { month, year: 2000 + Number(m[2]) } : null;
}

// What the test payment company "returns". Never contains the full number.
export function testToken(number, expiry) {
  const e = readExpiry(expiry);
  return `tok_test_${brandOf(number)}_${digitsOf(number).slice(-4)}_${String(e.month).padStart(2, '0')}_${String(e.year % 100).padStart(2, '0')}`;
}
