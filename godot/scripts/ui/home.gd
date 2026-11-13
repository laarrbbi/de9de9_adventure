# The home screen: the scene, Nemla's mood, the four needs and the next
# home to save for. It only shows the save; taps go to Game.home_act.
extends VBoxContainer

# What tapping each need's button does. "bed" means sleep, or wake up if
# Nemla is already asleep.
const ACT := {"hunger": "eat", "energy": "bed", "clean": "wash", "fun": "play"}

var _title: Label
var _time: Label
var _mood: PanelContainer
var _mood_label: Label
var _scene
var _needs := {}
var _goal: PanelContainer
var _goal_icon: Control
var _goal_title: Label
var _goal_reward: HBoxContainer
var _goal_bar: Bar
var _goal_note: Label
var _goal_key := ""
var _problem: PanelContainer
var _problem_key := ""


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	mouse_filter = MOUSE_FILTER_IGNORE

	var top := UI.hbox(12)
	var titles := UI.vbox(2)
	titles.size_flags_horizontal = SIZE_EXPAND_FILL
	_title = UI.label("", 25, UI.INK, "display")
	_time = UI.label("", 12, UI.MUTED, "body700")
	titles.add_child(_title)
	titles.add_child(_time)
	top.add_child(titles)
	_mood = UI.card(UI.TEAL_SOFT, 999, Vector4(11, 5, 11, 5), false)
	_mood_label = UI.label("", 12, UI.TEAL_INK, "body800")
	_mood.add_child(_mood_label)
	top.add_child(UI.centered(_mood))
	add_child(top)

	_scene = preload("res://scripts/ui/home_scene.gd").new()
	_scene.size_flags_horizontal = SIZE_EXPAND_FILL
	add_child(_scene)

	_problem = UI.card(UI.RED_SOFT, 18, Vector4(12, 12, 12, 8), false)
	_problem.visible = false
	add_child(_problem)

	var grid := UI.grid(2, 10)
	for need in Needs.NEEDS:
		grid.add_child(_need_button(need))
	add_child(grid)

	_goal = UI.card(UI.GOLD_SOFT, 16, Vector4(14, 12, 14, 12), false)
	var row := UI.hbox(12)
	var pic := UI.card(UI.CARD, 14, Vector4.ZERO, false)
	pic.custom_minimum_size = Vector2(52, 52)
	_goal_icon = UI.centered(Control.new())
	pic.add_child(_goal_icon)
	row.add_child(UI.centered(pic))
	var body := UI.vbox(6)
	body.size_flags_horizontal = SIZE_EXPAND_FILL
	var head := UI.hbox(8)
	_goal_title = UI.wrapped(UI.label("", 14, UI.INK, "body800"))
	head.add_child(_goal_title)
	_goal_reward = UI.hbox(4)
	head.add_child(_goal_reward)
	body.add_child(head)
	_goal_bar = UI.bar(8, Color("#fbe3a6"), Color("#f0a500"))
	body.add_child(_goal_bar)
	_goal_note = UI.wrapped(UI.label("", 11, UI.GOLD_INK, "body700"))
	body.add_child(_goal_note)
	row.add_child(body)
	_goal.add_child(row)
	UI.on_tap(_goal, func(): Game.home_act("journey"))
	add_child(_goal)


func _need_button(need: String) -> Control:
	var card := UI.card(UI.CARD, 16, Vector4(12, 10, 12, 10), true)
	card.size_flags_horizontal = SIZE_EXPAND_FILL
	card.custom_minimum_size.y = 60
	var row := UI.hbox(10)
	var square := UI.card(UI.TEAL_SOFT, 11, Vector4.ZERO, false)
	square.custom_minimum_size = Vector2(34, 34)
	var icon := UI.icon(need, 18, UI.TEAL_INK)
	square.add_child(UI.centered(icon))
	row.add_child(UI.centered(square))
	var body := UI.vbox(7)
	body.size_flags_horizontal = SIZE_EXPAND_FILL
	body.alignment = BoxContainer.ALIGNMENT_CENTER
	var top := UI.hbox(4)
	top.add_child(UI.label(Words.t("need." + need), 13, UI.INK, "body800"))
	top.add_child(UI.spacer())
	var act := UI.card(UI.INK, 999, Vector4(8, 3, 8, 3), false)
	var act_row := UI.hbox(3)
	var act_label := UI.label("", 11, Color.WHITE, "body800")
	act_row.add_child(act_label)
	if need == "hunger":
		act_row.add_child(UI.centered(UI.coin(12)))
		act_row.add_child(UI.label(str(Economy.MEAL.cost), 11, Color.WHITE, "body800"))
	act.add_child(act_row)
	top.add_child(act)
	body.add_child(top)
	var bar := UI.bar(8)
	body.add_child(bar)
	row.add_child(body)
	card.add_child(row)
	UI.on_tap(card, func(): Game.home_act(ACT[need]))
	_needs[need] = {"card": card, "square": square, "icon": icon, "act": act_label, "bar": bar}
	return card


func update(state: Dictionary, now: int) -> void:
	var sleeping: bool = state.nemla.sleeping
	var feeling := "sleeping" if sleeping else Needs.mood(state.nemla.needs)
	_title.text = Words.t("home.title." + Perks.home_of(state).id)
	_time.text = Words.t("home.time", {"day": Clock.day_number(state.createdAt, now), "time": Clock.clock_time(now)})
	_mood_label.text = Words.t("mood." + feeling)
	var mood_colors := {"happy": [UI.TEAL_SOFT, UI.TEAL_INK], "ok": [UI.GOLD_SOFT, UI.GOLD_INK], "low": [UI.RED_SOFT, UI.RED_INK], "sleeping": [Color("#e3e8f4"), Color("#34446b")]}
	UI.restyle(_mood, mood_colors[feeling][0])
	_mood_label.add_theme_color_override("font_color", mood_colors[feeling][1])
	_scene.update(state, now)

	for need in Needs.NEEDS:
		var n: Dictionary = _needs[need]
		var value: float = state.nemla.needs[need]
		var low := value < Economy.NEED_LOW
		n.bar.value = value / 100.0
		n.bar.fill = UI.RED if low else UI.TEAL
		n.bar.queue_redraw()
		UI.restyle(n.square, UI.RED_SOFT if low else UI.TEAL_SOFT)
		n.icon.modulate = Color("#c8343c") if low else UI.TEAL_INK
		if need == "energy":
			n.act.text = Words.t("act.wake" if sleeping else "act.sleep")
		else:
			n.act.text = Words.t("act." + ACT[need])
	_update_goal(state)
	_update_problem(state)


# A problem at home: what it does, and who can fix it.
func _update_problem(state: Dictionary) -> void:
	var kind := Friends.problem(state)
	_problem.visible = kind != ""
	var bug := Friends.fixer(kind) if kind != "" else {}
	var friend := kind != "" and Friends.is_friend(state, bug.id)
	var key := "%s|%s|%s" % [kind, friend, state.coins >= Economy.FIX_COST]
	if kind == "" or key == _problem_key:
		return
	_problem_key = key
	UI.clear(_problem)
	var box := UI.vbox(8)
	var row := UI.hbox(12)
	var circle := UI.card(UI.CARD, 26, Vector4.ZERO, false)
	circle.custom_minimum_size = Vector2(52, 52)
	circle.add_child(UI.centered(UI.picture("res://assets/art/problems/%s.svg" % kind, Vector2(40, 40))))
	row.add_child(UI.centered(circle))
	var text := UI.vbox(2)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	text.add_child(UI.wrapped(UI.label(Words.t("problem." + kind), 15, UI.INK, "body800")))
	text.add_child(UI.wrapped(UI.label(Words.t("problem.%s.effect" % kind), 12, UI.RED_INK, "body700")))
	row.add_child(text)
	box.add_child(row)
	var name := Words.t("bug." + bug.id)
	if friend:
		var call_row := UI.hbox(8)
		call_row.add_child(UI.centered(Gifts.portrait(bug.id, 26)))
		call_row.add_child(UI.label(Words.t("problem.call", {"bug": name}), 15, Color.WHITE, "display"))
		var call := UI.button(call_row, UI.TEAL_INK, Color.WHITE, 15, Vector4(8, 0, 12, 0), 13, 48)
		UI.on_tap(call, func(): Game.fix_problem("friend"))
		box.add_child(call)
	else:
		var pay_row := UI.hbox(6)
		pay_row.add_child(UI.label(Words.t("problem.pay"), 15, UI.INK, "display"))
		pay_row.add_child(UI.centered(UI.coin(16)))
		pay_row.add_child(UI.label(str(Economy.FIX_COST), 15, UI.INK, "display"))
		var pay := UI.button(pay_row)
		UI.on_tap(pay, func(): Game.fix_problem("pay"))
		box.add_child(pay)
		box.add_child(UI.wrapped(UI.label(Words.t("problem.meet", {"bug": name}), 12, UI.MUTED, "body600")))
	box.add_child(Gifts.link(Words.t("problem.real")))
	_problem.add_child(box)


# The next home: how far the coins are from its price.
func _update_goal(state: Dictionary) -> void:
	var next := Shop.next_home(state)
	var ready: bool = not next.is_empty() and state.coins >= next.price
	var key := "%s|%s" % [next.get("id", ""), ready]
	if key != _goal_key:
		_goal_key = key
		UI.clear(_goal_icon)
		_goal_icon.add_child(UI.item(next.get("id", Perks.home_of(state).id), 40))
		UI.restyle(_goal, UI.GOLD if ready else UI.GOLD_SOFT)
		_goal_title.text = Words.t("goal.top") if next.is_empty() else Words.t("goal.ready" if ready else "goal.title", {"home": Words.t("item." + next.id)})
		UI.clear(_goal_reward)
		if not next.is_empty():
			_goal_reward.add_child(UI.price(Words.num(next.price), 15, UI.INK if ready else UI.GOLD_INK))
	var share := 1.0 if next.is_empty() else minf(1.0, float(state.coins) / next.price)
	_goal_bar.value = share
	_goal_bar.track = Color("#ffe9a8") if ready else Color("#fbe3a6")
	if next.is_empty():
		_goal_note.text = Words.t("goal.topNote")
	elif ready:
		_goal_note.text = Words.t("goal.readyNote")
	else:
		_goal_note.text = Words.t("goal.note", {"coins": Words.num(state.coins), "price": Words.num(next.price), "left": Words.num(next.price - state.coins)})
	_goal_note.add_theme_color_override("font_color", UI.INK if ready else UI.GOLD_INK)


func react(act: String, gained: Dictionary) -> void:
	_scene.react(act, gained)


# What the guide points at on this screen.
func hint_target(name: String) -> Control:
	match name:
		"eat":
			return _needs.hunger.card
		"goal":
			return _goal
	return null
