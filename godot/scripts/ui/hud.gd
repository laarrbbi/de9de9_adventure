# The bar at the top of every screen: Nemla's level, coins, De9De9 points.
extends HBoxContainer

var _level: Label
var _xp: Bar
var _coins: Label
var _coins_pill: PanelContainer
var _points: Label
var _last_coins := -1


func _ready() -> void:
	add_theme_constant_override("separation", 8)
	mouse_filter = MOUSE_FILTER_IGNORE

	var avatar := PanelContainer.new()
	var ring := UI.style(UI.TEAL_SOFT, 22, Vector4.ZERO)
	ring.border_color = UI.TEAL
	ring.set_border_width_all(2)
	avatar.add_theme_stylebox_override("panel", ring)
	avatar.custom_minimum_size = Vector2(44, 44)
	avatar.add_child(UI.centered(UI.picture("res://assets/nemla-head.png", Vector2(32, 36))))
	add_child(UI.centered(avatar))

	var who := UI.vbox(4)
	who.alignment = BoxContainer.ALIGNMENT_CENTER
	who.add_child(UI.label("Nemla", 17, UI.INK, "display"))
	var lvl := UI.hbox(6)
	_level = UI.label("", 11, UI.TEAL_INK, "body800")
	lvl.add_child(_level)
	_xp = UI.bar(6, Color("#dbe7e5"), UI.TEAL)
	_xp.custom_minimum_size.x = 54
	_xp.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	lvl.add_child(UI.centered(_xp))
	who.add_child(lvl)
	add_child(who)
	add_child(UI.spacer())

	_coins_pill = UI.card(UI.CARD, 999, Vector4(5, 5, 11, 5), true)
	var c := UI.hbox(6)
	c.add_child(UI.coin(22))
	_coins = UI.label("", 16, UI.INK, "display")
	c.add_child(_coins)
	_coins_pill.add_child(c)
	add_child(UI.centered(_coins_pill))

	var points := UI.card(UI.RED_SOFT, 999, Vector4(10, 6, 10, 6), false)
	var p := UI.hbox(5)
	p.add_child(UI.centered(UI.label(Words.t("hud.points.short"), 10, UI.RED_INK, "body800")))
	_points = UI.label("", 14, UI.INK, "display")
	p.add_child(_points)
	points.add_child(p)
	add_child(UI.centered(points))


func update(state: Dictionary) -> void:
	_level.text = Words.t("hud.level", {"level": state.nemla.level})
	_xp.value = Level.progress(state.nemla)
	_coins.text = Words.num(state.coins)
	_points.text = "%s/%s" % [Words.num(state.points.balance), Words.num(Economy.SERVICE_COST)]
	if _last_coins >= 0 and state.coins != _last_coins:
		_coins_pill.pivot_offset = _coins_pill.size / 2
		var tween := create_tween()
		var up: bool = state.coins > _last_coins
		tween.tween_property(_coins_pill, "scale", Vector2(1.08, 1.08) if up else Vector2(0.95, 0.95), 0.12)
		tween.tween_property(_coins_pill, "scale", Vector2.ONE, 0.2)
	_last_coins = state.coins
