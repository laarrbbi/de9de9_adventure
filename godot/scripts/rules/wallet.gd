# Coins: the game's money. Earned without limit, so Nemla can get very rich.
# `totalEarned` never goes down; wealth titles will be based on it.
class_name Wallet


static func earn(state: Dictionary, coins: int) -> void:
	state.coins += coins
	state.totalEarned += coins


# Takes the coins if there are enough. Returns whether it did.
static func spend(state: Dictionary, coins: int) -> bool:
	if state.coins < coins:
		return false
	state.coins -= coins
	return true
