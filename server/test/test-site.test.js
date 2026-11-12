// The Cloudflare test site (session 80): it is built as "production", but a
// test site may use console email and show sign-up codes on screen. A real
// production server still refuses both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const load = (env) => spawnSync(process.execPath, ['--input-type=module', '-e',
  "const { config } = await import('./src/config.js'); console.log(JSON.stringify({ isProd: config.isProd, show: config.showDevCodes }));"],
{ cwd: new URL('..', import.meta.url).pathname, env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });

test('a production build marked TEST_SITE=1 starts with console email and shows sign-up codes', () => {
  const r = load({ NODE_ENV: 'production', TEST_SITE: '1', MAIL_TRANSPORT: 'console' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { isProd: true, show: true });
});

test('a real production server still refuses console email and a missing pepper', () => {
  const noPepper = load({ NODE_ENV: 'production', MAIL_TRANSPORT: 'smtp' });
  assert.notEqual(noPepper.status, 0);
  assert.match(noPepper.stderr, /SECRET_PEPPER must be set/);
  const consoleMail = load({ NODE_ENV: 'production', SECRET_PEPPER: 'x'.repeat(32), MAIL_TRANSPORT: 'console' });
  assert.notEqual(consoleMail.status, 0);
  assert.match(consoleMail.stderr, /MAIL_TRANSPORT/);
  const real = load({ NODE_ENV: 'production', SECRET_PEPPER: 'x'.repeat(32), MAIL_TRANSPORT: 'smtp' });
  assert.equal(real.status, 0, real.stderr);
  assert.equal(JSON.parse(real.stdout).show, false, 'never show codes on a real site');
});
