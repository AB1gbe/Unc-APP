// Members may only contact each other inside a request's conversation (the
// MUST in docs/01 Project Brief.md). Public text on profiles and shop pages
// must therefore not carry a way around it: no phone numbers, links or
// email addresses (session 24). Chat messages are not checked: they are
// already inside a request's conversation.

const PHONE = /(?:\+?[\d٠-٩][\s\-–.()]*){7,}/;            // 7+ digits, any separators, Arabic digits too
const LINK = /(https?:\/\/|www\.|wa\.me|t\.me|instagram\.com|\b[a-z0-9-]+\.(com|net|org|bh|io|me|co|app|store|shop)\b)/i;
const EMAIL = /\S+@\S+\.\S+/;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/i;                    // @instagram-style handles

export function hasContactDetails(text) {
  if (!text) return false;
  return PHONE.test(text) || LINK.test(text) || EMAIL.test(text) || HANDLE.test(text);
}

export const CONTACT_MESSAGE = "Please don't add phone numbers, links, emails or @handles here. Buyers contact you through their requests.";
