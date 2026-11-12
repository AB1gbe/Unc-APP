// Unc on Cloudflare, test version (session 79, ADR-069).
// - Pages, scripts and images of the website: Cloudflare's static assets
//   (client/dist), served without touching this code.
// - /api/* and /uploads/*: forwarded to ONE Durable Object ("main") that runs
//   the normal Unc server (Express) with its database in the Durable
//   Object's own SQLite. See shims/sqlite.js and shims/fs.js.
import { DurableObject } from 'cloudflare:workers';
import { store } from './shims/storage.js';

const HOUR = 60 * 60 * 1000;

export class UncServer extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    store.sql = ctx.storage.sql;
    store.storage = ctx.storage;
    globalThis.UNC_ON_CLOUDFLARE = true;
    this.ready = ctx.blockConcurrencyWhile(async () => {
      const { start } = await import('./start.js');
      this.app = await start(env);
      if (!(await ctx.storage.getAlarm())) await ctx.storage.setAlarm(Date.now() + HOUR);
    });
  }

  async fetch(request) {
    await this.ready;
    // Rate limits and logs need the visitor's address (TRUST_PROXY=1).
    const headers = new Headers(request.headers);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) headers.set('X-Forwarded-For', ip);
    return this.app.handle(new Request(request, { headers }));
  }

  // Hourly jobs (expiry, reminders, deletions), like setInterval on a server.
  async alarm() {
    await this.ready;
    this.app.hourly();
    await this.ctx.storage.setAlarm(Date.now() + HOUR);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      return env.UNC.get(env.UNC.idFromName('main')).fetch(request);
    }
    // A test site: keep it out of search engines.
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  },
};
