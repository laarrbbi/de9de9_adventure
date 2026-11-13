# Work: a new board of jobs every day, each one a mini-game that pays by
# score. `rng` is a Callable returning a number from 0 to 1 (tests pass a
# fixed one); without it, jobs are picked at random.
class_name Jobs


static func _random(rng: Callable) -> float:
	return rng.call() if rng.is_valid() else randf()


static func _pick(list: Array, rng: Callable):
	return list[mini(floori(_random(rng) * list.size()), list.size() - 1)]


static func job_by_id(id: String) -> Dictionary:
	for job in Economy.JOBS:
		if job.id == id:
			return job
	return {}


# What stops a job from starting today, or "": a flat tire stops deliveries.
static func blocked(state: Dictionary, job: Dictionary) -> String:
	if job.service == "auto" and Friends.has_problem(state, "flatTire"):
		return "flatTire"
	return ""


# A job needs Nemla's level, and the Shop item it names, if any.
static func can_take(state: Dictionary, job: Dictionary) -> bool:
	return state.nemla.level >= job.level and (not job.has("needs") or Perks.owns(state, job.needs))


static func jobs_per_day(state: Dictionary) -> int:
	return Economy.JOBS_PER_DAY + Perks.perks(state).jobs


static func _posted(id: String, client: String) -> Dictionary:
	return {"job": id, "client": client, "done": false, "paid": 0}


# The jobs Nemla takes, not the ones the workshop did.
static func _own_jobs(board: Array) -> int:
	return board.filter(func(e): return not e.has("by")).size()


# Adds random jobs until the board has a full day's worth. Returns how many.
static func fill_board(state: Dictionary, rng := Callable()) -> int:
	var board: Array = state.work.board
	var added := 0
	while _own_jobs(board) < jobs_per_day(state):
		var open := Economy.JOBS.filter(func(job):
			return can_take(state, job) and (not job.has("perDay") or board.filter(func(e): return e.job == job.id).size() < job.perDay))
		var job: Dictionary = _pick(open, rng)
		board.append(_posted(job.id, _pick(Economy.CLIENTS, rng)))
		added += 1
	return added


# A new day brings a new board. Returns whether it changed.
static func refresh_board(state: Dictionary, now_ms: int, rng := Callable()) -> bool:
	var work: Dictionary = state.work
	var today := Clock.day_key(now_ms)
	if work.day == today:
		return false
	work.day = today
	work.earnedToday = 0
	work.board = []
	fill_board(state, rng)
	return true


# Puts one extra job on today's board, for a Shop item that just unlocked it.
static func post_job(state: Dictionary, id: String, rng := Callable()) -> void:
	state.work.board.append(_posted(id, _pick(Economy.CLIENTS, rng)))


# The workshop's helpers do their jobs once a day, paid the base price, with
# no XP and no tiredness. Returns { count, coins } or {}.
static func run_workshop(state: Dictionary, now_ms: int, rng := Callable()) -> Dictionary:
	var helpers: int = Perks.perks(state).helpers
	var work: Dictionary = state.work
	var today := Clock.day_key(now_ms)
	if helpers == 0 or work.helpedDay == today or work.day != today:
		return {}
	work.helpedDay = today
	var open := Economy.JOBS.filter(func(job): return can_take(state, job))
	var coins := 0
	for i in helpers:
		var job: Dictionary = _pick(open, rng)
		var entry := _posted(job.id, _pick(Economy.CLIENTS, rng))
		entry.done = true
		entry.paid = job.pay
		entry.by = "workshop"
		work.board.append(entry)
		coins += job.pay
	Wallet.earn(state, coins)
	work.earnedToday += coins
	return {"count": helpers, "coins": coins}


# Days in a row with at least one job, counting today or yesterday.
static func current_streak(state: Dictionary, now_ms: int) -> int:
	var last: String = state.work.lastWorked
	return int(state.work.streak) if last == Clock.day_key(now_ms) or last == Clock.yesterday_key(now_ms) else 0


static func streak_bonus(state: Dictionary, now_ms: int) -> float:
	return minf(Economy.STREAK_BONUS_MAX, Economy.STREAK_BONUS * current_streak(state, now_ms))


static func is_tired(state: Dictionary) -> bool:
	return Needs.average(state.nemla.needs) < Economy.NEEDS_TIRED


static func is_sick(state: Dictionary) -> bool:
	return Friends.has_problem(state, "sick")


# Coins for a run, rounded to 5: the score sets the share of the base pay,
# then the streak bonus, pay perks from the Shop and friends, and tiredness
# or sickness apply.
static func pay_for(state: Dictionary, job: Dictionary, score: int, now_ms: int) -> int:
	var skill := Economy.PAY_MIN + clampf(float(score) / job.great, 0.0, 1.0) * (Economy.PAY_MAX - Economy.PAY_MIN)
	var tired := Economy.TIRED_PAY if is_tired(state) or is_sick(state) else 1.0
	var perks := Perks.perks(state)
	var bonus: float = streak_bonus(state, now_ms) + perks.pay + perks.servicePay.get(job.service, 0.0)
	var coins: float = job.pay * skill * (1.0 + bonus) * tired
	return maxi(5, roundi(coins / 5.0) * 5)


static func pay_range(job: Dictionary) -> Array:
	return [roundi(job.pay * Economy.PAY_MIN), roundi(job.pay * Economy.PAY_MAX)]


# How the run went, for the result screen.
static func rating(job: Dictionary, score: int) -> String:
	var share: float = float(score) / job.great
	if share >= 1.0:
		return "perfect"
	if share >= 2.0 / 3.0:
		return "great"
	if share >= 1.0 / 3.0:
		return "good"
	return "ok"


# What starting a job hands to the mini-game, so the right job is paid even
# if midnight passes during the run.
static func ticket(state: Dictionary, slot: int) -> Dictionary:
	return {"day": state.work.day, "slot": slot, "job": state.work.board[slot].job}


# Pays for a finished run. Returns {} if that job was already paid.
static func finish_job(state: Dictionary, run: Dictionary, score: int, now_ms: int) -> Dictionary:
	var work: Dictionary = state.work
	var entry = work.board[run.slot] if work.day == run.day and run.slot < work.board.size() else null
	if entry != null and entry.done:
		return {}
	var job := job_by_id(run.job)
	var tired := is_tired(state)
	var sick := is_sick(state)
	var bonus := streak_bonus(state, now_ms)
	var coins := pay_for(state, job, score, now_ms)

	Wallet.earn(state, coins)
	work.earnedToday += coins
	work.done += 1
	if entry != null:
		entry.done = true
		entry.paid = coins
	var today := Clock.day_key(now_ms)
	if work.lastWorked != today:
		work.streak = work.streak + 1 if work.lastWorked == Clock.yesterday_key(now_ms) else 1
		work.lastWorked = today
	var needs: Dictionary = state.nemla.needs
	for need in Economy.JOB_EFFECT:
		needs[need] = clampf(needs[need] + Economy.JOB_EFFECT[need], 0.0, 100.0)

	return {"coins": coins, "rating": rating(job, score), "tired": tired and not sick, "sick": sick, "bonus": bonus, "levels": Care.gain_xp(state, Economy.JOB_XP)}
