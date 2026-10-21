// The home page's greeting and seasonal line (client/src/seasons.js,
// session 20). Plain JS, so it can be tested here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partOfDay, season, hijri } from '../../client/src/seasons.js';

const at = (iso) => new Date(`${iso}T12:00:00`);

test('greeting follows the time of day', () => {
  assert.equal(partOfDay(new Date('2026-05-01T08:00:00')), 'morning');
  assert.equal(partOfDay(new Date('2026-05-01T14:00:00')), 'afternoon');
  assert.equal(partOfDay(new Date('2026-05-01T21:00:00')), 'evening');
  assert.equal(partOfDay(new Date('2026-05-01T02:00:00')), 'evening');
});

test('Ramadan, both Eids and National Day come from the calendar, not a table', () => {
  assert.equal(hijri(at('2026-03-01')).month, 9, 'the Umm al-Qura calendar is available');
  assert.equal(season(at('2026-03-01')), 'ramadan');
  assert.equal(season(at('2026-03-21')), 'eid-fitr');
  assert.equal(season(at('2026-05-28')), 'eid-adha');
  assert.equal(season(at('2026-12-16')), 'national-day');
  assert.equal(season(at('2026-07-01')), null);
});
