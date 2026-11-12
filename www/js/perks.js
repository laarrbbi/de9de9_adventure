// What Nemla's home, rooms, cars, equipment and outfit add up to. Every rule
// that a Shop item changes asks here, so an item's perk lives in one place:
// its line in economy.js. Plain functions on the save, no DOM.
import {
  HOMES, ROOMS, CARS, EQUIPMENT, CLOTHES, JOBS_PER_HOME, MEAL, PLAY_FUN,
} from './economy.js';

// Every item the Shop sells, by kind, and where the save records it.
export const KINDS = {
  home: HOMES,
  room: ROOMS,
  car: CARS,
  tool: EQUIPMENT,
  clothes: CLOTHES,
};
const LIST = { car: 'cars', tool: 'equipment', clothes: 'clothes' };

export function itemById(id) {
  for (const [kind, items] of Object.entries(KINDS)) {
    const item = items.find((i) => i.id === id);
    if (item) return { kind, item };
  }
  return null;
}

export const homeOf = (state) => HOMES[Math.min(state.home.level, HOMES.length) - 1];

// Whether Nemla has an item. A home counts once Nemla has lived there; the
// first car and the first tool come with every game.
export function owns(state, id) {
  const found = itemById(id);
  if (!found) return false;
  const { kind, item } = found;
  if (kind === 'home') return HOMES.indexOf(item) < state.home.level;
  if (kind === 'room') return state.home.rooms.includes(id);
  if (item.price === 0) return true;
  return state.owned[LIST[kind]].includes(id);
}

const NONE = () => ({
  jobs: 0, pay: 0, market: 1, grow: 1, sells: 0, sleep: 1, helpers: 0,
  drop: { hunger: 1, energy: 1, clean: 1, fun: 1 },
  meal: MEAL.hunger, washFun: 0, playFun: PLAY_FUN,
});

// The items whose perks are working now.
function working(state) {
  const items = [
    ...ROOMS.filter((r) => state.home.rooms.includes(r.id)),
    ...CARS.filter((c) => owns(state, c.id)),
    ...EQUIPMENT.filter((e) => owns(state, e.id)),
  ];
  const outfit = CLOTHES.find((c) => c.id === state.nemla.outfit);
  if (outfit) items.push(outfit);
  return items;
}

export function perks(state) {
  const p = NONE();
  p.jobs = JOBS_PER_HOME * (Math.min(state.home.level, HOMES.length) - 1);
  for (const item of working(state)) {
    p.jobs += item.jobs ?? 0;
    p.pay += item.pay ?? 0;
    p.sells += item.sells ?? 0;
    p.helpers += item.helpers ?? 0;
    p.market *= item.market ?? 1;
    p.grow *= item.grow ?? 1;
    p.sleep *= item.sleep ?? 1;
    for (const [need, rate] of Object.entries(item.drop ?? {})) p.drop[need] *= rate;
    if (item.meal) p.meal = Math.max(p.meal, item.meal);
    if (item.playFun) p.playFun = Math.max(p.playFun, item.playFun);
    p.washFun += item.washFun ?? 0;
  }
  return p;
}
