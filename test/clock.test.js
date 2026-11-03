import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, dayNumber, isNight } from '../www/js/clock.js';
import { newGame } from '../www/js/state.js';
import { NEED_DROP_PER_HOUR, MAX_CATCH_UP_HOURS, SLEEP_GAIN_PER_HOUR } from '../www/js/economy.js';

const HOUR = 3600e3;

test('advance plays out the time since the last visit', () => {
  const s = newGame(0);
  const hunger = s.nemla.needs.hunger;
  const r = advance(s, 3 * HOUR);
  assert.equal(r.ms, 3 * HOUR);
  assert.equal(s.lastSeen, 3 * HOUR);
  assert.equal(s.nemla.needs.hunger, hunger - 3 * NEED_DROP_PER_HOUR.hunger);
});

test('a clock set back in time counts as no time', () => {
  const s = newGame(10 * HOUR);
  const needs = { ...s.nemla.needs };
  assert.equal(advance(s, 2 * HOUR).ms, 0);
  assert.deepEqual(s.nemla.needs, needs);
  assert.equal(s.lastSeen, 2 * HOUR);
});

test('a long absence is capped', () => {
  const s = newGame(0);
  assert.equal(advance(s, 1000 * 24 * HOUR).ms, MAX_CATCH_UP_HOURS * HOUR);
});

test('advance says when Nemla woke up', () => {
  const s = newGame(0);
  s.nemla.sleeping = true;
  s.nemla.needs.energy = 90;
  assert.equal(advance(s, (5 / SLEEP_GAIN_PER_HOUR) * HOUR).wokeUp, false);
  assert.equal(advance(s, HOUR).wokeUp, true);
});

test('days are counted on the calendar from the first day', () => {
  const start = new Date(2026, 9, 31, 23, 50).getTime();
  assert.equal(dayNumber(start, start), 1);
  assert.equal(dayNumber(start, new Date(2026, 10, 1, 0, 5).getTime()), 2);
  assert.equal(dayNumber(start, new Date(2026, 10, 7, 12, 0).getTime()), 8);
});

test('night is 8 pm to 6 am', () => {
  assert.equal(isNight(new Date(2026, 9, 31, 21, 0).getTime()), true);
  assert.equal(isNight(new Date(2026, 9, 31, 5, 59).getTime()), true);
  assert.equal(isNight(new Date(2026, 9, 31, 12, 0).getTime()), false);
});
