import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buy, check, wear, nextHome } from '../www/js/shop.js';
import { owns, perks, homeOf } from '../www/js/perks.js';
import { refreshBoard, fillBoard, postJob, runWorkshop, canTake, jobById, jobsPerDay, payFor } from '../www/js/jobs.js';
import { plant, growTime, priceOf, marketLeft, sell, tractor, cropById, roomForPlots } from '../www/js/garden.js';
import * as care from '../www/js/care.js';
import { passTime } from '../www/js/needs.js';
import { newGame } from '../www/js/state.js';
import { JOBS_PER_DAY, MARKET_PER_DAY, MEAL, PLAY_FUN, PLOTS_BY_HOME } from '../www/js/economy.js';

const MIN = 60e3;
const day = (d, h = 12) => new Date(2026, 10, d, h, 0).getTime();
const first = () => 0;

function rich(coins = 1e6) {
  const s = newGame(day(3));
  s.coins = coins;
  s.nemla.needs = { hunger: 60, energy: 60, clean: 60, fun: 60 };
  return s;
}

test('a new game owns the little hole, the leaf cart and the watering can', () => {
  const s = newGame(day(3));
  assert.equal(homeOf(s).id, 'hole');
  assert.ok(owns(s, 'hole') && owns(s, 'leafCart') && owns(s, 'wateringCan'));
  assert.ok(!owns(s, 'anthill') && !owns(s, 'scooter') && !owns(s, 'redCap'));
  assert.equal(nextHome(s).id, 'anthill');
});

test('buying takes the coins once and keeps the item', () => {
  const s = rich(3500);
  const r = buy(s, 'scooter');
  assert.deepEqual(r, { ok: true, kind: 'car', id: 'scooter', price: 3000 });
  assert.equal(s.coins, 500);
  assert.ok(owns(s, 'scooter'));
  assert.equal(buy(s, 'scooter').why, 'owned');
  assert.equal(s.coins, 500);
});

test('the shop says why it cannot sell something', () => {
  const s = rich(1000);
  const poor = check(s, 'anthill');
  assert.equal(poor.why, 'coins');
  assert.equal(poor.short, 1000);
  assert.equal(check(s, 'house').why, 'order', 'homes are moved into one after the other');
  assert.equal(check(s, 'house').home, 'anthill');
  assert.equal(check(s, 'kitchen').why, 'home');
  assert.equal(check(s, 'kitchen').home, 'anthill');
  assert.equal(check(s, 'leafCart').why, 'owned');
  assert.equal(check(s, 'spaceship').why, 'missing');
});

test('moving home adds plots and a job a day', () => {
  const s = rich();
  assert.equal(buy(s, 'anthill').ok, true);
  assert.equal(s.home.level, 2);
  assert.equal(homeOf(s).id, 'anthill');
  assert.equal(roomForPlots(s), PLOTS_BY_HOME[1]);
  assert.equal(jobsPerDay(s), JOBS_PER_DAY + 1);
  for (const id of ['house', 'villa', 'palace']) assert.equal(buy(s, id).ok, true);
  assert.equal(homeOf(s).id, 'palace');
  assert.equal(nextHome(s), null);
  assert.equal(check(s, 'palace').why, 'owned');
});

test('rooms make caring for Nemla better', () => {
  const s = rich();
  buy(s, 'anthill');
  buy(s, 'kitchen');
  buy(s, 'bathroom');
  s.nemla.needs = { hunger: 20, energy: 60, clean: 20, fun: 20 };
  assert.equal(care.eat(s).gained.hunger, 40);
  assert.equal(s.nemla.needs.hunger, 60);
  assert.deepEqual(care.wash(s).gained, { clean: 80, fun: 15 });
  assert.equal(s.nemla.needs.fun, 35);

  buy(s, 'house');
  buy(s, 'musicRoom');
  assert.equal(care.play(s).gained.fun, 35);
  assert.equal(perks(newGame(0)).meal, MEAL.hunger);
  assert.equal(perks(newGame(0)).playFun, PLAY_FUN);
});

test('the bedroom makes sleep twice as fast', () => {
  const s = rich();
  s.nemla.needs.energy = 0;
  s.nemla.sleeping = true;
  passTime(s.nemla, 10 * MIN, perks(s));
  assert.equal(Math.round(s.nemla.needs.energy), 50);

  const t = rich();
  for (const id of ['anthill', 'house', 'bedroom']) buy(t, id);
  t.nemla.needs.energy = 0;
  t.nemla.sleeping = true;
  passTime(t.nemla, 10 * MIN, perks(t));
  assert.equal(t.nemla.needs.energy, 100);
  assert.equal(t.nemla.sleeping, false);
});

test('clothes work only while Nemla wears them', () => {
  const s = rich();
  buy(s, 'overalls');
  assert.equal(s.nemla.outfit, 'overalls', 'a new outfit goes on right away');
  const fix = jobById('fixPipe');
  refreshBoard(s, day(3), first);
  assert.equal(payFor(s, fix, fix.great, day(3)), 235); // 150 × 1.5 × 1.05 = 236.25
  wear(s, null);
  assert.equal(payFor(s, fix, fix.great, day(3)), 225);
  assert.equal(wear(s, 'redCap').why, 'missing', 'not owned yet');

  buy(s, 'redCap');
  const before = s.nemla.needs.fun;
  passTime(s.nemla, 3600e3, perks(s));
  assert.equal(before - s.nemla.needs.fun, 5 * 0.75);

  buy(s, 'strawHat');
  assert.equal(priceOf(s, cropById('wheat')), 44);
});

test('the scooter unlocks express deliveries, the toolbox building jobs', () => {
  const s = rich();
  const express = jobById('express');
  const build = jobById('buildRoom');
  assert.equal(canTake(s, express), false);
  assert.equal(canTake(s, build), false);
  buy(s, 'scooter');
  buy(s, 'toolbox');
  assert.equal(canTake(s, express), true);
  assert.equal(canTake(s, build), true);

  refreshBoard(s, day(3), first);
  postJob(s, 'express', first);
  assert.equal(s.work.board.at(-1).job, 'express');
});

test('a board has at most one building job', () => {
  const s = rich();
  buy(s, 'toolbox');
  const always = (list) => () => (list.findIndex((j) => j === 'buildRoom') + 0.5) / list.length;
  refreshBoard(s, day(3), always(['fixPipe', 'deliver', 'buildRoom']));
  assert.equal(s.work.board.filter((e) => e.job === 'buildRoom').length, 1);
});

test('the little car adds 2 jobs today and every day', () => {
  const s = rich();
  refreshBoard(s, day(3), first);
  buy(s, 'littleCar');
  assert.equal(fillBoard(s, first), 2);
  assert.equal(s.work.board.length, JOBS_PER_DAY + 2);
  refreshBoard(s, day(4), first);
  assert.equal(s.work.board.length, JOBS_PER_DAY + 2);
});

test('the sports car adds 10% to job pay', () => {
  const s = rich();
  const fix = jobById('fixPipe');
  buy(s, 'sportsCar');
  assert.equal(payFor(s, fix, fix.great, day(3)), 250); // 150 × 1.5 × 1.1 = 247.5
});

test('the workshop does 2 jobs a day for Nemla', () => {
  const s = rich();
  refreshBoard(s, day(3), first);
  assert.equal(runWorkshop(s, day(3), first), null, 'no workshop yet');
  buy(s, 'workshop');
  const coins = s.coins;
  const r = runWorkshop(s, day(3), first);
  assert.equal(r.count, 2);
  assert.equal(s.coins, coins + r.coins);
  assert.equal(s.work.board.filter((e) => e.by === 'workshop' && e.done).length, 2);
  assert.equal(s.work.board.filter((e) => !e.done).length, JOBS_PER_DAY, "Nemla's own jobs are untouched");
  assert.equal(runWorkshop(s, day(3, 20), first), null, 'once a day');
  refreshBoard(s, day(4), first);
  assert.equal(runWorkshop(s, day(4), first).count, 2);
});

test('the sprinkler grows crops 25% faster, the pickup truck triples the market', () => {
  const s = rich();
  buy(s, 'sprinkler');
  assert.equal(growTime(s, cropById('wheat')), 45 * MIN);
  buy(s, 'pickup');
  assert.equal(marketLeft(s, day(3)), MARKET_PER_DAY * 3);
  s.garden.barn.mint = 50;
  assert.equal(sell(s, 'mint', day(3)).count, 50);
});

test('the tractor harvests, replants and fills empty plots in one go', () => {
  const s = rich();
  plant(s, 0, 'wheat', day(3));
  assert.equal(tractor(s, day(3)).why, 'missing');
  buy(s, 'tractor');
  s.garden.seed = 'mint';
  const coins = s.coins;
  const r = tractor(s, day(3) + 60 * MIN);
  assert.equal(r.ok, true);
  assert.equal(r.harvested, 1);
  assert.equal(r.planted, 2);
  assert.equal(s.garden.barn.wheat, 1);
  assert.equal(s.garden.plots[0].crop, 'wheat', 'replanted with the same crop');
  assert.equal(s.garden.plots[1].crop, 'mint', 'the empty plot gets the picked seed');
  assert.equal(s.coins, coins - 15 - 10);
  assert.equal(tractor(s, day(3) + 61 * MIN).why, 'nothingToDo');
});
