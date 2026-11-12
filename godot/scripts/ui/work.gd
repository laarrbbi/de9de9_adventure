# The Work screen: today's jobs, what they pay, the work streak, and the
# jobs still to unlock. Starting a job emits `start` with its slot.
extends VBoxContainer

signal start(slot: int)

var _earned: Label
var _left: Label
var _streak: Label
var _bonus: Label
var _list: VBoxContainer
var _note: Label
var _locked: VBoxContainer
var _key := ""
var _first_go: Control = null


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	mouse_filter = MOUSE_FILTER_IGNORE
	add_child(UI.title(Words.t("work.title"), Words.t("work.sub")))

	var stats := UI.card(UI.CARD, 18, Vector4(14, 12, 14, 12), true)
	var cols := UI.grid(3, 10)
	_earned = _stat(cols, Words.t("work.earned"), UI.coin(18))
	_left = _stat(cols, Words.t("work.left"), null)
	_streak = _stat(cols, Words.t("work.streak"), UI.icon("flame", 18, UI.ORANGE))
	_bonus = UI.label("", 11, UI.GOLD_INK, "body800")
	cols.get_child(2).add_child(_bonus)
	stats.add_child(cols)
	add_child(stats)

	_list = UI.vbox(8)
	add_child(_list)
	_note = UI.label("", 12, UI.MUTED, "body700")
	_note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_note)
	_locked = UI.vbox(8)
	add_child(_locked)

	var real := UI.card(UI.RED_SOFT, 18, Vector4(14, 12, 12, 12), false)
	var row := UI.hbox(12)
	var text := UI.vbox(2)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.add_child(UI.caps(Words.t("work.realTitle"), UI.RED_INK))
	text.add_child(UI.wrapped(UI.label(Words.t("work.realText"), 13, UI.INK, "body800")))
	row.add_child(text)
	var open := UI.button(UI.label(Words.t("work.realLink"), 13, Color.WHITE, "body800"), Color("#c8343c"))
	UI.on_tap(open, func(): OS.shell_open(Config.DE9DE9_URL))
	row.add_child(UI.centered(open))
	real.add_child(row)
	add_child(real)


func _stat(parent: GridContainer, title: String, icon: Control) -> Label:
	var box := UI.vbox(3)
	box.size_flags_horizontal = SIZE_EXPAND_FILL
	box.add_child(UI.caps(title))
	var row := UI.hbox(5)
	if icon:
		row.add_child(UI.centered(icon))
	var value := UI.label("", 20, UI.INK, "display")
	row.add_child(value)
	box.add_child(row)
	parent.add_child(box)
	return value


func update(state: Dictionary, now: int) -> void:
	var board: Array = state.work.board
	var left := board.filter(func(e): return not e.done).size()
	var streak := Jobs.current_streak(state, now)
	var bonus := roundi(Jobs.streak_bonus(state, now) * 100)
	_earned.text = Words.num(state.work.earnedToday)
	_left.text = Words.t("work.leftValue", {"left": left, "total": board.size()})
	_streak.text = Words.t("work.streakOne") if streak == 1 else Words.t("work.streakValue", {"days": streak})
	_bonus.text = Words.t("work.streakBonus", {"pct": bonus}) if bonus else ""
	_bonus.visible = bonus > 0
	var time := Words.duration(Clock.ms_to_midnight(now))
	_note.text = Words.t("work.newJobs", {"time": time}) if left else Words.t("work.allDone", {"time": time})

	# The lists only change when a job is done, on a new day or a new level.
	var key := "%s|%s|%s|%s" % [state.work.day, state.nemla.level, board.map(func(e): return e.paid), state.owned]
	if key == _key:
		return
	_key = key
	UI.clear(_list)
	_first_go = null
	for slot in board.size():
		_list.add_child(_job_card(board[slot], slot))
	UI.clear(_locked)
	var locked := Economy.JOBS.filter(func(j): return not Jobs.can_take(state, j))
	if not locked.is_empty():
		_locked.add_child(UI.caps(Words.t("work.lockedTitle")))
		for job in locked:
			_locked.add_child(_locked_card(job))


func _service(job: Dictionary, faded := false) -> Control:
	var circle := UI.card(UI.PAGE, 22, Vector4.ZERO, false)
	circle.custom_minimum_size = Vector2(44, 44)
	circle.add_child(UI.centered(UI.picture("res://assets/services/%s.png" % job.service, Vector2(38, 38), Color(1, 1, 1, 0.6) if faded else Color.WHITE)))
	return UI.centered(circle)


func _job_card(entry: Dictionary, slot: int) -> Control:
	var job := Jobs.job_by_id(entry.job)
	var card := UI.card(Color("#eaf3f1") if entry.done else UI.CARD, 16, Vector4(12, 10, 10, 10), not entry.done)
	var row := UI.hbox(12)
	row.add_child(_service(job, entry.done))
	var text := UI.vbox(2)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	text.add_child(UI.label(Words.t("job." + job.id), 14, UI.INK, "body800"))
	var details := Words.t("work.byWorkshop", {"client": Words.t("client." + entry.client)}) if entry.has("by") else Words.t("work.for", {
		"client": Words.t("client." + entry.client), "service": Words.t("service." + job.service), "game": Words.t("game." + job.game)})
	text.add_child(UI.wrapped(UI.label(details, 11, UI.MUTED, "body600")))
	row.add_child(text)
	if entry.done:
		var paid := UI.hbox(4)
		paid.add_child(UI.centered(UI.icon("check", 16, UI.TEAL_INK)))
		paid.add_child(UI.label("+" + Words.num(entry.paid), 15, UI.TEAL_INK, "display"))
		row.add_child(UI.centered(paid))
	else:
		var go := UI.button(UI.price("+" + Words.num(job.pay), 15, UI.INK, 16))
		UI.on_tap(go, func(): start.emit(slot))
		row.add_child(UI.centered(go))
		if _first_go == null:
			_first_go = go
	card.add_child(row)
	return card


func _locked_card(job: Dictionary) -> Control:
	var holder := Control.new()
	holder.custom_minimum_size.y = 68
	holder.mouse_filter = MOUSE_FILTER_IGNORE
	var dash := Dashed.new()
	dash.fill = UI.FAINT
	holder.add_child(dash)
	var row := UI.hbox(12)
	row.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	row.offset_left = 14
	row.offset_right = -14
	var circle := UI.card(UI.PAGE, 22, Vector4.ZERO, false)
	circle.custom_minimum_size = Vector2(44, 44)
	circle.add_child(UI.centered(UI.icon("lock", 18, UI.MUTED)))
	row.add_child(UI.centered(circle))
	var text := UI.vbox(2)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	text.add_child(UI.label(Words.t("job." + job.id), 14, UI.INK, "body800"))
	var why := Words.t("work.needsItem", {"item": Words.t("item." + job.needs)}) if job.has("needs") else Words.t("work.needsLevel", {"level": job.level})
	text.add_child(UI.wrapped(UI.label(why, 11, UI.MUTED, "body600")))
	row.add_child(text)
	row.add_child(UI.centered(UI.price("+" + Words.num(job.pay), 15, UI.MUTED, 14)))
	holder.add_child(row)
	return holder


func hint_target(name: String) -> Control:
	return _first_go if name == "first_job" else null
