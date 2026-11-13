// The Unc logo (session 85, ADR-075): a blue rounded tile with a white
// "u" and a yellow dot, then the word "unc". The tile is the same drawing
// as the app icon (client/public/icons/logo-mark.svg).
export function LogoMark({ size = 28 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1f5fd6" />
      <path d="M19 18v15a13 13 0 0 0 26 0V18" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
      <circle cx="45" cy="50" r="6" fill="#ffc928" />
    </svg>
  );
}

export default function Logo({ size = 28 }) {
  return <><LogoMark size={size} /><span className="logo-word">unc</span></>;
}
