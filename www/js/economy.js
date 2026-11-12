// Every number that sets the pace of the game. Tune them here: nothing else
// hard-codes a rate, a price or a reward.

// Nemla's needs run from 0 to 100 and drop this much per hour of real time.
export const NEED_DROP_PER_HOUR = { hunger: 6, energy: 4, clean: 3, fun: 5 };

// Sleeping refills energy this much per hour: empty to full in 20 minutes.
export const SLEEP_GAIN_PER_HOUR = 300;

// A need under this shows in Nemla's thought bubble.
export const NEED_LOW = 40;

// A need at or above this is "full": the action that fills it says no.
export const NEED_FULL = 95;

// Care actions. A meal costs coins; washing, playing and sleeping are free.
export const MEAL = { cost: 5, hunger: 25 };
export const PLAY_FUN = 20;
export const CARE_XP = 2;

// A new game: some coins, and a Nemla that is already a bit hungry so the
// first thing to do is obvious.
export const START = { coins: 200, needs: { hunger: 45, energy: 70, clean: 80, fun: 60 } };

// XP needed to go from `level` to the next one, and the coins paid on arrival.
export const xpToNext = (level) => 40 + level * 20;
export const levelUpCoins = (level) => 50 * level;

// Jobs. Each is a mini-game from De9De9 Play. A run pays from PAY_MIN to
// PAY_MAX times `pay`, depending on the score against `great`. A job with
// `needs` waits for that item from the Shop.
export const JOBS = [
  { id: 'fixPipe', service: 'travaux', game: 'fix', pay: 150, great: 30, level: 1 },
  { id: 'deliver', service: 'auto', game: 'run', pay: 120, great: 30, level: 1 },
  { id: 'wedding', service: 'evenement', game: 'tiles', pay: 300, great: 80, level: 2 },
  { id: 'buildRoom', service: 'travaux', game: 'stack', pay: 1200, great: 20, level: 1, needs: 'toolbox' },
];
export const PAY_MIN = 0.5;
export const PAY_MAX = 1.5;
export const JOBS_PER_DAY = 5;

// Each day in a row with at least one job adds to the pay, up to a limit.
export const STREAK_BONUS = 0.05;
export const STREAK_BONUS_MAX = 0.25;

// While the needs average under NEEDS_TIRED, jobs pay this much of the usual.
export const NEEDS_TIRED = 30;
export const TIRED_PAY = 0.8;

// What a job does to Nemla: tiring, but fun.
export const JOB_XP = 10;
export const JOB_EFFECT = { energy: -10, fun: 10 };

// Who posts the jobs: the bug friends Nemla will meet.
export const CLIENTS = ['snail', 'ladybug', 'bee', 'beetle', 'butterfly', 'cricket'];

// Crops. `grow` is in minutes of real time; `first`, if set, is how long the
// very first one takes, so a new player sees a harvest right away. `xp` is
// paid on harvest, `sell` by the market for each one.
export const CROPS = [
  { id: 'mint', seed: 10, grow: 30, first: 2, sell: 25, xp: 2, level: 1 },
  { id: 'wheat', seed: 15, grow: 60, sell: 40, xp: 3, level: 1 },
  { id: 'tomato', seed: 25, grow: 180, sell: 80, xp: 5, level: 3 },
];

// Plots. A new game has START_PLOTS; each home has room for a few more
// (little hole, anthill, big house, villa, palace). The first plot bought
// costs 500 and each one after it 100 more.
export const START_PLOTS = 2;
export const PLOTS_BY_HOME = [6, 9, 12, 16, 20];
export const plotPrice = (owned) => 500 + 100 * Math.max(0, owned - START_PLOTS);

// The market buys this many crops a day, whatever the crop.
export const MARKET_PER_DAY = 30;

// The longest absence the game catches up on, so a phone whose clock jumps
// ahead can't fast-forward months.
export const MAX_CATCH_UP_HOURS = 24 * 7;

// De9De9 points: the same rule as De9De9 Play, 1000 points for a free service.
export const SERVICE_COST = 1000;
