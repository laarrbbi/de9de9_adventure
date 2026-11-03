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

// The longest absence the game catches up on, so a phone whose clock jumps
// ahead can't fast-forward months.
export const MAX_CATCH_UP_HOURS = 24 * 7;

// De9De9 points: the same rule as De9De9 Play, 1000 points for a free service.
export const SERVICE_COST = 1000;
