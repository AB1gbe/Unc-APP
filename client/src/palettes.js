// Colour options to try on the test site (session 105). The switcher
// (components/ColourSwitcher.jsx) only shows on the test site and in
// development; the choice is kept on this device only. "now" = the
// colours in styles.css (no override). Pictures: docs/Research/Colour
// Options 2026-11-17.md.
export const PALETTES = {
  now: { name: 'Now: Sky & Scarlet', swatch: ['#2c99d6', '#f8fafc', '#eb2f33'] },
  A: { name: 'A Navy & Gold', bg: '#faf8f3', s2: '#f1ede4', border: '#e6e0d4', text: '#0f1b2d', muted: '#6b6f78', brand: '#0b2545', soft: '#e8edf5', line: '#c7d3e6', sky: '#0b2545', accent: '#d9a21b', tile: '#0b2545', dot: '#e0a526' },
  B: { name: 'B Teal & Coral', bg: '#f7f4ee', s2: '#eee9df', border: '#e3dccf', text: '#1b2321', muted: '#68706d', brand: '#0f766e', soft: '#e3f2ef', line: '#b9ddd6', sky: '#0f766e', accent: '#f26b5b', tile: '#0f766e', dot: '#f26b5b' },
  C: { name: 'C Black & Electric Blue', bg: '#ffffff', s2: '#f2f3f5', border: '#e4e6ea', text: '#0a0a0a', muted: '#666b73', brand: '#2453ff', soft: '#eaf0ff', line: '#c6d4ff', sky: '#2453ff', accent: '#2453ff', tile: '#0a0a0a', dot: '#2453ff' },
  D: { name: 'D Indigo & Peach', bg: '#f8f7fc', s2: '#efedf7', border: '#e2dfef', text: '#16142b', muted: '#6c6a80', brand: '#4338ca', soft: '#ecebfb', line: '#cdc9f3', sky: '#4338ca', accent: '#ff8a5b', tile: '#4338ca', dot: '#ff8a5b' },
  E: { name: 'E Before: Blue & Yellow', bg: '#f5f6f8', s2: '#eef0f3', border: '#e1e4e8', text: '#16181d', muted: '#6b7280', brand: '#1f5fd6', soft: '#e8f0fd', line: '#c9dafb', sky: '#1f5fd6', accent: '#ffc928', tile: '#1f5fd6', dot: '#ffc928' },
};
for (const p of Object.values(PALETTES)) p.swatch ??= [p.tile, p.bg, p.dot];

const KEY = 'unc.palette';
const VARS = { bg: '--bg', s2: '--surface-2', border: '--border', text: '--text', muted: '--muted', brand: '--brand', soft: '--brand-soft', line: '--brand-line', sky: '--sky', accent: '--scarlet' };

export function savedPalette() {
  try { const k = localStorage.getItem(KEY); return PALETTES[k] ? k : 'now'; } catch { return 'now'; }
}

export function applyPalette(key) {
  const p = PALETTES[key] ?? PALETTES.now;
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(VARS)) { if (p[k]) root.setProperty(v, p[k]); else root.removeProperty(v); }
  if (p.accent) root.setProperty('--accent', p.accent); else root.removeProperty('--accent');
  let tag = document.getElementById('palette-logo');
  if (!tag) { tag = document.createElement('style'); tag.id = 'palette-logo'; document.head.appendChild(tag); }
  tag.textContent = p.tile ? `.logo-mark rect{fill:${p.tile}}.logo-mark circle{fill:${p.dot}}` : '';
  try { if (key === 'now') localStorage.removeItem(KEY); else localStorage.setItem(KEY, key); } catch { /* private mode: just this visit */ }
}
