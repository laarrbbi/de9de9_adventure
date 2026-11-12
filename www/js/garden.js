// The garden: plots that grow crops in real time (also while the app is
// closed), the barn that keeps the harvest, and the market that buys it.
// Plain functions on the save, no DOM. Each action returns what happened:
//   { ok: true, ... }  or  { ok: false, why, ...details for the message }
// Nothing dies: a ripe crop waits in its plot for as long as it takes.
import { CROPS, PLOTS_BY_HOME, plotPrice, MARKET_PER_DAY } from './economy.js';
import { earn, spend } from './wallet.js';
import { gainXp } from './care.js';
import { dayKey } from './clock.js';

const MIN = 60e3;
const no = (why, details = {}) => ({ ok: false, why, ...details });

export const cropById = (id) => CROPS.find((crop) => crop.id === id);
export const emptyPlot = () => ({ crop: null, plantedAt: 0, readyAt: 0 });
export const canGrow = (state, crop) => state.nemla.level >= crop.level;

// How long a crop planted now would take, in ms.
export function growTime(state, crop) {
  const firstOne = crop.first && !state.garden.planted[crop.id];
  return (firstOne ? crop.first : crop.grow) * MIN;
}

export const isReady = (plot, now) => plot.crop !== null && now >= plot.readyAt;
export const readyCount = (state, now) => state.garden.plots.filter((plot) => isReady(plot, now)).length;

// How far the crop has grown, from 0 to 1.
export function progress(plot, now) {
  if (!plot.crop) return 0;
  const total = plot.readyAt - plot.plantedAt;
  return total > 0 ? Math.min(1, Math.max(0, (now - plot.plantedAt) / total)) : 1;
}

export function plant(state, index, id, now) {
  const plot = state.garden.plots[index];
  const crop = cropById(id);
  if (!plot || !crop) return no('missing');
  if (plot.crop) return no('busy');
  if (!canGrow(state, crop)) return no('level', { level: crop.level });
  if (!spend(state, crop.seed)) return no('coins');
  plot.crop = crop.id;
  plot.plantedAt = now;
  plot.readyAt = now + growTime(state, crop);
  state.garden.planted[crop.id] = (state.garden.planted[crop.id] ?? 0) + 1;
  return { ok: true, crop: crop.id, cost: crop.seed };
}

// Takes a ripe crop into the barn without paying XP, for harvest and
// harvestAll to share.
function pick(state, plot) {
  const crop = cropById(plot.crop);
  Object.assign(plot, emptyPlot());
  state.garden.barn[crop.id] = (state.garden.barn[crop.id] ?? 0) + 1;
  state.stats.harvests += 1;
  return crop;
}

export function harvest(state, index, now) {
  const plot = state.garden.plots[index];
  if (!plot?.crop) return no('empty');
  if (!isReady(plot, now)) return no('growing', { left: plot.readyAt - now });
  const crop = pick(state, plot);
  return { ok: true, crop: crop.id, levels: gainXp(state, crop.xp) };
}

// Every ripe plot at once. `got` counts the crops by id.
export function harvestAll(state, now) {
  const got = {};
  let xp = 0;
  for (const plot of state.garden.plots) {
    if (!isReady(plot, now)) continue;
    const crop = pick(state, plot);
    got[crop.id] = (got[crop.id] ?? 0) + 1;
    xp += crop.xp;
  }
  const count = Object.values(got).reduce((a, b) => a + b, 0);
  if (!count) return no('nothingReady');
  return { ok: true, count, got, levels: gainXp(state, xp) };
}

// Plots: how many fit at this home, and what the next one costs.
export const roomForPlots = (state) => PLOTS_BY_HOME[Math.min(state.home.level, PLOTS_BY_HOME.length) - 1];
export const nextPlotPrice = (state) => plotPrice(state.garden.plots.length);

export function buyPlot(state) {
  const { plots } = state.garden;
  if (plots.length >= roomForPlots(state)) return no('room');
  const price = nextPlotPrice(state);
  if (!spend(state, price)) return no('coins');
  plots.push(emptyPlot());
  return { ok: true, price, index: plots.length - 1 };
}

// The market: how many more crops it buys today. Reading this never changes
// the save; the count resets on the first sale of a new day.
export function marketLeft(state, now) {
  const { market } = state.garden;
  return market.day === dayKey(now) ? Math.max(0, MARKET_PER_DAY - market.sold) : MARKET_PER_DAY;
}

// Sells up to `count` of one crop from the barn, as many as the market
// still takes today. `short` says the market took fewer than asked.
export function sell(state, id, now, count = Infinity) {
  const crop = cropById(id);
  const have = crop ? state.garden.barn[id] ?? 0 : 0;
  if (have <= 0) return no('nothing');
  const left = marketLeft(state, now);
  if (left <= 0) return no('market');
  const wanted = Math.min(have, count);
  const sold = Math.min(wanted, left);
  const { market } = state.garden;
  const today = dayKey(now);
  if (market.day !== today) {
    market.day = today;
    market.sold = 0;
  }
  market.sold += sold;
  state.garden.barn[id] = have - sold;
  state.stats.sold += sold;
  const coins = sold * crop.sell;
  earn(state, coins);
  return { ok: true, crop: id, count: sold, coins, short: sold < wanted };
}

// Sells the whole barn, the best-paying crops first while the market fills.
export function sellAll(state, now) {
  let count = 0;
  let coins = 0;
  let short = false;
  const best = [...CROPS].sort((a, b) => b.sell - a.sell);
  for (const crop of best) {
    if (!state.garden.barn[crop.id]) continue;
    const result = sell(state, crop.id, now);
    if (!result.ok) {
      short = result.why === 'market';
      if (short) break;
      continue;
    }
    count += result.count;
    coins += result.coins;
    short = result.short;
  }
  if (!count) return no(short ? 'market' : 'nothing');
  return { ok: true, count, coins, short };
}

export const barnTotal = (state) => Object.values(state.garden.barn).reduce((a, b) => a + b, 0);
