# What the player can do for Nemla at home. Each action changes the save and
# returns what happened, for the screen to show:
#   { ok = true, gained = { need: amount }, levels = [{ level, coins }] }
#   { ok = false, why = "sleeping" | "full" | "coins" | "clean" | "fun" | "rested" | "awake" }
class_name Care


static func no(why: String) -> Dictionary:
	return {"ok": false, "why": why}


static func eat(state: Dictionary) -> Dictionary:
	var needs: Dictionary = state.nemla.needs
	if state.nemla.sleeping:
		return no("sleeping")
	if needs.hunger >= Economy.NEED_FULL:
		return no("full")
	if not Wallet.spend(state, Economy.MEAL.cost):
		return no("coins")
	var meal: int = Perks.perks(state).meal
	needs.hunger = minf(100.0, needs.hunger + meal)
	state.stats.meals += 1
	return _done(state, {"hunger": meal, "coins": -Economy.MEAL.cost})


static func wash(state: Dictionary) -> Dictionary:
	var needs: Dictionary = state.nemla.needs
	if state.nemla.sleeping:
		return no("sleeping")
	if needs.clean >= Economy.NEED_FULL:
		return no("clean")
	var gained := roundi(100.0 - needs.clean)
	var wash_fun: int = Perks.perks(state).washFun
	needs.clean = 100.0
	needs.fun = minf(100.0, needs.fun + wash_fun)
	state.stats.baths += 1
	return _done(state, {"clean": gained, "fun": wash_fun} if wash_fun else {"clean": gained})


static func play(state: Dictionary) -> Dictionary:
	var needs: Dictionary = state.nemla.needs
	if state.nemla.sleeping:
		return no("sleeping")
	if needs.fun >= Economy.NEED_FULL:
		return no("fun")
	var play_fun: int = Perks.perks(state).playFun
	needs.fun = minf(100.0, needs.fun + play_fun)
	state.stats.plays += 1
	return _done(state, {"fun": play_fun})


static func sleep(state: Dictionary) -> Dictionary:
	if state.nemla.sleeping:
		return no("sleeping")
	if state.nemla.needs.energy >= Economy.NEED_FULL:
		return no("rested")
	state.nemla.sleeping = true
	state.stats.naps += 1
	return _done(state, {})


static func wake(state: Dictionary) -> Dictionary:
	if not state.nemla.sleeping:
		return no("awake")
	state.nemla.sleeping = false
	return {"ok": true, "gained": {}, "levels": []}


# Adds XP and pays the coins for every level reached.
static func gain_xp(state: Dictionary, xp: int) -> Array:
	var out := []
	for level in Level.add_xp(state.nemla, xp):
		var coins := Economy.level_up_coins(level)
		Wallet.earn(state, coins)
		out.append({"level": level, "coins": coins})
	return out


static func _done(state: Dictionary, gained: Dictionary) -> Dictionary:
	return {"ok": true, "gained": gained, "levels": gain_xp(state, Economy.CARE_XP)}
