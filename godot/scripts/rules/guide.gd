# The first 5 minutes: a short guide through the game's loop (care, work,
# garden, market, a goal). A step is done when the save shows it happened,
# so the guide also works for saves from before it existed. Each step pays
# a few coins. `guide.step` is the index of the current step, and equals
# STEPS.size() once the guide is over.
class_name Guide

# `tab` is where the step happens; `target` names what to point at there.
const STEPS := [
	{"id": "eat", "tab": "home", "target": "eat"},
	{"id": "job", "tab": "work", "target": "first_job"},
	{"id": "plant", "tab": "garden", "target": "empty_plot"},
	{"id": "harvest", "tab": "garden", "target": "ready_plot"},
	{"id": "sell", "tab": "garden", "target": "sell"},
	{"id": "friend", "tab": "garden", "target": "visitor"},
	# The last step only shows the goal; the player closes it.
	{"id": "goal", "tab": "home", "target": "goal"},
]


static func step_done(state: Dictionary, id: String) -> bool:
	match id:
		"eat":
			return state.stats.meals > 0
		"job":
			return state.work.done > 0
		"plant":
			for crop in state.garden.planted:
				if state.garden.planted[crop] > 0:
					return true
			return false
		"harvest":
			return state.stats.harvests > 0
		"sell":
			return state.stats.sold > 0
		"friend":
			return state.friends.size() > 0
	return false


static func step(state: Dictionary) -> Dictionary:
	var i := int(state.guide.step)
	return STEPS[i] if i < STEPS.size() else {}


# Moves past every step the save shows is done. Returns how many, and the
# coins paid for them (none when `pay` is false, as when a game loads).
static func advance(state: Dictionary, pay := true) -> Dictionary:
	var steps := 0
	while not step(state).is_empty() and step_done(state, step(state).id):
		state.guide.step += 1
		steps += 1
	var coins := steps * Economy.GUIDE_STEP_COINS if pay else 0
	if coins:
		Wallet.earn(state, coins)
	return {"steps": steps, "coins": coins, "finished": steps > 0 and step(state).is_empty()}


# Closes the goal step, the guide's last.
static func close(state: Dictionary) -> bool:
	if step(state).get("id", "") != "goal":
		return false
	state.guide.step = STEPS.size()
	return true


# The harvest step says something different while the mint is growing.
static func waiting(state: Dictionary, now_ms: int) -> bool:
	if step(state).get("id", "") != "harvest":
		return false
	for plot in state.garden.plots:
		if Garden.is_ready(plot, now_ms):
			return false
	return true


# While the guide is on its first steps, the first job of the day is the
# snail's leaking pipe, so the guide's words match the board.
static func first_job(state: Dictionary) -> void:
	var board: Array = state.work.board
	if state.guide.step > 1 or state.work.done > 0 or board.is_empty() or board[0].done:
		return
	board[0].job = "fixPipe"
	board[0].client = "snail"
