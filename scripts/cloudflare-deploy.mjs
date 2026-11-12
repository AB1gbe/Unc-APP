// Publishes the Cloudflare test site (session 80). Cloudflare's GitHub
// connection runs this as the deploy command: `npm run deploy`.
// 1. `wrangler deploy` (reads wrangler.jsonc).
// 2. Copies ADMIN_PASSWORD (and SECRET_PEPPER, if set) from the BUILD's
//    secrets into the running site's secrets, because the running site
//    can't see build secrets.
import { spawnSync } from 'node:child_process';

const run = (args, input) => {
  const r = spawnSync('npx', ['wrangler', ...args], { stdio: [input === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit'], input, shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(['deploy']);
for (const name of ['ADMIN_PASSWORD', 'SECRET_PEPPER']) {
  const value = process.env[name];
  if (value) {
    console.log(`Saving ${name} as a secret of the running site…`);
    run(['secret', 'put', name], value);
  }
}
