// Coins: the game's money. Earned without limit, so Nemla can get very rich.
// `totalEarned` never goes down; wealth titles will be based on it.

export function earn(state, coins) {
  state.coins += coins;
  state.totalEarned += coins;
}

// Takes the coins if there are enough. Returns whether it did.
export function spend(state, coins) {
  if (state.coins < coins) return false;
  state.coins -= coins;
  return true;
}
