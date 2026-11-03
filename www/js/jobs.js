// Work: a new board of jobs every day, each one a mini-game that pays by
// score. Plain functions on the save, no DOM.
import {
  JOBS, JOBS_PER_DAY, CLIENTS, PAY_MIN, PAY_MAX, STREAK_BONUS, STREAK_BONUS_MAX,
  NEEDS_TIRED, TIRED_PAY, JOB_XP, JOB_EFFECT,
} from './economy.js';
import { average } from './needs.js';
import { earn } from './wallet.js';
import { gainXp } from './care.js';
import { dayKey, yesterdayKey } from './clock.js';

export const jobById = (id) => JOBS.find((job) => job.id === id);

// Items from the Shop arrive in a later update, so a job that needs one
// stays locked for now.
export const canTake = (state, job) => !job.needs && state.nemla.level >= job.level;

const pick = (list, random) => list[Math.floor(random() * list.length)];

// A new day brings a new board. Returns whether it changed.
export function refreshBoard(state, now, random = Math.random) {
  const work = state.work;
  const today = dayKey(now);
  if (work.day === today) return false;
  const open = JOBS.filter((job) => canTake(state, job));
  work.day = today;
  work.earnedToday = 0;
  work.board = Array.from({ length: JOBS_PER_DAY }, () => ({
    job: pick(open, random).id,
    client: pick(CLIENTS, random),
    done: false,
    paid: 0,
  }));
  return true;
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
// then the streak bonus and tiredness apply.
export function payFor(state, job, score, now) {
  const skill = PAY_MIN + Math.min(1, Math.max(0, score / job.great)) * (PAY_MAX - PAY_MIN);
  const tired = isTired(state) ? TIRED_PAY : 1;
  const coins = job.pay * skill * (1 + streakBonus(state, now)) * tired;
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
