import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshBoard, payFor, finishJob, ticket, currentStreak, jobById, rating } from '../www/js/jobs.js';
import { newGame } from '../www/js/state.js';
import { JOBS_PER_DAY, JOB_XP, JOB_EFFECT, STREAK_BONUS, STREAK_BONUS_MAX } from '../www/js/economy.js';

const day = (d, h = 12) => new Date(2026, 10, d, h, 0).getTime();
const first = () => 0; // always picks the first job and client
const fix = jobById('fixPipe');

function game(now = day(3)) {
  const s = newGame(now);
  s.nemla.needs = { hunger: 80, energy: 80, clean: 80, fun: 50 };
  refreshBoard(s, now, first);
  return s;
}

test('a new day brings a board of jobs Nemla can take', () => {
  const s = newGame(day(3));
  assert.equal(refreshBoard(s, day(3)), true);
  assert.equal(s.work.board.length, JOBS_PER_DAY);
  for (const entry of s.work.board) {
    assert.notEqual(entry.job, 'wedding', 'level 2 job on a level 1 board');
    assert.notEqual(entry.job, 'buildRoom', 'job that needs a toolbox');
    assert.equal(entry.done, false);
  }
  assert.equal(refreshBoard(s, day(3, 23)), false, 'same day, same board');
  assert.equal(refreshBoard(s, day(4, 0)), true, 'midnight, new board');
});

test('pay goes from half to one and a half of the base, by score', () => {
  const s = game();
  assert.equal(payFor(s, fix, 0, day(3)), 75);
  assert.equal(payFor(s, fix, fix.great / 2, day(3)), 150);
  assert.equal(payFor(s, fix, fix.great, day(3)), 225);
  assert.equal(payFor(s, fix, fix.great * 10, day(3)), 225);
});

test('a tired Nemla earns 20% less', () => {
  const s = game();
  s.nemla.needs = { hunger: 10, energy: 10, clean: 10, fun: 10 };
  assert.equal(payFor(s, fix, fix.great, day(3)), 180);
});

test('finishing a job pays once, marks it done and tires Nemla', () => {
  const s = game();
  const coins = s.coins;
  const pass = ticket(s, 0);
  const r = finishJob(s, pass, fix.great, day(3));
  assert.equal(r.coins, 225);
  assert.equal(r.rating, 'perfect');
  assert.equal(s.coins, coins + 225);
  assert.equal(s.work.earnedToday, 225);
  assert.equal(s.work.board[0].done, true);
  assert.equal(s.work.board[0].paid, 225);
  assert.equal(s.nemla.needs.energy, 80 + JOB_EFFECT.energy);
  assert.equal(s.nemla.needs.fun, 50 + JOB_EFFECT.fun);
  assert.equal(s.nemla.xp, JOB_XP);
  assert.equal(finishJob(s, pass, fix.great, day(3)), null, 'paid twice');
  assert.equal(s.coins, coins + 225);
});

test('a run that ends after midnight is still paid', () => {
  const s = game(day(3, 23));
  const pass = ticket(s, 0);
  refreshBoard(s, day(4, 0), first);
  const r = finishJob(s, pass, 0, day(4, 0));
  assert.equal(r.coins, 75);
  assert.equal(s.work.board.every((e) => !e.done), true, "the new day's board is untouched");
});

test('the work streak grows day after day, adds pay, and breaks after a missed day', () => {
  const s = game(day(3));
  finishJob(s, ticket(s, 0), 0, day(3));
  finishJob(s, ticket(s, 1), 0, day(3));
  assert.equal(currentStreak(s, day(3)), 1);

  refreshBoard(s, day(4), first);
  assert.equal(currentStreak(s, day(4)), 1, 'yesterday still counts before working today');
  const bonus = Math.min(STREAK_BONUS_MAX, STREAK_BONUS);
  assert.equal(finishJob(s, ticket(s, 0), fix.great, day(4)).bonus, bonus);
  assert.equal(currentStreak(s, day(4)), 2);

  assert.equal(currentStreak(s, day(6)), 0, 'a missed day breaks it');
  refreshBoard(s, day(6), first);
  finishJob(s, ticket(s, 0), 0, day(6));
  assert.equal(currentStreak(s, day(6)), 1);
});

test('ratings', () => {
  assert.equal(rating(fix, 0), 'ok');
  assert.equal(rating(fix, 12), 'good');
  assert.equal(rating(fix, 25), 'great');
  assert.equal(rating(fix, 30), 'perfect');
});
