// The Terms (session 40). A DRAFT written in plain words: a lawyer in
// Bahrain must review it before Unc launches. Changing what members agree
// to? Also raise TERMS_VERSION in server/src/lib/terms.js so everyone is
// asked again.
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { t } from '../i18n.jsx';
import TermsAccept from '../components/TermsAccept.jsx';

const SECTIONS = () => [
  [t('1. What Unc is'), [
    t('Unc is a place where buyers post what they are looking for and verified sellers (shops and people) answer with offers. Unc is not the seller of any item and is not a party to the deal between members, except where these Terms say so.'),
  ]],
  [t('2. Your account'), [
    t('One person or business, one account. You must give your real identity for the identity check, keep your password safe, and be at least 18.'),
    t('Unc may ask for a payment card when you join. The card is checked and kept by our payment company; Unc never sees or stores your full card number.'),
  ]],
  [t('3. Talking only about a request'), [
    t('Members contact each other only inside a request’s conversation. Do not put phone numbers, emails, links or social media names on your profile or shop page.'),
    t('Until a price is agreed, contact details in chats are hidden. Please keep talking on Unc until then.'),
  ]],
  [t('4. Deals agreed on Unc are finished on Unc'), [
    t('When a price is accepted in an Unc chat, both members agree to complete that deal through Unc: keep the arrangements in the chat, mark the request as found when it is done, and use Unc’s payment options when they are offered.'),
    t('Moving a deal that was agreed on Unc to another app or to cash in order to avoid Unc, its rules or its fees is not allowed. If this happens, Unc may warn you, remove badges, limit or close your account, and, when Unc charges fees, charge the fee that would have applied.'),
    t('Deals finished outside Unc get no rating, no deal record, and no help from the Unc team if something goes wrong.'),
  ]],
  [t('5. Paying in parts'), [
    t('A buyer and a seller may agree a plan to pay in parts. The plan is an agreement between the two of them: Unc records it, reminds the buyer and shows each payment, but Unc does not lend money. Missing payments is a breach of these Terms and may be reported.'),
    t('Later, Unc may offer paying in parts through a licensed partner, with that partner’s own terms.'),
  ]],
  [t('6. Safety and honesty'), [
    t('Offers must be real and describe the item honestly, including its condition, warranty and returns. No stolen, fake or illegal items, and no asking for money before the buyer has seen the item.'),
    t('You can block a member, report a request or chat, and tell us when something went wrong with a deal. Our team may read a reported chat.'),
  ]],
  [t('7. Ratings'), [
    t('Ratings must be honest and only about the deal. Ratings come only from deals marked on Unc.'),
  ]],
  [t('8. Your data'), [
    t('You can download your data and delete your account at any time from your Account page. Identity documents are deleted with your account.'),
  ]],
  [t('9. Changes'), [
    t('If these Terms change in an important way, we will ask you to agree again before you post, offer or answer.'),
  ]],
];

export default function Terms() {
  const { user } = useAuth();
  return (
    <article className="narrow card terms">
      <h1>{t('Terms of use')}</h1>
      <p className="alert warn">{t('Draft: these Terms must be reviewed by a lawyer in Bahrain before Unc launches.')}</p>
      {SECTIONS().map(([title, paras]) => (
        <section key={title}>
          <h2>{title}</h2>
          {paras.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
      {user && !user.termsAccepted && <TermsAccept />}
      {!user && <p><Link className="btn" to="/register">{t('Create account')}</Link></p>}
    </article>
  );
}
