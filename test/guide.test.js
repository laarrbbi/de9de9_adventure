import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, guideStep, advanceGuide, closeGuide, firstJob, waiting } from '../www/js/guide.js';
import { refreshBoard, finishJob, ticket } from '../www/js/jobs.js';
import { plant, harvest, sell } from '../www/js/garden.js';
import * as care from '../www/js/care.js';
import { newGame } from '../www/js/state.js';
import { GUIDE_STEP_COINS } from '../www/js/economy.js';

const MIN = 60e3;
const day = (d, h = 12) => new Date(2026, 10, d, h, 0).getTime();
const last = () => 0.99; // picks the last job and client, never the snail's pipe

test('the guide walks through care, work, garden and market, paying each step', () => {
  const now = day(3);
  const s = newGame(now);
  refreshBoard(s, now, last);
  firstJob(s);
  assert.deepEqual([s.work.board[0].job, s.work.board[0].client], ['fixPipe', 'snail'], "the first job is the snail's leak");
  assert.equal(guideStep(s).id, 'eat');

  care.eat(s);
  const coins = s.coins;
  assert.deepEqual(advanceGuide(s), { steps: 1, coins: GUIDE_STEP_COINS, finished: false });
  assert.equal(s.coins, coins + GUIDE_STEP_COINS);
  assert.equal(guideStep(s).id, 'job');
  assert.equal(advanceGuide(s).steps, 0, 'nothing new done');

  finishJob(s, ticket(s, 0), 10, now);
  plant(s, 0, 'mint', now);
  assert.equal(advanceGuide(s).steps, 2, 'two steps done at once');
  assert.equal(guideStep(s).id, 'harvest');
  assert.equal(waiting(s, now), true, 'the mint is still growing');
  assert.equal(waiting(s, now + 2 * MIN), false);

  harvest(s, 0, now + 2 * MIN);
  sell(s, 'mint', now + 2 * MIN);
  advanceGuide(s);
  assert.equal(guideStep(s).id, 'goal');
  assert.equal(advanceGuide(s).steps, 0, 'the goal step waits for the player');
  assert.equal(closeGuide(s), true);
  assert.equal(guideStep(s), null);
  assert.equal(s.guide.step, STEPS.length);
  assert.equal(closeGuide(s), false);
});

test('a save from before the guide skips what the player already did, without paying', () => {
  const s = newGame(day(3));
  delete s.guide;
  s.stats.meals = 4;
  s.work.done = 3;
  s.guide = { step: 0 };
  const coins = s.coins;
  assert.equal(advanceGuide(s, { pay: false }).steps, 2);
  assert.equal(s.coins, coins);
  assert.equal(guideStep(s).id, 'plant');
});

test("the first job is only set while the guide still needs it", () => {
  const s = newGame(day(3));
  refreshBoard(s, day(3), last);
  s.guide.step = 2;
  firstJob(s);
  assert.notEqual(s.work.board[0].client, 'snail');
});
