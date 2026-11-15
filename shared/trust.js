// Who may post what (session 102, ADR-082). Used by the server (the real
// check) and the posting form (which step to show).
//
// - Businesses (shops, landlords, employers): ID check + a payment card.
// - Housing and Jobs ads: ID check (most scams are rent and job scams).
// - A person selling their own things (For sale) or asking for something
//   (Wanted): a confirmed mobile number is enough. An ID check also works.
//
// postNeeds() returns null when the member may post, else the next step:
// 'phone', 'kyc' or 'card'. Email and Terms are checked before this.
export const PHONE_SECTIONS = ['forsale', 'wanted'];

export function postNeeds({ accountType, kycStatus, phoneVerified, hasCard }, section) {
  if (kycStatus === 'approved') return accountType === 'business' && !hasCard ? 'card' : null;
  if (accountType !== 'business' && PHONE_SECTIONS.includes(section)) return phoneVerified ? null : 'phone';
  return 'kyc';
}

// Bahrain mobile numbers: 8 digits starting with 3 or 6 (3xxxxxxx,
// 66xxxxxx), with or without +973 / 00973. Returns "+973XXXXXXXX" or null.
export function normalizePhone(input) {
  let d = String(input ?? '').replace(/[\s\-().]/g, '');
  // Arabic-Indic digits typed on an Arabic keyboard.
  d = d.replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));
  if (d.startsWith('+973')) d = d.slice(4);
  else if (d.startsWith('00973')) d = d.slice(5);
  else if (d.length === 11 && d.startsWith('973')) d = d.slice(3);
  return /^[36]\d{7}$/.test(d) ? `+973${d}` : null;
}

// "+973 •••• 4567": what the member sees of their own number.
export const maskPhone = (phone) => (phone ? `+973 •••• ${phone.slice(-4)}` : null);
