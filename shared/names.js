// "Show only my first name" (session 34), shared by the server and the
// website: "Sam Buyer" → "Sam B.", "محمد علي" → "محمد ع.". One word stays as it is.
export function shortName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${[...parts.at(-1)][0]}.`;
}

// The name other members see: short when the member chose it.
export const nameFor = (name, short) => (short ? shortName(name) : name);
