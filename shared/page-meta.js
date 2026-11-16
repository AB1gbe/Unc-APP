// Puts a page's title, description and link-preview tags into index.html
// (session 103). Used by the Node server (server/src/app.js) and by the
// Cloudflare worker (cloudflare/worker.js), which serve the same page.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// meta: { title, description, tags } from pageMeta() in
// server/src/lib/previews.js. title and description are plain text;
// tags is already-escaped HTML made by the server.
export function applyMeta(html, { title, description, tags }) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', `    ${tags}\n  </head>`);
}
