import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  plant, harvest, harvestAll, isReady, progress, readyCount, growTime, cropById,
  buyPlot, nextPlotPrice, roomForPlots, sell, sellAll, marketLeft, barnTotal,
} from '../www/js/garden.js';
import { newGame, load, SAVE_KEY } from '../www/js/state.js';
import { START_PLOTS, MARKET_PER_DAY, PLOTS_BY_HOME } from '../www/js/economy.js';

const MIN = 60e3;
const day = (d, h = 12) => new Date(2026, 10, d, h, 0).getTime();
const mint = cropById('mint');
const wheat = cropById('wheat');
const tomato = cropById('tomato');

function game(now = day(3)) {
  const s = newGame(now);
  s.coins = 1000;
  return s;
}

test('a new game has empty plots and an empty barn', () => {
  const s = newGame(day(3));
  assert.equal(s.garden.plots.length, START_PLOTS);
  assert.ok(s.garden.plots.every((plot) => plot.crop === null));
  assert.equal(barnTotal(s), 0);
});

test('planting costs the seed and the crop grows in real time', () => {
  const s = game();
  const now = day(3);
  const r = plant(s, 1, 'wheat', now);
  assert.equal(r.ok, true);
  assert.equal(s.coins, 1000 - wheat.seed);
  assert.equal(s.garden.plots[1].crop, 'wheat');
  assert.equal(isReady(s.garden.plots[1], now), false);
  assert.equal(progress(s.garden.plots[1], now + 30 * MIN), 0.5);
  assert.equal(isReady(s.garden.plots[1], now + 60 * MIN), true);
  assert.equal(readyCount(s, now + 60 * MIN), 1);
});

test('the first mint grows in 2 minutes, the next ones in 30', () => {
  const s = game();
  assert.equal(growTime(s, mint), mint.first * MIN);
  plant(s, 0, 'mint', day(3));
  assert.equal(s.garden.plots[0].readyAt - day(3), 2 * MIN);
  plant(s, 1, 'mint', day(3));
  assert.equal(s.garden.plots[1].readyAt - day(3), 30 * MIN);
  assert.equal(growTime(s, wheat), wheat.grow * MIN, 'other crops have no quick first time');
});

test("planting says no to a full plot, a locked crop, or too few coins", () => {
  const s = game();
  plant(s, 0, 'mint', day(3));
  assert.equal(plant(s, 0, 'wheat', day(3)).why, 'busy');
  const locked = plant(s, 1, 'tomato', day(3));
  assert.equal(locked.why, 'level');
  assert.equal(locked.level, tomato.level);
  s.nemla.level = tomato.level;
  s.coins = tomato.seed - 1;
  assert.equal(plant(s, 1, 'tomato', day(3)).why, 'coins');
  assert.equal(s.coins, tomato.seed - 1, 'nothing taken');
  assert.equal(plant(s, 9, 'mint', day(3)).why, 'missing');
});

test('harvesting waits for the crop, fills the barn and pays XP', () => {
  const s = game();
  plant(s, 0, 'wheat', day(3));
  const early = harvest(s, 0, day(3) + 10 * MIN);
  assert.equal(early.why, 'growing');
  assert.equal(early.left, 50 * MIN);
  assert.equal(harvest(s, 1, day(3)).why, 'empty');

  const r = harvest(s, 0, day(3) + 60 * MIN);
  assert.equal(r.ok, true);
  assert.equal(r.crop, 'wheat');
  assert.equal(s.garden.barn.wheat, 1);
  assert.equal(s.nemla.xp, wheat.xp);
  assert.equal(s.garden.plots[0].crop, null, 'the plot is empty again');
});

test('a ripe crop waits as long as it takes', () => {
  const s = game();
  plant(s, 0, 'mint', day(3));
  assert.equal(harvest(s, 0, day(30)).ok, true);
});

test('harvest all picks every ripe plot and leaves the rest growing', () => {
  const s = game();
  s.garden.plots.push({ crop: null, plantedAt: 0, readyAt: 0 });
  plant(s, 0, 'mint', day(3)); // 2 min, the first mint
  plant(s, 1, 'mint', day(3)); // 30 min
  plant(s, 2, 'wheat', day(3)); // 60 min
  const r = harvestAll(s, day(3) + 30 * MIN);
  assert.equal(r.count, 2);
  assert.deepEqual(r.got, { mint: 2 });
  assert.equal(s.nemla.xp, 2 * mint.xp);
  assert.equal(s.garden.plots[2].crop, 'wheat');
  assert.equal(harvestAll(s, day(3) + 31 * MIN).why, 'nothingReady');
});

test('plots cost 500, then 100 more each, up to what the home has room for', () => {
  const s = game();
  s.coins = 10000;
  assert.equal(nextPlotPrice(s), 500);
  assert.equal(buyPlot(s).price, 500);
  assert.equal(buyPlot(s).price, 600);
  assert.equal(s.garden.plots.length, START_PLOTS + 2);
  while (s.garden.plots.length < roomForPlots(s)) assert.equal(buyPlot(s).ok, true);
  assert.equal(s.garden.plots.length, PLOTS_BY_HOME[0]);
  const coins = s.coins;
  assert.equal(buyPlot(s).why, 'room');
  assert.equal(s.coins, coins);

  const poor = game();
  poor.coins = 499;
  assert.equal(buyPlot(poor).why, 'coins');
  assert.equal(poor.garden.plots.length, START_PLOTS);
});

test('the market pays per crop and buys 30 a day', () => {
  const s = game();
  s.garden.barn.wheat = 25;
  s.garden.barn.mint = 10;
  const coins = s.coins;
  const r = sell(s, 'wheat', day(3), 5);
  assert.deepEqual(r, { ok: true, crop: 'wheat', count: 5, coins: 5 * wheat.sell, short: false });
  assert.equal(s.coins, coins + 5 * wheat.sell);
  assert.equal(marketLeft(s, day(3)), MARKET_PER_DAY - 5);

  const rest = sellAll(s, day(3, 18));
  assert.equal(rest.count, MARKET_PER_DAY - 5);
  assert.equal(rest.short, true);
  assert.equal(s.garden.barn.wheat, 0, 'the best price sells first');
  assert.equal(s.garden.barn.mint, 5);
  assert.equal(sell(s, 'mint', day(3, 20)).why, 'market');
  assert.equal(sell(s, 'tomato', day(3, 20)).why, 'nothing');

  assert.equal(marketLeft(s, day(4, 0)), MARKET_PER_DAY, 'a new day, a new market');
  assert.equal(sell(s, 'mint', day(4, 8)).count, 5);
  assert.equal(marketLeft(s, day(4, 8)), MARKET_PER_DAY - 5);
});

test('a save from before the garden gets one', () => {
  const old = newGame(5);
  delete old.garden;
  delete old.stats.harvests;
  old.coins = 42;
  const storage = { getItem: (k) => (k === SAVE_KEY ? JSON.stringify(old) : null), setItem() {} };
  const { state } = load(storage, 99);
  assert.equal(state.coins, 42);
  assert.equal(state.garden.plots.length, START_PLOTS);
  assert.equal(state.garden.barn.mint, 0);
  assert.equal(state.stats.harvests, 0);
});
