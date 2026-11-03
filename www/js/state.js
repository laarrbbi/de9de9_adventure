// The save: one JSON object in localStorage. `storage` is passed in (it is
// localStorage in the game and a stand-in in tests), and every access is
// guarded because localStorage can throw in private browsing.
import { START } from './economy.js';

export const SAVE_KEY = 'de9adventure.save';
export const VERSION = 1;

export function newGame(now) {
  return {
    version: VERSION,
    createdAt: now,
    lastSeen: now,
    nemla: { level: 1, xp: 0, needs: { ...START.needs }, sleeping: false },
    coins: START.coins,
    totalEarned: 0,
    points: { balance: 0, day: '', today: 0 },
    home: { level: 1 },
    stats: { meals: 0, baths: 0, plays: 0, naps: 0 },
  };
}

// One function per old version, each returning the save one version newer.
// Empty while there is only version 1.
const UPGRADES = {};

// Returns { state, fresh }. A save that can't be read is kept under a
// second key, so a bug never silently wipes a player's progress.
export function load(storage, now) {
  let raw = null;
  try {
    raw = storage?.getItem(SAVE_KEY) ?? null;
  } catch {}
  if (raw === null) return { state: newGame(now), fresh: true };
  try {
    let saved = JSON.parse(raw);
    while (saved.version < VERSION) saved = UPGRADES[saved.version](saved);
    return { state: fillIn(saved, newGame(now)), fresh: false };
  } catch {
    try {
      storage.setItem(`${SAVE_KEY}.unreadable`, raw);
    } catch {}
    return { state: newGame(now), fresh: true };
  }
}

export function save(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Adds any field the saved game is missing (from a new feature) with its
// starting value, keeping everything the player already has.
function fillIn(saved, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in saved)) saved[key] = value;
    else if (isPlainObject(value) && isPlainObject(saved[key])) fillIn(saved[key], value);
  }
  return saved;
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
