// One-word git for this project. On Windows, inside the Unc-APP folder:
//
//   pull                  get the latest changes for the branch you're on
//   pull main             switch to "main" (or any branch) and get its latest
//   push                  save your changes and upload them (asks first)
//   push fixed a typo     same, with "fixed a typo" as the description
//   push -y               don't ask "are you sure?"
//   push --no-test        skip running the tests (not recommended)
//
// Also works as `npm run pull` / `npm run push -- <message>` on any system.
// pull.cmd / push.cmd in the project folder just call this file.
// See docs/Setup/Pull and Push.md
import { execFileSync, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));

const say = (msg = '') => console.log(msg);
const fail = (msg) => {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
};
// trimEnd, not trim: `git status --porcelain` lines START with a meaningful
// space (" M docs/x.md"); trimming would eat it and garble the first path.
function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}
function gitOk(...args) {
  try {
    git(...args);
    return true;
  } catch {
    return false;
  }
}
// npm is "npm.cmd" on Windows, so it has to go through the shell.
const npm = (...args) => spawnSync('npm', args, { stdio: 'inherit', shell: true }).status === 0;
// Answers are queued as they arrive, and each question takes the next one.
// (readline's own question() drops lines that arrive before it is called -
// e.g. several answers pasted at once - which froze the script.)
let rl = null;
const answers = [];
let waiting = null;
let inputClosed = false;
function startReader() {
  if (rl) return;
  rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => (waiting ? (waiting(line), (waiting = null)) : answers.push(line)));
  rl.on('close', () => {
    inputClosed = true;
    if (waiting) waiting(''), (waiting = null);
  });
}
async function ask(question) {
  startReader();
  process.stdout.write(question);
  if (answers.length) return answers.shift().trim();
  if (inputClosed) return '';
  return (await new Promise((resolve) => (waiting = resolve))).trim();
}

const currentBranch = () => git('rev-parse', '--abbrev-ref', 'HEAD');
const uncommitted = () => git('status', '--porcelain').split('\n').filter(Boolean);
const packagesChanged = (files) => files.some((f) => /(^|\/)package(-lock)?\.json$/.test(f));
// Files that must never be uploaded, even if .gitignore were changed by mistake.
const SECRET = /(^|\/)\.env$|\.sqlite(-wal|-shm)?$|^server\/data\//;
const CODE = /^(server|client|scripts|e2e)\/|(^|\/)package(-lock)?\.json$/;

function fetchBranch(branch) {
  if (!gitOk('fetch', '--quiet', 'origin', branch)) {
    fail(`Could not reach GitHub, or the branch "${branch}" does not exist there. Check your internet and the branch name.`);
  }
}

// Brings origin/<branch> into the current branch. Returns the changed files.
function mergeRemote(branch) {
  const before = git('rev-parse', 'HEAD');
  const incoming = git('log', '--format=  • %s', `HEAD..origin/${branch}`);
  if (!incoming) return [];
  say(`\nNew from GitHub:\n${incoming}`);
  try {
    git('merge', '--no-edit', `origin/${branch}`);
  } catch {
    gitOk('merge', '--abort');
    fail('Your changes and the ones on GitHub edit the same lines, so they can\'t be combined automatically.\n'
      + '  Nothing was lost: your changes are still here and nothing was uploaded.\n'
      + '  Ask Claude to help, or see docs/Setup/Pull and Push.md → "Conflicts".');
  }
  return git('diff', '--name-only', before, 'HEAD').split('\n').filter(Boolean);
}

async function pull(target) {
  if (target && target !== currentBranch()) {
    if (uncommitted().length) {
      fail(`You have unsaved changes, so I won't switch to "${target}". Run "push" to save them first, or undo them.`);
    }
    fetchBranch(target);
    say(`Switching to branch "${target}"…`);
    if (!gitOk('checkout', target)) fail(`Could not switch to "${target}".`);
  }
  const branch = currentBranch();
  if (branch === 'HEAD') fail('You are not on a branch. Run: pull main');
  say(`Branch: ${branch}`);
  const dirty = uncommitted().filter((l) => !l.startsWith('??'));
  if (dirty.length) {
    fail(`You have unsaved changes in ${dirty.length} file(s):\n${dirty.map((l) => '  ' + l).join('\n')}\n`
      + '  Run "push" to save and upload them first (it also pulls), or undo them with: git checkout -- .');
  }
  fetchBranch(branch);
  const changed = mergeRemote(branch);
  if (!changed.length) return say('\n✔ Already up to date.');
  if (packagesChanged(changed)) {
    say('\nThe package list changed: running npm install…');
    if (!npm('install')) fail('npm install failed. Read the messages above.');
  }
  say(`\n✔ Up to date (${changed.length} file(s) changed). If "npm run dev" is running, it updates by itself.`);
}

async function push(args) {
  const yes = args.includes('-y');
  const noTest = args.includes('--no-test');
  const message = args.filter((a) => a !== '-y' && a !== '--no-test').join(' ');
  const branch = currentBranch();
  if (branch === 'HEAD') fail('You are not on a branch. Run: pull main');

  const changes = uncommitted();
  const files = changes.map((l) => l.slice(3).replace(/^.* -> /, '').replace(/^"|"$/g, ''));
  const secrets = files.filter((f) => SECRET.test(f));
  if (secrets.length) fail(`These files must never be uploaded: ${secrets.join(', ')}. Nothing was uploaded.`);

  fetchBranch(branch);
  const ahead = Number(git('rev-list', '--count', `origin/${branch}..HEAD`));
  if (!changes.length && !ahead) {
    say('Nothing new to upload. Checking for updates instead…');
    return pull();
  }

  say(`Branch: ${branch}`);
  if (changes.length) {
    say(`\nYour changes (${changes.length} file(s)):`);
    for (const line of changes) {
      const code = line.slice(0, 2).trim();
      const what = { M: 'changed', A: 'new', D: 'deleted', '??': 'new', R: 'renamed' }[code] || code;
      say(`  ${what.padEnd(8)} ${line.slice(3)}`);
    }
  }
  if (ahead) say(`\n${ahead} saved change(s) not uploaded yet.`);

  if (!noTest && files.some((f) => CODE.test(f))) {
    say('\nYou changed code, so running the tests first…');
    if (!npm('test')) fail('Tests failed, so nothing was uploaded. Fix them (or ask Claude), then run push again.');
  }

  if (!yes && (await ask(`\nUpload to "${branch}" on GitHub? (y/n) `)).toLowerCase() !== 'y') {
    return say('Cancelled. Nothing was uploaded; your changes are still here.');
  }

  if (changes.length) {
    // git needs a name and email for each saved change.
    if (!gitOk('config', 'user.email')) {
      say('\nFirst time: git needs your name and email to label your changes (stored on this PC only).');
      git('config', '--global', 'user.name', (await ask('  Your name: ')) || os.userInfo().username);
      git('config', '--global', 'user.email', (await ask('  Your email (the one on GitHub): ')) || `${os.userInfo().username}@users.noreply.github.com`);
    }
    const text = message || (yes ? '' : await ask('Describe the change in a few words (Enter = "Update"): ')) || `Update from ${os.hostname()}`;
    git('add', '-A');
    git('commit', '--quiet', '-m', text);
  }

  const changed = mergeRemote(branch); // include anything pushed meanwhile (e.g. by Claude)
  if (packagesChanged(changed)) {
    say('\nThe package list changed: running npm install…');
    npm('install');
  }
  say('\nUploading…');
  const result = spawnSync('git', ['push', '-u', 'origin', branch], { stdio: 'inherit' });
  if (result.status !== 0) {
    fail('Upload failed (see above). Your changes are saved on this PC; run push again once the problem is fixed.\n'
      + '  If GitHub asked you to log in, finish that in the browser window and try again.');
  }
  say(`\n✔ Uploaded to "${branch}".`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'pull') await pull(rest[0]);
else if (command === 'push') await push(rest);
else fail('Use: pull [branch]  or  push [description]');
rl?.close();
