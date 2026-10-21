// Live sync: keeps this folder in step with a branch on GitHub, so you can
// watch changes appear in the running app while someone else (e.g. Claude)
// pushes them.
//
//   npm run live                 -> syncs the branch you're on + runs the app
//   npm run sync -- <branch>     -> only the syncing part, for any branch
//
// Every few seconds: git fetch -> if the branch moved on GitHub, fast-forward
// to it -> run npm install if package files changed. `npm run dev` (started
// by `npm run live`) then restarts the server and refreshes the browser on
// its own. Your own uncommitted edits are never overwritten: if you have
// any, syncing pauses and tells you.
// See docs/Setup/Watch Changes Live.md
import { execFileSync, spawnSync } from 'node:child_process';

const INTERVAL_MS = 5000;

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const branch = process.argv[2] || git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch === 'HEAD') {
  console.error('[sync] You are not on a branch. Run: git checkout <branch-name>');
  process.exit(1);
}
if (git('rev-parse', '--abbrev-ref', 'HEAD') !== branch) {
  console.error(`[sync] You are on "${git('rev-parse', '--abbrev-ref', 'HEAD')}" but asked to sync "${branch}". Run: git checkout ${branch}`);
  process.exit(1);
}

const time = () => new Date().toLocaleTimeString();
let lastWarning = '';
function warnOnce(message) {
  if (message !== lastWarning) console.log(`[sync ${time()}] ${message}`);
  lastWarning = message;
}

function tick() {
  try {
    git('fetch', '--quiet', 'origin', branch);
  } catch {
    return warnOnce('Could not reach GitHub (offline?). Will keep trying.');
  }
  const local = git('rev-parse', 'HEAD');
  const remote = git('rev-parse', `origin/${branch}`);
  if (local === remote) return;

  // Only move forward along the remote branch; never throw away local work.
  try {
    git('merge-base', '--is-ancestor', 'HEAD', `origin/${branch}`);
  } catch {
    return warnOnce('Your copy has commits that are not on GitHub, so syncing is paused. (Ask for help or run: git status)');
  }
  if (git('status', '--porcelain', '--untracked-files=no')) {
    return warnOnce('You have unsaved edits in tracked files, so syncing is paused. Undo them (git checkout -- .) or commit them.');
  }

  const changed = git('diff', '--name-only', 'HEAD', `origin/${branch}`).split('\n').filter(Boolean);
  const log = git('log', '--format=  • %s', `HEAD..origin/${branch}`);
  git('merge', '--ff-only', '--quiet', `origin/${branch}`);
  lastWarning = '';
  console.log(`\n[sync ${time()}] Pulled ${changed.length} changed file(s):\n${log}`);

  if (changed.some((f) => /(^|\/)package(-lock)?\.json$/.test(f))) {
    console.log('[sync] Package list changed: running npm install…');
    // shell: true so "npm" also resolves to npm.cmd on Windows.
    spawnSync('npm', ['install'], { stdio: 'inherit', shell: true });
  }
}

console.log(`[sync ${time()}] Watching branch "${branch}" on GitHub every ${INTERVAL_MS / 1000} s. Press Ctrl + C to stop.`);
tick();
setInterval(tick, INTERVAL_MS);
