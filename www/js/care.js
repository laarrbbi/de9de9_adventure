// What the player can do for Nemla at home. Each action changes the save and
// returns what happened, for the screen to show:
//   { ok: true, gained: { need: amount }, levels: [{ level, coins }] }
//   { ok: false, why: 'sleeping' | 'full' | 'coins' | 'clean' | 'fun' | 'rested' | 'awake' }
import { MEAL, PLAY_FUN, CARE_XP, NEED_FULL, levelUpCoins } from './economy.js';
import { addXp } from './level.js';
import { earn, spend } from './wallet.js';

const no = (why) => ({ ok: false, why });

export function eat(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.hunger >= NEED_FULL) return no('full');
  if (!spend(state, MEAL.cost)) return no('coins');
  needs.hunger = Math.min(100, needs.hunger + MEAL.hunger);
  state.stats.meals += 1;
  return done(state, { hunger: MEAL.hunger, coins: -MEAL.cost });
}

export function wash(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.clean >= NEED_FULL) return no('clean');
  const gained = Math.round(100 - needs.clean);
  needs.clean = 100;
  state.stats.baths += 1;
  return done(state, { clean: gained });
}

export function play(state) {
  const { needs } = state.nemla;
  if (state.nemla.sleeping) return no('sleeping');
  if (needs.fun >= NEED_FULL) return no('fun');
  needs.fun = Math.min(100, needs.fun + PLAY_FUN);
  state.stats.plays += 1;
  return done(state, { fun: PLAY_FUN });
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
