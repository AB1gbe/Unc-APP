// Payment cards (session 40). Every member adds a card when they join, so
// people who cheat can be held to the Terms. Unc NEVER receives or stores a
// card number: the card form belongs to the payment company, which turns
// the card into a token; Unc keeps only the token, brand, last 4 digits
// and expiry.
//
// PAYMENT_PROVIDER:
//   'test' (default): a showcase. The website's test card form makes a
//          token itself (tok_test_<brand>_<last4>_<mm>_<yy>); no money moves.
//          The card 4000 0000 0000 0002 is always declined, to show that path.
//   'tap':  Tap Payments (to connect later): the website uses Tap's card
//          form (Tap Card SDK), Tap returns a token, and verifyCard() saves
//          the card to a Tap customer with TAP_SECRET_KEY. See
//          docs/Features/Keeping Deals on Unc.md and the Tap docs.
import { config } from '../config.js';
import { HttpError } from './http.js';

const BRANDS = ['visa', 'mastercard', 'amex', 'mada', 'benefit'];

const providers = {
  test: {
    async verifyCard(token) {
      const m = /^tok_test_([a-z]+)_(\d{4})_(\d{2})_(\d{2})$/.exec(String(token || ''));
      if (!m || !BRANDS.includes(m[1])) throw new HttpError(400, 'This card could not be read. Please check it and try again.', { field: 'token' });
      const [, brand, last4, mm, yy] = m;
      const month = Number(mm);
      const year = 2000 + Number(yy);
      const now = new Date();
      if (month < 1 || month > 12 || year < now.getUTCFullYear() || (year === now.getUTCFullYear() && month < now.getUTCMonth() + 1)) {
        throw new HttpError(400, 'This card has expired.', { field: 'token' });
      }
      if (last4 === '0002') throw new HttpError(402, 'Your bank declined this card. Please try another card.', { field: 'token' });
      return { providerRef: token, brand, last4, expMonth: month, expYear: year };
    },
  },
  tap: {
    async verifyCard() {
      // Not connected yet: needs a Tap merchant account and TAP_SECRET_KEY.
      throw new HttpError(503, 'Card payments are not connected yet. Please try again later.');
    },
  },
};

export const paymentProvider = () => providers[config.paymentProvider] ?? providers.test;
