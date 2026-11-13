# Bug friends: one for each De9De9 service. Nemla meets them when they visit
# the garden, makes friends with gifts (hearts grow with each one), calls
# each friend once a day for a favour, and gets their help with problems at
# home. Plain functions on the save. Each action returns { ok = true, ... }
# or { ok = false, why, ...details for the message }.
#
# The save keeps:
#   friends: { bug id: { points, giftDay, callDay } }  (a bug is a friend once listed)
#   visitor: { bug, until, nextAt }   the bug in the garden now, if any
#   problem: { kind, since, nextAt }  the problem at home now, if any
class_name Friends

const HOUR := 3600000
const MIN := 60000


static func no(why: String, details := {}) -> Dictionary:
	var out := {"ok": false, "why": why}
	out.merge(details)
	return out


static func _random(rng: Callable) -> float:
	return rng.call() if rng.is_valid() else randf()


static func _gap(range_: Array, rng: Callable) -> int:
	return int(lerpf(range_[0], range_[1], _random(rng)) * HOUR)


static func bug_by_id(id: String) -> Dictionary:
	for bug in Economy.BUGS:
		if bug.id == id:
			return bug
	return {}


# The bug that fixes a problem.
static func fixer(kind: String) -> Dictionary:
	for bug in Economy.BUGS:
		if bug.get("fixes", "") == kind:
			return bug
	return {}


static func is_friend(state: Dictionary, id: String) -> bool:
	return state.friends.has(id)


static func count(state: Dictionary) -> int:
	return state.friends.size()


static func hearts_for(points: int) -> int:
	var hearts := 0
	for at in Economy.HEARTS_AT:
		if points >= at:
			hearts += 1
	return hearts


static func hearts(state: Dictionary, id: String) -> int:
	return hearts_for(state.friends[id].points) if is_friend(state, id) else 0


# Points still needed for the next heart, or 0 at 5 hearts.
static func to_next_heart(state: Dictionary, id: String) -> int:
	var h := hearts(state, id)
	return 0 if h >= Economy.HEARTS_AT.size() else Economy.HEARTS_AT[h] - int(state.friends.get(id, {}).get("points", 0))


# The next bug Nemla can meet: the first one not met yet whose level has come.
static func next_to_meet(state: Dictionary) -> String:
	for bug in Economy.BUGS:
		if not is_friend(state, bug.id) and state.nemla.level >= bug.meet:
			return bug.id
	return ""


static func gifted_today(state: Dictionary, id: String, now_ms: int) -> bool:
	return state.friends.get(id, {}).get("giftDay", "") == Clock.day_key(now_ms)


static func called_today(state: Dictionary, id: String, now_ms: int) -> bool:
	return state.friends.get(id, {}).get("callDay", "") == Clock.day_key(now_ms)


# Friends that can still be called today.
static func calls_left(state: Dictionary, now_ms: int) -> int:
	var n := 0
	for id in state.friends:
		if not called_today(state, id, now_ms):
			n += 1
	return n


# --- Garden visitors ---------------------------------------------------------
# The bug visiting the garden now, or {}.
static func visitor(state: Dictionary, now_ms: int) -> Dictionary:
	var v: Dictionary = state.visitor
	return bug_by_id(v.bug) if v.bug != "" and now_ms < v.until else {}


# Sends the visitor home when its time is up, and brings the next one when
# it's time (during the guide, only Snail, at the guide's friend step).
# Returns the id of a bug that just arrived, or "".
static func update_visitor(state: Dictionary, now_ms: int, rng := Callable()) -> String:
	var v: Dictionary = state.visitor
	if v.bug != "" and now_ms >= v.until:
		v.bug = ""
	if v.bug != "":
		return ""
	var step: String = Guide.step(state).get("id", "")
	var id := ""
	if step == "friend":
		id = next_to_meet(state) if next_to_meet(state) != "" else "snail"
	elif step != "" or now_ms < v.nextAt:
		return ""
	else:
		id = next_to_meet(state)
		if id == "" and count(state) > 0:
			var met: Array = state.friends.keys()
			id = met[mini(floori(_random(rng) * met.size()), met.size() - 1)]
	if id == "":
		return ""
	v.bug = id
	v.until = now_ms + Economy.VISIT_HOURS * HOUR
	v.nextAt = v.until + _gap(Economy.VISIT_GAP_HOURS, rng)
	return id


# --- Gifts -------------------------------------------------------------------
# A gift for a friend, or for the bug visiting the garden: a crop from the
# barn (the bug's favourite counts double) or a gift box bought with coins.
# The first gift makes a friend; a visitor goes home happy after one.
static func give_gift(state: Dictionary, id: String, gift: String, now_ms: int) -> Dictionary:
	var bug := bug_by_id(id)
	if bug.is_empty():
		return no("missing")
	var visiting: bool = visitor(state, now_ms).get("id", "") == id
	if not is_friend(state, id) and not visiting:
		return no("notMet", {"bug": id})
	if gifted_today(state, id, now_ms):
		return no("gifted", {"bug": id})
	var points := 1
	if gift == "box":
		if not Wallet.spend(state, Economy.GIFT_BOX):
			return no("coins")
	else:
		if state.garden.barn.get(gift, 0) <= 0:
			return no("noGift")
		state.garden.barn[gift] -= 1
		if gift == bug.loves:
			points = Economy.LOVED_POINTS
	var new_friend := not is_friend(state, id)
	var before := hearts(state, id)
	if new_friend:
		state.friends[id] = {"points": 0, "giftDay": "", "callDay": ""}
	var f: Dictionary = state.friends[id]
	f.points += points
	f.giftDay = Clock.day_key(now_ms)
	state.stats.gifts = state.stats.get("gifts", 0) + 1
	if visiting:
		state.visitor.bug = ""
	return {"ok": true, "bug": id, "points": points, "loved": points == Economy.LOVED_POINTS,
		"new_friend": new_friend, "hearts": hearts(state, id), "before": before}


# --- Calls -------------------------------------------------------------------
# A friend's favour, once a day, stronger with each heart.
static func call_friend(state: Dictionary, id: String, now_ms: int) -> Dictionary:
	if not is_friend(state, id):
		return no("notFriend", {"bug": id})
	if called_today(state, id, now_ms):
		return no("called", {"bug": id})
	var bug := bug_by_id(id)
	var h := hearts(state, id)
	var needs: Dictionary = state.nemla.needs
	var amount := 0
	var levels := []
	match bug.favor:
		"clean":
			amount = roundi(100.0 - needs.clean)
			needs.clean = 100.0
		"coins":
			amount = Economy.FAVOR.coins * h
			Wallet.earn(state, amount)
		"job":
			var job := "express" if Jobs.can_take(state, Jobs.job_by_id("express")) else "deliver"
			Jobs.post_job(state, job)
			amount = 1
		"honey":
			amount = Economy.FAVOR.honey + 5 * h
			needs.hunger = minf(100.0, needs.hunger + amount)
		"light":
			var minutes: int = Economy.FAVOR.light_minutes * h
			for plot in state.garden.plots:
				if plot.crop != "" and not Garden.is_ready(plot, now_ms):
					plot.readyAt -= minutes * MIN
					plot.plantedAt -= minutes * MIN
			amount = minutes
		"makeover":
			amount = Economy.FAVOR.makeover + 5 * h
			needs.fun = minf(100.0, needs.fun + amount)
			needs.clean = minf(100.0, needs.clean + 10)
		"concert":
			amount = roundi(100.0 - needs.fun)
			needs.fun = 100.0
		"training":
			amount = Economy.FAVOR.training + 5 * h
			needs.energy = minf(100.0, needs.energy + amount)
		"lesson":
			amount = Economy.FAVOR.lesson_xp * h
			levels = Care.gain_xp(state, amount)
	state.friends[id].callDay = Clock.day_key(now_ms)
	state.stats.calls = state.stats.get("calls", 0) + 1
	return {"ok": true, "bug": id, "favor": bug.favor, "amount": amount, "hearts": h, "levels": levels}


# --- Problems at home ---------------------------------------------------------
static func problem(state: Dictionary) -> String:
	return state.problem.kind


static func has_problem(state: Dictionary, kind: String) -> bool:
	return state.problem.kind == kind


# Starts a problem when it's time (never during the guide). Returns the
# problem that just started, or "".
static func update_problem(state: Dictionary, now_ms: int, rng := Callable()) -> String:
	var p: Dictionary = state.problem
	if p.kind != "" or not Guide.step(state).is_empty():
		return ""
	if p.nextAt == 0:
		p.nextAt = now_ms + Economy.FIRST_PROBLEM_HOURS * HOUR
		return ""
	if now_ms < p.nextAt:
		return ""
	var kinds: Array = Economy.PROBLEMS
	p.kind = kinds[mini(floori(_random(rng) * kinds.size()), kinds.size() - 1)]
	p.since = now_ms
	return p.kind


# Fixes the problem: `how` is "friend" (free, and the friend gets a
# friendship point) or "pay" (FIX_COST coins).
static func fix_problem(state: Dictionary, how: String, now_ms: int, rng := Callable()) -> Dictionary:
	var p: Dictionary = state.problem
	if p.kind == "":
		return no("noProblem")
	var bug := fixer(p.kind)
	if how == "friend":
		if not is_friend(state, bug.id):
			return no("notFriend", {"bug": bug.id})
		state.friends[bug.id].points += 1
	elif not Wallet.spend(state, Economy.FIX_COST):
		return no("coins")
	var kind: String = p.kind
	p.kind = ""
	p.nextAt = now_ms + _gap(Economy.PROBLEM_GAP_HOURS, rng)
	state.stats.fixes = state.stats.get("fixes", 0) + 1
	return {"ok": true, "kind": kind, "bug": bug.id, "how": how, "levels": Care.gain_xp(state, Economy.FIX_XP)}
