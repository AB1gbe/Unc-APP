// Members may only contact each other inside a request's conversation (the
// MUST in docs/01 Project Brief.md). Public text on profiles and shop pages
// must therefore not carry a way around it: no phone numbers, links or
// email addresses (session 24). Chat messages are not checked: they are
// already inside a request's conversation.

export { hasContactDetails } from '../../../shared/contact-details.js';

export const CONTACT_MESSAGE = "Please don't add phone numbers, links, emails or @handles here. Buyers contact you through their requests.";
