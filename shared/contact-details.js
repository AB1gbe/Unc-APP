// Phone numbers, links, emails and @handles in public text (session 24;
// moved here in session 82 so the posting form can warn too).
const PHONE = /(?:\+?[\d٠-٩][\s\-–.()]*){7,}/;            // 7+ digits, any separators, Arabic digits too
const LINK = /(https?:\/\/|www\.|wa\.me|t\.me|instagram\.com|\b[a-z0-9-]+\.(com|net|org|bh|io|me|co|app|store|shop)\b)/i;
const EMAIL = /\S+@\S+\.\S+/;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/i;                    // @instagram-style handles

export function hasContactDetails(text) {
  if (!text) return false;
  return PHONE.test(text) || LINK.test(text) || EMAIL.test(text) || HANDLE.test(text);
}
