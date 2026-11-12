// Prepares the Cloudflare test site (session 79): builds the website and
// copies the demo photos next to it, so the Durable Object can load them
// when it seeds the demo data. Run from the Unc-APP folder:
//   node scripts/cloudflare-build.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
execSync('npm run build', { cwd: root, stdio: 'inherit' });
const from = `${root}/server/demo-photos`;
const to = `${root}/client/dist/demo-photos`;
fs.mkdirSync(to, { recursive: true });
for (const f of fs.readdirSync(from).filter((n) => n.endsWith('.jpg'))) fs.copyFileSync(`${from}/${f}`, `${to}/${f}`);
console.log('Cloudflare build ready: client/dist (+ demo-photos)');
