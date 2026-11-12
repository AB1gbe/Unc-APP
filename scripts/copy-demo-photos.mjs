// Copies the demo photos next to the built website (session 79), so the
// Cloudflare test site can load them when it creates the demo data. Runs at
// the end of `npm run build`. (On a PC they're simply also in client/dist.)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const from = `${root}/server/demo-photos`;
const to = `${root}/client/dist/demo-photos`;
fs.mkdirSync(to, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(from).filter((x) => x.endsWith('.jpg'))) { fs.copyFileSync(`${from}/${f}`, `${to}/${f}`); n++; }
console.log(`Copied ${n} demo photos to client/dist/demo-photos`);
