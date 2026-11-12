// The save: one JSON object in localStorage. `storage` is passed in (it is
// localStorage in the game and a stand-in in tests), and every access is
// guarded because localStorage can throw in private browsing.
import { START, CROPS, START_PLOTS } from './economy.js';

export const SAVE_KEY = 'de9adventure.save';
export const VERSION = 1;

export function newGame(now) {
  return {
    version: VERSION,
    createdAt: now,
    lastSeen: now,
    nemla: { level: 1, xp: 0, needs: { ...START.needs }, sleeping: false, outfit: null },
    coins: START.coins,
    totalEarned: 0,
    points: { balance: 0, day: '', today: 0 },
    home: { level: 1, rooms: [] },
    owned: { cars: [], equipment: [], clothes: [] },
    work: { day: '', board: [], earnedToday: 0, done: 0, streak: 0, lastWorked: '', helpedDay: '' },
    garden: {
      plots: Array.from({ length: START_PLOTS }, () => ({ crop: null, plantedAt: 0, readyAt: 0 })),
      seed: CROPS[0].id,
      barn: perCrop(),
      planted: perCrop(),
      market: { day: '', sold: 0 },
    },
    stats: { meals: 0, baths: 0, plays: 0, naps: 0, harvests: 0, sold: 0 },
    guide: { step: 0 },
  };
}

// A count for every crop, so a crop added later starts at 0 in old saves too.
const perCrop = () => Object.fromEntries(CROPS.map((crop) => [crop.id, 0]));

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
