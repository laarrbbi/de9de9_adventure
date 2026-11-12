// The first 5 minutes: a short guide through the game's loop (care, work,
// garden, market, a goal). A step is done when the save shows it happened,
// so the guide also works for saves from before it existed. Each step pays
// a few coins. `guide.step` is the index of the current step, and equals
// STEPS.length once the guide is over. Plain functions, no DOM.
import { GUIDE_STEP_COINS } from './economy.js';
import { earn } from './wallet.js';
import { isReady } from './garden.js';

const anyPlanted = (s) => Object.values(s.garden.planted).some((n) => n > 0);

// `tab` is where the step happens; `target` is what to point at there.
export const STEPS = [
  { id: 'eat', tab: 'home', target: '.need[data-need="hunger"]', done: (s) => s.stats.meals > 0 },
  { id: 'job', tab: 'work', target: '.job-go', done: (s) => s.work.done > 0 },
  { id: 'plant', tab: 'garden', target: '.plot.empty', done: anyPlanted },
  { id: 'harvest', tab: 'garden', target: '.plot.ready', done: (s) => s.stats.harvests > 0 },
  { id: 'sell', tab: 'garden', target: '.sell', done: (s) => s.stats.sold > 0 },
  // The last step only shows the goal; the player closes it.
  { id: 'goal', tab: 'home', target: '.goal', done: () => false },
];

export const guideStep = (state) => STEPS[state.guide.step] ?? null;

// Moves past every step the save shows is done. Returns how many, and the
// coins paid for them (none when `pay` is false, as when a game loads).
export function advanceGuide(state, { pay = true } = {}) {
  let steps = 0;
  while (guideStep(state)?.done(state)) {
    state.guide.step += 1;
    steps += 1;
  }
  const coins = pay ? steps * GUIDE_STEP_COINS : 0;
  if (coins) earn(state, coins);
  return { steps, coins, finished: steps > 0 && !guideStep(state) };
}

// Closes the goal step, the guide's last.
export function closeGuide(state) {
  if (guideStep(state)?.id !== 'goal') return false;
  state.guide.step = STEPS.length;
  return true;
}

// The harvest step says something different while the mint is growing.
export function waiting(state, now) {
  return guideStep(state)?.id === 'harvest' && !state.garden.plots.some((plot) => isReady(plot, now));
}

// While the guide is on its first steps, the first job of the day is the
// snail's leaking pipe, so the guide's words match the board.
export function firstJob(state) {
  const entry = state.work.board[0];
  if (state.guide.step > 1 || state.work.done > 0 || !entry || entry.done) return;
  entry.job = 'fixPipe';
  entry.client = 'snail';
}
