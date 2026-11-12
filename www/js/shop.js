// The Shop: homes (moved into in order), rooms, cars, equipment and clothes.
// Nothing bought is ever lost. Plain functions on the save, no DOM; each
// returns { ok: true, ... } or { ok: false, why, ...details for the message }.
import { HOMES } from './economy.js';
import { itemById, owns } from './perks.js';
import { spend } from './wallet.js';

const no = (why, details = {}) => ({ ok: false, why, ...details });
const LIST = { car: 'cars', tool: 'equipment', clothes: 'clothes' };

export const nextHome = (state) => HOMES[state.home.level] ?? null;

// Whether an item can be bought now, without buying it.
export function check(state, id) {
  const found = itemById(id);
  if (!found) return no('missing');
  const { kind, item } = found;
  if (owns(state, id)) return no('owned');
  if (kind === 'home' && item !== nextHome(state)) return no('order', { home: HOMES[HOMES.indexOf(item) - 1].id });
  if (kind === 'room' && state.home.level < item.home) return no('home', { home: HOMES[item.home - 1].id });
  if (state.coins < item.price) return no('coins', { short: item.price - state.coins });
  return { ok: true, kind, item };
}

export function buy(state, id) {
  const can = check(state, id);
  if (!can.ok) return can;
  const { kind, item } = can;
  spend(state, item.price);
  if (kind === 'home') state.home.level += 1;
  else if (kind === 'room') state.home.rooms.push(id);
  else state.owned[LIST[kind]].push(id);
  if (kind === 'clothes') state.nemla.outfit = id;
  return { ok: true, kind, id, price: item.price };
}

// Puts on an owned outfit, or takes it off with `null`.
export function wear(state, id) {
  if (id !== null && (itemById(id)?.kind !== 'clothes' || !owns(state, id))) return no('missing');
  state.nemla.outfit = id;
  return { ok: true, id };
}
