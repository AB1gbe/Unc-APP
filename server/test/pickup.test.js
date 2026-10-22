// Pickup checklist and big-deal card (session 37): the rules in client/src/pickup.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checklistFor, isBigDeal } from '../../client/src/pickup.js';
import { CATEGORIES, CURRENCIES } from '../src/lib/categories.js';

test('every category gets a checklist that ends with the common checks', () => {
  for (const c of CATEGORIES) {
    const list = checklistFor(c);
    assert.deepEqual(list.slice(-3), ['asDescribed', 'publicPlace', 'payWhenHappy'], c);
    assert.equal(new Set(list).size, list.length, `${c}: no repeats`);
  }
  assert.ok(checklistFor('Phones & Tablets').includes('imei'));
  assert.ok(checklistFor('Vehicles & Parts').includes('fits'));
});

test('the big-deal card shows from the limit up, for every currency we use', () => {
  for (const cur of CURRENCIES) assert.ok(isBigDeal(100000, cur), `${cur} has a limit`);
  assert.equal(isBigDeal(499, 'USD'), false);
  assert.equal(isBigDeal(500, 'USD'), true);
  assert.equal(isBigDeal(200, 'BHD'), true);
  assert.equal(isBigDeal(null, 'USD'), false);
  assert.equal(isBigDeal(999999, 'XYZ'), false);
});
