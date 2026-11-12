// Real time. The game keeps running while the app is closed: on start, and
// then every second, `advance` plays out everything since the last visit.
import { passTime } from './needs.js';
import { perks } from './perks.js';
import { MAX_CATCH_UP_HOURS } from './economy.js';

export function advance(state, now) {
  // A clock set back in time counts as no time passing.
  const ms = Math.min(Math.max(0, now - state.lastSeen), MAX_CATCH_UP_HOURS * 3600e3);
  const wasSleeping = state.nemla.sleeping;
  passTime(state.nemla, ms, perks(state));
  state.lastSeen = now;
  return { ms, wokeUp: wasSleeping && !state.nemla.sleeping };
}

const midnight = (t) => new Date(t).setHours(0, 0, 0, 0);

// Day 1 is the day the game started, counted on the phone's calendar.
export const dayNumber = (createdAt, now) => Math.round((midnight(now) - midnight(createdAt)) / 864e5) + 1;

export function isNight(now) {
  const hour = new Date(now).getHours();
  return hour >= 20 || hour < 6;
}

// The calendar day, as 2026-11-03, for things that reset at midnight.
export function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function yesterdayKey(t) {
  const d = new Date(t);
  d.setDate(d.getDate() - 1);
  return dayKey(d.getTime());
}

export const msToMidnight = (now) => new Date(now).setHours(24, 0, 0, 0) - now;

export function clockTime(now) {
  const d = new Date(now);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
