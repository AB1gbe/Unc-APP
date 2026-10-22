import { t } from '../i18n.jsx';

// Keeping deals on Unc (session 40): shown while typing a number, email or
// link before a price is agreed. Sending still works; the other person
// just sees 📵 until then.
export default function ContactNudge() {
  return (
    <div className="contact-nudge" role="note">
      {t('📵 Numbers, emails and links stay hidden until you agree a price. Keep talking here: your rating, proof photos and our help only work for deals on Unc.')}
    </div>
  );
}
