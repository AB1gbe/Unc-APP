// Full-screen photo viewer. Swipe left/right on phones, arrow keys on a
// keyboard, Esc / tap outside / ✕ to close.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n.jsx';

export default function Lightbox({ photos, start = 0, onClose }) {
  const [i, setI] = useState(start);
  const touchX = useRef(null);
  const count = photos.length;
  const go = (d) => setI((x) => (x + d + count) % count);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(document.dir === 'rtl' ? -1 : 1);
      if (e.key === 'ArrowLeft') go(document.dir === 'rtl' ? 1 : -1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // no page scrolling behind it
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t('Photo {n} of {total}', { n: i + 1, total: count })}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
        if (Math.abs(dx) > 50) go((dx < 0 ? 1 : -1) * (document.dir === 'rtl' ? -1 : 1));
        touchX.current = null;
      }}>
      <img src={photos[i]} alt={t('Photo {n} of {total}', { n: i + 1, total: count })} />
      <button className="lb-close" onClick={onClose} aria-label={t('Close')}>✕</button>
      {count > 1 && (
        <>
          <button className="lb-prev" onClick={() => go(-1)} aria-label={t('Previous photo')}><span className="flip">‹</span></button>
          <button className="lb-next" onClick={() => go(1)} aria-label={t('Next photo')}><span className="flip">›</span></button>
          <div className="lb-count">{i + 1} / {count}</div>
        </>
      )}
    </div>,
    document.body,
  );
}
