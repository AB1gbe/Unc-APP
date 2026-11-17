// Try the colour options on the test site (session 105). Only shown on
// the test site (TEST_SITE=1) and in development; never on a real site.
import { useEffect, useState } from 'react';
import { useMeta } from '../hooks.js';
import { PALETTES, applyPalette, savedPalette } from '../palettes.js';
import { t } from '../i18n.jsx';

export default function ColourSwitcher() {
  const meta = useMeta();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(savedPalette);
  useEffect(() => { applyPalette(choice); }, [choice]);
  if (!meta.colourSwitcher) return null;
  return (
    <div className="palette-switch">
      {open && (
        <div className="palette-panel" role="radiogroup" aria-label={t('Try colours')}>
          <b>{t('Try colours')}</b>
          <span className="muted small">{t('Test site only. Saved on this device.')}</span>
          {Object.entries(PALETTES).map(([k, p]) => (
            <button key={k} type="button" role="radio" aria-checked={choice === k} className={choice === k ? 'on' : ''} onClick={() => setChoice(k)}>
              <span className="palette-dots">{p.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
              <bdi>{t(p.name)}</bdi>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="palette-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="palette-dots">{PALETTES[choice].swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
        {open ? t('Close') : t('Colours')}
      </button>
    </div>
  );
}
