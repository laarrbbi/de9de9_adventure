import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passTime, worstNeed, mood } from '../www/js/needs.js';
import { NEED_DROP_PER_HOUR, SLEEP_GAIN_PER_HOUR } from '../www/js/economy.js';

const HOUR = 3600e3;
const nemla = (needs, sleeping = false) => ({ needs: { hunger: 80, energy: 80, clean: 80, fun: 80, ...needs }, sleeping });

test('needs drop with time and stop at zero', () => {
  const n = nemla({});
  passTime(n, 2 * HOUR);
  assert.equal(n.needs.hunger, 80 - 2 * NEED_DROP_PER_HOUR.hunger);
  assert.equal(n.needs.energy, 80 - 2 * NEED_DROP_PER_HOUR.energy);
  passTime(n, 100 * HOUR);
  assert.deepEqual(n.needs, { hunger: 0, energy: 0, clean: 0, fun: 0 });
});

test('sleeping refills energy instead of dropping it', () => {
  const n = nemla({ energy: 10 }, true);
  passTime(n, 0.1 * HOUR);
  assert.equal(n.needs.energy, 10 + 0.1 * SLEEP_GAIN_PER_HOUR);
  assert.equal(n.sleeping, true);
});

test('Nemla wakes up when energy is full, then energy drops again', () => {
  const n = nemla({ energy: 40 }, true);
  const toFull = 60 / SLEEP_GAIN_PER_HOUR;
  passTime(n, (toFull + 2) * HOUR);
  assert.equal(n.sleeping, false);
  assert.ok(Math.abs(n.needs.energy - (100 - 2 * NEED_DROP_PER_HOUR.energy)) < 1e-9);
});

test('time going backwards changes nothing', () => {
  const n = nemla({});
  passTime(n, -5 * HOUR);
  assert.deepEqual(n.needs, nemla({}).needs);
});

test('Nemla thinks about the lowest need, only when it is low', () => {
  assert.equal(worstNeed(nemla({}).needs), null);
  assert.equal(worstNeed(nemla({ hunger: 30, fun: 10 }).needs), 'fun');
});

test('mood follows the average of the needs', () => {
  assert.equal(mood(nemla({}).needs), 'happy');
  assert.equal(mood({ hunger: 50, energy: 50, clean: 50, fun: 50 }), 'ok');
  assert.equal(mood({ hunger: 10, energy: 20, clean: 30, fun: 40 }), 'low');
});
