# The game: loads the save, catches up on the time away, keeps the clock
# running, and carries out what the player does. Screens only show the save
# and call the actions here; they learn what happened from the signals.
# (Autoload "Game", like the web version's main.js.)
extends Node

signal changed                         # the save changed: redraw
signal ticked                          # once a second: update clocks and bars
signal toasted(text: String, kind: String)
signal reacted(where: String, what: String, data: Dictionary)  # effects to play
signal show_tab(name: String)          # take the player to a screen

const SAVE_DELAY := 0.3
const SAVE_EVERY := 15.0
const WELCOME_AFTER := 30 * 60000
const CARE_SOUND := {"eat": "eat", "wash": "wash", "play": "radio", "sleep": "sleep", "wake": "wake"}

var state: Dictionary
var fresh := false
var away_ms := 0
var playing := false
var last_ready := 0
var _save_timer: Timer
var _warned := false


func _ready() -> void:
	# The rule tests run without the game.
	if OS.get_cmdline_args().has("res://tests/run_tests.gd"):
		return
	start(SaveGame.load_game(Clock.now()))
	var tick := Timer.new()
	tick.wait_time = 1.0
	tick.autostart = true
	tick.timeout.connect(_tick)
	add_child(tick)
	var every := Timer.new()
	every.wait_time = SAVE_EVERY
	every.autostart = true
	every.timeout.connect(persist)
	add_child(every)
	_save_timer = Timer.new()
	_save_timer.one_shot = true
	_save_timer.wait_time = SAVE_DELAY
	_save_timer.timeout.connect(persist)
	add_child(_save_timer)


func start(loaded: Dictionary) -> void:
	state = loaded.state
	fresh = loaded.fresh
	var now := Clock.now()
	away_ms = Clock.advance(state, now).ms
	Guide.advance(state, false)
	new_day(now)
	Friends.update_visitor(state, now)
	Friends.update_problem(state, now)
	last_ready = Garden.ready_count(state, now)


# What to say when the game opens.
func welcome() -> void:
	if fresh:
		toast(Words.t("toast.hello"))
	elif away_ms >= WELCOME_AFTER:
		toast(Words.t("toast.back", {"time": Words.duration(away_ms)}))
		if last_ready:
			toast(_ready_message(last_ready, Clock.now()))


func _notification(what: int) -> void:
	if what in [NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_WM_CLOSE_REQUEST, NOTIFICATION_APPLICATION_FOCUS_OUT]:
		if not state.is_empty():
			Clock.advance(state, Clock.now())
			persist()
	elif what in [NOTIFICATION_APPLICATION_RESUMED, NOTIFICATION_APPLICATION_FOCUS_IN]:
		if not state.is_empty():
			_tick()


func _tick() -> void:
	var now := Clock.now()
	var woke: bool = Clock.advance(state, now).woke_up
	if woke:
		Sfx.wake()
		toast(Words.t("toast.woke"))
	var arrived := Friends.update_visitor(state, now)
	if arrived != "":
		Sfx.giggle()
		toast(Words.t("toast.visitor", {"bug": Words.t("bug." + arrived)}))
	var problem := Friends.update_problem(state, now)
	if problem != "":
		Sfx.no()
		toast(Words.t("toast.problem", {"problem": Words.t("problem." + problem)}))
	if new_day(now) or woke or arrived != "" or problem != "":
		persist()
	_notice_ready(now)
	if not playing:
		_guide_progress()
	ticked.emit()


func toast(text: String, kind := "") -> void:
	toasted.emit(text, kind)


# Every change to the save comes through here: redraw, then save soon.
func touch() -> void:
	if not playing:
		_guide_progress()
	changed.emit()
	if _save_timer:
		_save_timer.start()


func persist() -> void:
	if state.is_empty():
		return
	if not SaveGame.save_game(state) and not _warned:
		_warned = true
		toast(Words.t("toast.noSave"))


# A new day: a new job board, and the workshop's jobs if there is one.
func new_day(now: int) -> bool:
	var board := Jobs.refresh_board(state, now)
	Guide.first_job(state)
	var helped := Jobs.run_workshop(state, now)
	if not helped.is_empty():
		toast.call_deferred(Words.t("toast.workshop", {"n": helped.count, "coins": Words.num(helped.coins)}), "gold")
	return board or not helped.is_empty()


# Says why an action didn't happen. Returns whether it was refused.
func refused(result: Dictionary) -> bool:
	if result.ok:
		return false
	Sfx.no()
	toast(Words.t("why." + result.why, result))
	return true


func celebrate(levels: Array) -> void:
	for reached in levels:
		get_tree().create_timer(0.4).timeout.connect(Sfx.level_up)
		toast(Words.t("toast.level", reached), "gold")


# Home: tapping things in the scene or the need buttons.
func home_act(name: String) -> void:
	if name == "talk":
		Sfx.giggle()
		reacted.emit("home", "talk", {})
		return
	if name == "garden":
		show_tab.emit("garden")
		return
	if name == "journey":
		show_tab.emit("shop:home")
		return
	if name == "bed":
		name = "wake" if state.nemla.sleeping else "sleep"
	if not CARE_SOUND.has(name):
		return
	var result: Dictionary
	match name:
		"eat": result = Care.eat(state)
		"wash": result = Care.wash(state)
		"play": result = Care.play(state)
		"sleep": result = Care.sleep(state)
		"wake": result = Care.wake(state)
	if refused(result):
		return
	Sfx.call(CARE_SOUND[name])
	reacted.emit("home", name, result.gained)
	celebrate(result.levels)
	touch()


# Garden actions.
func garden_act(name: String, arg = null) -> void:
	var now := Clock.now()
	var g: Dictionary = state.garden
	match name:
		"seed":
			if g.seed == arg:
				return
			Sfx.tap()
			g.seed = arg
			touch()
		"seedLocked":
			Sfx.no()
			toast(Words.t("why.level", Garden.crop_by_id(arg)))
		"plot":
			var plot: Dictionary = g.plots[arg]
			if plot.crop == "":
				if refused(Garden.plant(state, arg, g.seed, now)):
					return
				Sfx.plant()
				touch()
			elif not Garden.is_ready(plot, now):
				Sfx.tap()
				toast(Words.t("toast.growing", {"crop": Words.t("crop." + plot.crop), "time": Words.countdown(plot.readyAt - now)}))
			else:
				var result := Garden.harvest(state, arg, now)
				if refused(result):
					return
				Sfx.harvest()
				touch()
				reacted.emit("garden", "plot", {"index": arg, "text": Words.t("garden.harvested", {"crop": Words.t("crop." + result.crop)})})
				celebrate(result.levels)
		"tractor":
			var result := Garden.tractor(state, now)
			if refused(result):
				return
			Sfx.harvest()
			touch()
			toast(Words.t("toast.tractorShort" if result.short else "toast.tractor", result))
			celebrate(result.levels)
		"harvestAll":
			var result := Garden.harvest_all(state, now)
			if refused(result):
				return
			Sfx.harvest()
			touch()
			toast(Words.t("toast.harvested", {"n": result.count}))
			celebrate(result.levels)
		"buyPlot":
			if refused(Garden.buy_plot(state)):
				return
			Sfx.plant()
			touch()
			toast(Words.t("toast.plot"))
		"sell", "sellAll":
			var result := Garden.sell(state, arg, now) if name == "sell" else Garden.sell_all(state, now)
			if refused(result):
				return
			Sfx.coins()
			touch()
			if name == "sell":
				reacted.emit("garden", "crop", {"crop": arg, "text": "+" + Words.num(result.coins)})
			if name == "sellAll" or result.short:
				toast(Words.t("toast.soldShort" if result.short else "toast.sold", {"n": result.count, "coins": Words.num(result.coins)}))


# Shop: whether an item can be bought (saying why not), buying, wearing.
func shop_check(id: String) -> bool:
	var can := Shop.check(state, id)
	if can.ok:
		Sfx.tap()
		return true
	var why := can.duplicate()
	why.why = "shop." + can.why
	if can.has("home"):
		why.home = Words.t("item." + can.home)
	if can.has("short"):
		why.short = Words.num(can.short)
	refused(why)
	return false


func shop_wear(id: String) -> void:
	if refused(Shop.wear(state, id)):
		return
	Sfx.tap()
	touch()


func shop_buy(id: String) -> void:
	var result := Shop.buy(state, id)
	if refused(result):
		return
	var item := Words.t("item." + id)
	if result.kind == "home":
		Sfx.level_up()
		Jobs.fill_board(state)
		touch()
		show_tab.emit("home")
		toast(Words.t("toast.moved", {"home": item}), "gold")
		return
	Sfx.coins()
	toast(Words.t("toast.bought", {"item": item}), "gold")
	# Whatever the item changes starts today, not tomorrow.
	if Jobs.fill_board(state):
		toast(Words.t("toast.moreJobs"))
	for job in Economy.JOBS:
		if job.get("needs", "") == id:
			Jobs.post_job(state, job.id)
			toast(Words.t("toast.unlockedJob", {"job": Words.t("job." + job.id)}))
	var helped := Jobs.run_workshop(state, Clock.now())
	if not helped.is_empty():
		toast(Words.t("toast.workshop", {"n": helped.count, "coins": Words.num(helped.coins)}), "gold")
	touch()


# Friends: a gift (a crop id or "box"), a friend's daily call, a problem fixed.
func gift(id: String, what: String) -> void:
	var result := Friends.give_gift(state, id, what, Clock.now())
	if refused(_named(result)):
		return
	var bug := Words.t("bug." + id)
	Sfx.harvest()
	if result.new_friend:
		Sfx.level_up()
		toast(Words.t("toast.newFriend", {"bug": bug}), "gold")
	else:
		toast(Words.t("toast.loved" if result.loved else "toast.thanks", {"bug": bug, "n": result.points}))
		if result.hearts > result.before:
			toast(Words.t("toast.heart", {"bug": bug, "n": result.hearts}), "gold")
	touch()


func call_friend(id: String) -> void:
	var result := Friends.call_friend(state, id, Clock.now())
	if refused(_named(result)):
		return
	Sfx.giggle()
	if result.favor == "coins":
		Sfx.coins()
	toast(Words.t("done." + result.favor, {"n": result.amount}), "gold")
	celebrate(result.levels)
	touch()


func fix_problem(how: String) -> void:
	var result := Friends.fix_problem(state, how, Clock.now())
	if refused(_named(result)):
		return
	Sfx.wake()
	toast(Words.t("toast.fixed", {"bug": Words.t("bug." + result.bug)}) if how == "friend" else Words.t("toast.fixedPaid"), "gold")
	celebrate(result.levels)
	touch()


# A refusal with the bug's name in it, for the message.
func _named(result: Dictionary) -> Dictionary:
	if result.ok or not result.has("bug"):
		return result
	var named := result.duplicate()
	named.bug = Words.t("bug." + result.bug)
	return named


func open_de9de9() -> void:
	Sfx.tap()
	OS.shell_open(Config.DE9DE9_URL)


# Work: what the play screen needs to start a job, and paying when it ends.
func job_ticket(slot: int) -> Dictionary:
	var board: Array = state.work.board
	if slot >= board.size() or board[slot].done:
		return {}
	var entry: Dictionary = board[slot]
	var job := Jobs.job_by_id(entry.job)
	var blocked := Jobs.blocked(state, job)
	if blocked != "":
		refused({"ok": false, "why": blocked})
		return {}
	playing = true
	Sfx.tap()
	return {
		"game": job.game,
		"name": Words.t("job." + job.id),
		"client": Words.t("play.for", {"client": Words.t("client." + entry.client)}),
		"pay": Jobs.pay_range(job),
		"run": Jobs.ticket(state, slot),
	}


func finish_job(run: Dictionary, score: int) -> Dictionary:
	var result := Jobs.finish_job(state, run, score, Clock.now())
	if result.is_empty():
		return {"coins": 0, "rating": "ok", "bonus": 0.0, "tired": false, "sick": false, "levels": []}
	touch()
	return result


func left_job(finished: bool, levels: Array) -> void:
	playing = false
	if not finished:
		toast(Words.t("play.stopped"))
	else:
		Sfx.coins()
		celebrate(levels)
	touch()


func close_guide() -> void:
	Guide.close(state)
	Sfx.tap()
	touch()


# Pays for each guide step the player just finished.
func _guide_progress() -> void:
	var done := Guide.advance(state)
	if done.steps == 0:
		return
	get_tree().create_timer(0.3).timeout.connect(Sfx.coins)
	toast(Words.t("toast.guideStep", {"coins": done.coins}), "gold")
	if _save_timer:
		_save_timer.start()


# Tells the player when crops finish growing while the game is open.
func _notice_ready(now: int) -> void:
	var ready := Garden.ready_count(state, now)
	if ready > last_ready:
		Sfx.crop_ready()
		toast(_ready_message(ready, now))
	last_ready = ready


func _ready_message(ready: int, now: int) -> String:
	if ready > 1:
		return Words.t("toast.readyMany", {"n": ready})
	for plot in state.garden.plots:
		if Garden.is_ready(plot, now):
			return Words.t("toast.readyOne", {"crop": Words.t("crop." + plot.crop)})
	return ""
