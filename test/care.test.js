import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eat, wash, play, sleep, wake, gainXp } from '../www/js/care.js';
import { newGame } from '../www/js/state.js';
import { MEAL, PLAY_FUN, xpToNext, levelUpCoins } from '../www/js/economy.js';
import { addXp } from '../www/js/level.js';

test('eating costs coins and fills hunger', () => {
  const s = newGame(0);
  const before = { coins: s.coins, hunger: s.nemla.needs.hunger };
  const r = eat(s);
  assert.equal(r.ok, true);
  assert.equal(s.coins, before.coins - MEAL.cost);
  assert.equal(s.nemla.needs.hunger, before.hunger + MEAL.hunger);
  assert.equal(s.stats.meals, 1);
});

test('eating says no when full, broke or asleep', () => {
  const s = newGame(0);
  s.nemla.needs.hunger = 99;
  assert.deepEqual(eat(s), { ok: false, why: 'full' });
  s.nemla.needs.hunger = 10;
  s.coins = MEAL.cost - 1;
  assert.deepEqual(eat(s), { ok: false, why: 'coins' });
  assert.equal(s.coins, MEAL.cost - 1);
  s.nemla.sleeping = true;
  assert.deepEqual(eat(s), { ok: false, why: 'sleeping' });
});

test('washing fills clean, playing adds fun', () => {
  const s = newGame(0);
  s.nemla.needs.clean = 30;
  s.nemla.needs.fun = 30;
  assert.deepEqual(wash(s).gained, { clean: 70 });
  assert.equal(s.nemla.needs.clean, 100);
  play(s);
  assert.equal(s.nemla.needs.fun, 30 + PLAY_FUN);
});

test('sleep and wake', () => {
  const s = newGame(0);
  s.nemla.needs.energy = 99;
  assert.deepEqual(sleep(s), { ok: false, why: 'rested' });
  s.nemla.needs.energy = 20;
  assert.equal(sleep(s).ok, true);
  assert.equal(s.nemla.sleeping, true);
  assert.deepEqual(play(s), { ok: false, why: 'sleeping' });
  assert.equal(wake(s).ok, true);
  assert.deepEqual(wake(s), { ok: false, why: 'awake' });
});

test('XP can pass several levels at once and each one pays coins', () => {
  const s = newGame(0);
  const coins = s.coins;
  const xp = xpToNext(1) + xpToNext(2) + 3;
  const levels = gainXp(s, xp);
  assert.deepEqual(levels, [{ level: 2, coins: levelUpCoins(2) }, { level: 3, coins: levelUpCoins(3) }]);
  assert.equal(s.nemla.level, 3);
  assert.equal(s.nemla.xp, 3);
  assert.equal(s.coins, coins + levelUpCoins(2) + levelUpCoins(3));
  assert.equal(s.totalEarned, levelUpCoins(2) + levelUpCoins(3));
});

test('XP under the next level reaches no level', () => {
  const n = { level: 1, xp: 0 };
  assert.deepEqual(addXp(n, xpToNext(1) - 1), []);
});
