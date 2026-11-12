// Nemla's four needs. Plain functions on the save's `nemla` object, no DOM,
// so they run the same in the game and in tests.
import { NEED_DROP_PER_HOUR, SLEEP_GAIN_PER_HOUR, NEED_LOW } from './economy.js';

export const NEEDS = ['hunger', 'energy', 'clean', 'fun'];

const HOUR = 3600e3;
const clamp = (n) => Math.max(0, Math.min(100, n));

// Moves the needs forward by `ms` of real time. While Nemla sleeps, energy
// refills instead of dropping; once it is full Nemla wakes up and energy
// starts dropping again for the rest of the time. `rates` are the perks
// from things Nemla owns: `drop` slows each need down, `sleep` speeds up
// sleeping.
const SAME = { drop: { hunger: 1, energy: 1, clean: 1, fun: 1 }, sleep: 1 };

export function passTime(nemla, ms, rates = SAME) {
  const hours = Math.max(0, ms) / HOUR;
  const needs = nemla.needs;
  const drop = (k) => NEED_DROP_PER_HOUR[k] * rates.drop[k];
  for (const k of ['hunger', 'clean', 'fun']) needs[k] = clamp(needs[k] - drop(k) * hours);

  let awake = hours;
  if (nemla.sleeping) {
    const gain = SLEEP_GAIN_PER_HOUR * rates.sleep;
    const toFull = (100 - needs.energy) / gain;
    if (hours < toFull) {
      needs.energy = clamp(needs.energy + gain * hours);
      awake = 0;
    } else {
      needs.energy = 100;
      nemla.sleeping = false;
      awake = hours - toFull;
    }
  }
  needs.energy = clamp(needs.energy - drop('energy') * awake);
}

export const average = (needs) => NEEDS.reduce((sum, k) => sum + needs[k], 0) / NEEDS.length;

// The need Nemla is thinking about: the lowest one, if it is low at all.
export function worstNeed(needs) {
  let worst = null;
  for (const k of NEEDS) if (needs[k] < NEED_LOW && (worst === null || needs[k] < needs[worst])) worst = k;
  return worst;
}

export function mood(needs) {
  const avg = average(needs);
  return avg >= 70 ? 'happy' : avg >= 40 ? 'ok' : 'low';
}
