// The Durable Object's SQLite (session 79). worker.js sets it once, before
// the app is loaded; the sqlite and fs stand-ins below use it.
export const store = { sql: null, storage: null };
