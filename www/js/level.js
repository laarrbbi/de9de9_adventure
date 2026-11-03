// Nemla's level. XP comes from almost everything; each new level pays coins.
import { xpToNext } from './economy.js';

// Adds XP and returns the levels reached on the way, usually none.
export function addXp(nemla, xp) {
  nemla.xp += xp;
  const reached = [];
  while (nemla.xp >= xpToNext(nemla.level)) {
    nemla.xp -= xpToNext(nemla.level);
    nemla.level += 1;
    reached.push(nemla.level);
  }
  return reached;
}

// How far into the current level, from 0 to 1, for the XP bar.
export const levelProgress = (nemla) => nemla.xp / xpToNext(nemla.level);
