// Work: a new board of jobs every day, each one a mini-game that pays by
// score. Plain functions on the save, no DOM.
import {
  JOBS, JOBS_PER_DAY, CLIENTS, PAY_MIN, PAY_MAX, STREAK_BONUS, STREAK_BONUS_MAX,
  NEEDS_TIRED, TIRED_PAY, JOB_XP, JOB_EFFECT,
} from './economy.js';
import { average } from './needs.js';
import { earn } from './wallet.js';
import { gainXp } from './care.js';
import { owns, perks } from './perks.js';
import { dayKey, yesterdayKey } from './clock.js';

export const jobById = (id) => JOBS.find((job) => job.id === id);

// A job needs Nemla's level, and the Shop item it names, if any.
export const canTake = (state, job) => state.nemla.level >= job.level && (!job.needs || owns(state, job.needs));

export const jobsPerDay = (state) => JOBS_PER_DAY + perks(state).jobs;

const pick = (list, random) => list[Math.floor(random() * list.length)];

const posted = (id, client) => ({ job: id, client, done: false, paid: 0 });

// The jobs Nemla takes, not the ones the workshop did.
const ownJobs = (board) => board.filter((entry) => !entry.by);

// Adds random jobs until the board has a full day's worth. Returns how many.
export function fillBoard(state, random = Math.random) {
  const { board } = state.work;
  let added = 0;
  while (ownJobs(board).length < jobsPerDay(state)) {
    const open = JOBS.filter((job) => canTake(state, job)
      && (!job.perDay || board.filter((e) => e.job === job.id).length < job.perDay));
    board.push(posted(pick(open, random).id, pick(CLIENTS, random)));
    added += 1;
  }
  return added;
}

// A new day brings a new board. Returns whether it changed.
export function refreshBoard(state, now, random = Math.random) {
  const work = state.work;
  const today = dayKey(now);
  if (work.day === today) return false;
  work.day = today;
  work.earnedToday = 0;
  work.board = [];
  fillBoard(state, random);
  return true;
}

// Puts one extra job on today's board, for a Shop item that just unlocked it.
export function postJob(state, id, random = Math.random) {
  state.work.board.push(posted(id, pick(CLIENTS, random)));
}

// The workshop's helpers do their jobs once a day, paid the base price, with
// no XP and no tiredness. Returns { count, coins } or null.
export function runWorkshop(state, now, random = Math.random) {
  const { helpers } = perks(state);
  const work = state.work;
  const today = dayKey(now);
  if (!helpers || work.helpedDay === today || work.day !== today) return null;
  work.helpedDay = today;
  const open = JOBS.filter((job) => canTake(state, job));
  let coins = 0;
  for (let i = 0; i < helpers; i++) {
    const job = pick(open, random);
    work.board.push({ ...posted(job.id, pick(CLIENTS, random)), done: true, paid: job.pay, by: 'workshop' });
    coins += job.pay;
  }
  earn(state, coins);
  work.earnedToday += coins;
  return { count: helpers, coins };
}

// Days in a row with at least one job, counting today or yesterday.
export function currentStreak(state, now) {
  const { lastWorked, streak } = state.work;
  return lastWorked === dayKey(now) || lastWorked === yesterdayKey(now) ? streak : 0;
}

export function streakBonus(state, now) {
  return Math.min(STREAK_BONUS_MAX, STREAK_BONUS * currentStreak(state, now));
}

export const isTired = (state) => average(state.nemla.needs) < NEEDS_TIRED;

// Coins for a run, rounded to 5: the score sets the share of the base pay,
// then the streak bonus, pay perks from the Shop and tiredness apply.
export function payFor(state, job, score, now) {
  const skill = PAY_MIN + Math.min(1, Math.max(0, score / job.great)) * (PAY_MAX - PAY_MIN);
  const tired = isTired(state) ? TIRED_PAY : 1;
  const coins = job.pay * skill * (1 + streakBonus(state, now) + perks(state).pay) * tired;
  return Math.max(5, Math.round(coins / 5) * 5);
}

export const payRange = (job) => [job.pay * PAY_MIN, job.pay * PAY_MAX];

// How the run went, for the result screen.
export function rating(job, score) {
  const share = score / job.great;
  return share >= 1 ? 'perfect' : share >= 2 / 3 ? 'great' : share >= 1 / 3 ? 'good' : 'ok';
}

// What starting a job hands to the mini-game, so the right job is paid even
// if midnight passes during the run.
export const ticket = (state, slot) => ({ day: state.work.day, slot, job: state.work.board[slot].job });

// Pays for a finished run. Returns null if that job was already paid.
export function finishJob(state, { day, slot, job: id }, score, now) {
  const work = state.work;
  const entry = work.day === day ? work.board[slot] : null;
  if (entry?.done) return null;
  const job = jobById(id);
  const tired = isTired(state);
  const bonus = streakBonus(state, now);
  const coins = payFor(state, job, score, now);

  earn(state, coins);
  work.earnedToday += coins;
  work.done += 1;
  if (entry) {
    entry.done = true;
    entry.paid = coins;
  }
  const today = dayKey(now);
  if (work.lastWorked !== today) {
    work.streak = work.lastWorked === yesterdayKey(now) ? work.streak + 1 : 1;
    work.lastWorked = today;
  }
  const needs = state.nemla.needs;
  for (const [need, change] of Object.entries(JOB_EFFECT)) needs[need] = Math.max(0, Math.min(100, needs[need] + change));

  return { coins, rating: rating(job, score), tired, bonus, levels: gainXp(state, JOB_XP) };
}
