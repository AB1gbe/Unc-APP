// Every piece of English text the website shows through t()/tj()/tn() must
// have an Arabic translation in client/src/locales/ar.js, with the same
// {placeholders}. Also covers the category names (translated with t(c)).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATEGORIES } from '../src/lib/categories.js';

const clientSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/src');
const { default: ar } = await import(pathToFileURL(path.join(clientSrc, 'locales/ar.js')));

const STR = `'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)"`;
const unescape = (s) => s.replace(/\\(.)/g, '$1');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(dir, e.name)] : []);
}

const singles = new Map(); // text -> file
const plurals = new Map(); // other-form text -> { one, file }
for (const file of walk(clientSrc)) {
  if (file.includes(`${path.sep}locales${path.sep}`)) continue;
  // Skip comments (examples in comments are not real UI text).
  const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const rel = path.relative(clientSrc, file);
  for (const m of src.matchAll(new RegExp(`\\bt[j]?\\(\\s*(?:${STR})`, 'g'))) singles.set(unescape(m[1] ?? m[2]), rel);
  for (const m of src.matchAll(new RegExp(`\\btn\\([^'"]*?(?:${STR})\\s*,\\s*(?:${STR})`, 'g'))) {
    plurals.set(unescape(m[3] ?? m[4]), { one: unescape(m[1] ?? m[2]), file: rel });
  }
}
for (const c of CATEGORIES) singles.set(c, 'server/src/lib/categories.js (shown with t(category))');

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('found the texts to check (sanity)', () => {
  assert.ok(singles.size > 50, `only ${singles.size} texts found - is the scanner broken?`);
});

test('every t()/tj() text has an Arabic translation with the same placeholders', () => {
  const problems = [];
  for (const [text, file] of singles) {
    if (typeof ar[text] !== 'string') problems.push(`MISSING  ${JSON.stringify(text)}  (${file})`);
    else if (placeholders(ar[text]).join() !== placeholders(text).join()) problems.push(`PLACEHOLDERS differ  ${JSON.stringify(text)}`);
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\n`);
});

test('every tn() plural has Arabic forms (at least "other"), each keeping the placeholders', () => {
  const problems = [];
  for (const [other] of plurals) {
    const forms = ar[other];
    if (!forms || typeof forms !== 'object' || !forms.other) { problems.push(`MISSING plural  ${JSON.stringify(other)}`); continue; }
    const want = placeholders(other).filter((p) => p !== 'n');
    for (const [form, value] of Object.entries(forms)) {
      const got = placeholders(value).filter((p) => p !== 'n');
      if (want.some((p) => !got.includes(p))) problems.push(`PLACEHOLDERS differ  ${JSON.stringify(other)} [${form}]`);
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join('\n')}\n`);
});

test('ar.js has no duplicate keys (a second copy would silently win)', () => {
  const text = fs.readFileSync(path.join(clientSrc, 'locales/ar.js'), 'utf8');
  const keys = [...text.matchAll(/^\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|([A-Za-z_]\w*))\s*:/gm)]
    .map((m) => unescape(m[1] ?? m[2] ?? m[3]))
    .filter((k) => !['zero', 'one', 'two', 'few', 'many', 'other'].includes(k));
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  assert.deepEqual(dupes, []);
});
