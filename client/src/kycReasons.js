// Quick reasons an admin can pick when rejecting an identity check. The
// note is saved in English (what the admin clicked); members see it in
// their own language. A note typed by hand is shown as written.
import { t } from './i18n.jsx';

export const REJECT_REASONS = {
  'Photo is blurry or unreadable': () => t('Photo is blurry or unreadable'),
  'Selfie does not match the ID photo': () => t('Selfie does not match the ID photo'),
  'Name or date of birth does not match the ID': () => t('Name or date of birth does not match the ID'),
  'ID document is expired': () => t('ID document is expired'),
  'Part of the document is cut off': () => t('Part of the document is cut off'),
  'Business document missing or invalid': () => t('Business document missing or invalid'),
};

export const reasonText = (note) => REJECT_REASONS[note]?.() ?? note;
