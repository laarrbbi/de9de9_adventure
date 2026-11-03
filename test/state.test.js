import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, newGame, SAVE_KEY, VERSION } from '../www/js/state.js';

function memoryStorage(data = {}) {
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
}

test('no save starts a new game', () => {
  const { state, fresh } = load(memoryStorage(), 123);
  assert.equal(fresh, true);
  assert.deepEqual(state, newGame(123));
});

test('a saved game comes back as it was', () => {
  const storage = memoryStorage();
  const s = newGame(5);
  s.coins = 777;
  s.nemla.level = 3;
  assert.equal(save(storage, s), true);
  const { state, fresh } = load(storage, 99);
  assert.equal(fresh, false);
  assert.deepEqual(state, s);
});

test('fields added by later updates are filled in, the rest is kept', () => {
  const old = newGame(5);
  delete old.stats;
  delete old.nemla.needs.fun;
  old.coins = 42;
  const { state } = load(memoryStorage({ [SAVE_KEY]: JSON.stringify(old) }), 99);
  assert.equal(state.coins, 42);
  assert.deepEqual(state.stats, newGame(0).stats);
  assert.equal(state.nemla.needs.fun, newGame(0).nemla.needs.fun);
  assert.equal(state.version, VERSION);
});

test('an unreadable save is kept aside, not lost', () => {
  const storage = memoryStorage({ [SAVE_KEY]: '{broken' });
  const { state, fresh } = load(storage, 1);
  assert.equal(fresh, true);
  assert.deepEqual(state, newGame(1));
  assert.equal(storage.data[`${SAVE_KEY}.unreadable`], '{broken');
});

test('no storage at all still plays, without saving', () => {
  assert.equal(load(null, 1).fresh, true);
  assert.equal(save(null, newGame(1)), false);
});
