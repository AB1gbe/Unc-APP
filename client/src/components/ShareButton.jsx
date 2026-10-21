// "Share" on a request (session 20). Phones open their own share sheet
// (WhatsApp, Instagram, Messages…). Computers get WhatsApp and Copy link.
// The link shows a preview card with the photo and price when pasted
// (server/src/lib/previews.js).
import { useState } from 'react';
import { celebrate } from './Celebrate.jsx';
import { t } from '../i18n.jsx';

export default function ShareButton({ listing, mine }) {
  const [open, setOpen] = useState(false);
  const url = `${window.location.origin}/requests/${listing.id}`;
  const text = mine
    ? t("I'm looking for: {title}. Have one? Make me an offer on Unc:", { title: listing.title })
    : t('Someone is looking for: {title}. Have one? Make an offer on Unc:', { title: listing.title });

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, text, url }); } catch { /* closed the sheet */ }
      return;
    }
    setOpen((o) => !o);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      celebrate({ text: t('Link copied! Paste it anywhere.') });
    } catch {
      window.prompt(t('Copy this link:'), url);
    }
    setOpen(false);
  }

  return (
    <span className="share">
      <button type="button" className="btn sm secondary" onClick={share} aria-expanded={open}>{t('↗ Share')}</button>
      {open && (
        <span className="share-menu" role="menu">
          <a role="menuitem" className="btn sm whatsapp" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            {t('WhatsApp')}
          </a>
          <button type="button" role="menuitem" className="btn sm secondary" onClick={copy}>{t('Copy link')}</button>
        </span>
      )}
    </span>
  );
}
