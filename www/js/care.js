// What the player can do for Nemla at home. Each action changes the save and
// returns what happened, for the screen to show:
//   { ok: true, gained: { need: amount }, levels: [{ level, coins }] }
//   { ok: false, why: 'sleeping' | 'full' | 'coins' | 'clean' | 'fun' | 'rested' | 'awake' }
import { MEAL, CARE_XP, NEED_FULL, levelUpCoins } from './economy.js';
import { addXp } from './level.js';
import { earn, spend } from './wallet.js';
import { perks } from './perks.js';

const no = (why) => ({ ok: false, why });

export function eat(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.hunger >= NEED_FULL) return no('full');
  if (!spend(state, MEAL.cost)) return no('coins');
  const { meal } = perks(state);
  needs.hunger = Math.min(100, needs.hunger + meal);
  state.stats.meals += 1;
  return done(state, { hunger: meal, coins: -MEAL.cost });
}

export function wash(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.clean >= NEED_FULL) return no('clean');
  const gained = Math.round(100 - needs.clean);
  const { washFun } = perks(state);
  needs.clean = 100;
  needs.fun = Math.min(100, needs.fun + washFun);
  state.stats.baths += 1;
  return done(state, washFun ? { clean: gained, fun: washFun } : { clean: gained });
}

export function play(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.fun >= NEED_FULL) return no('fun');
  const { playFun } = perks(state);
  needs.fun = Math.min(100, needs.fun + playFun);
  state.stats.plays += 1;
  return done(state, { fun: playFun });
}

export function sleep(state) {
  if (state.nemla.sleeping) return no('sleeping');
  if (state.nemla.needs.energy >= NEED_FULL) return no('rested');
  state.nemla.sleeping = true;
  state.stats.naps += 1;
  return done(state, {});
}

export function wake(state) {
  if (!state.nemla.sleeping) return no('awake');
  state.nemla.sleeping = false;
  return { ok: true, gained: {}, levels: [] };
}

// Adds XP and pays the coins for every level reached.
export function gainXp(state, xp) {
  return addXp(state.nemla, xp).map((level) => {
    const coins = levelUpCoins(level);
    earn(state, coins);
    return { level, coins };
  });
}

function done(state, gained) {
  return { ok: true, gained, levels: gainXp(state, CARE_XP) };
}
