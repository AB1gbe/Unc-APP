// Start-up when the port is already taken (session 49): it must fail with a
// clear message, not print "listening" and stop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { listen } from '../src/lib/listen.js';

test('a taken port gives a clear error instead of a fake "listening"', async () => {
  const blocker = http.createServer().listen(0);
  await new Promise((r) => blocker.once('listening', r));
  const { port } = blocker.address();
  await assert.rejects(listen(express(), port), (err) => err.code === 'EADDRINUSE' && /already in use/.test(err.message) && /Ctrl \+ C/.test(err.message));
  const ok = await listen(express(), 0);
  assert.ok(ok.address().port > 0);
  ok.close();
  blocker.close();
});
