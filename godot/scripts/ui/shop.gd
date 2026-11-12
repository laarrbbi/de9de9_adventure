# The Shop screen: homes (shown as Nemla's journey), rooms, cars, equipment
# and clothes. Buying takes two taps, so a big price is never paid by
# accident. Actions go to Game.shop_check, shop_buy and shop_wear.
extends VBoxContainer

const SECTIONS := ["home", "room", "car", "tool", "clothes"]
const ARM_TIME := 4.0

var section := "home"
var _tabs := {}
var _intro: Label
var _list: VBoxContainer
var _path: Control
var _armed := ""
var _arm_timer: Timer
var _key := ""
var _state := {}


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	mouse_filter = MOUSE_FILTER_IGNORE
	add_child(UI.title(Words.t("shop.title"), Words.t("shop.sub")))

	var bar := UI.card(Color("#e4eeec"), 14, Vector4(4, 4, 4, 4), false)
	var row := UI.hbox(4)
	for s in SECTIONS:
		var tab := UI.card(Color(0, 0, 0, 0), 11, Vector4(2, 0, 2, 0), false)
		tab.custom_minimum_size.y = 40
		tab.size_flags_horizontal = SIZE_EXPAND_FILL
		var l := UI.label(Words.t("shop." + s), 12, UI.MUTED, "body800")
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		tab.add_child(l)
		UI.on_tap(tab, func():
			Sfx.tap()
			open(s))
		row.add_child(tab)
		_tabs[s] = tab
	bar.add_child(row)
	add_child(bar)

	_intro = UI.wrapped(UI.label("", 13, UI.MUTED, "body600"))
	add_child(_intro)
	var holder := Control.new()
	holder.mouse_filter = MOUSE_FILTER_IGNORE
	_path = _Path.new()
	holder.add_child(_path)
	_list = UI.vbox(8)
	holder.add_child(_list)
	_list.resized.connect(func():
		holder.custom_minimum_size.y = _list.size.y
		_path.size = _list.size)
	holder.resized.connect(func(): _list.size.x = holder.size.x)
	add_child(holder)

	_arm_timer = Timer.new()
	_arm_timer.one_shot = true
	_arm_timer.timeout.connect(func(): _arm(""))
	add_child(_arm_timer)


# Shows a section, e.g. the homes from the goal card at home.
func open(name: String) -> void:
	section = name
	_armed = ""
	_redraw()


func _arm(id: String) -> void:
	_armed = id
	if id != "":
		_arm_timer.start(ARM_TIME)
	_redraw()


func _redraw() -> void:
	_key = ""
	if not _state.is_empty():
		update(_state, Clock.now())


func update(state: Dictionary, _now: int) -> void:
	_state = state
	var items: Array = Perks.KINDS[section]
	var key := "%s|%s|%s|%s|%s|%s|%s" % [section, _armed, state.home, state.nemla.outfit, state.owned, items.map(func(i): return state.coins >= i.price), state.coins >= 0]
	if key == _key:
		return
	_key = key
	for s in _tabs:
		var on: bool = s == section
		UI.restyle(_tabs[s], UI.CARD if on else Color(0, 0, 0, 0))
		_tabs[s].get_child(0).add_theme_color_override("font_color", UI.INK if on else UI.MUTED)
	_intro.text = Words.t("shop.%sIntro" % section)
	_list.add_theme_constant_override("separation", 14 if section == "home" else 8)
	_path.visible = section == "home"
	UI.clear(_list)
	for item in items:
		_list.add_child(_card(state, item))


func _card(state: Dictionary, item: Dictionary) -> Control:
	var name := Words.t("item." + item.id)
	var perk := Words.t("perk." + item.id)
	if section == "home":
		var level := Perks.home_index(item.id) + 1
		perk = Words.t("perk.home", {"plots": Economy.PLOTS_BY_HOME[level - 1], "jobs": Economy.JOBS_PER_DAY + Economy.JOBS_PER_HOME * (level - 1)})
	var status := _action(state, item, name)
	var here: bool = section == "home" and Perks.home_of(state).id == item.id
	var card := UI.card(UI.FAINT if status.get("locked", false) else (UI.TEAL_SOFT if here else UI.CARD), 16, Vector4(10, 10, 10, 10), not status.get("locked", false))
	if here:
		UI.restyle(card, UI.TEAL_SOFT, UI.TEAL, 2)
	var row := UI.hbox(12)
	var pic := UI.card(UI.CARD if here else UI.PAGE, 14, Vector4.ZERO, false)
	pic.custom_minimum_size = Vector2(60, 60)
	var art := UI.item(item.id, 52)
	if status.get("locked", false):
		art.modulate.a = 0.55
	pic.add_child(UI.centered(art))
	row.add_child(UI.centered(pic))
	var text := UI.vbox(2)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	text.add_child(UI.label(name, 15, UI.INK, "body800"))
	text.add_child(UI.wrapped(UI.label(perk, 12, UI.MUTED, "body600")))
	if status.has("note"):
		text.add_child(UI.wrapped(UI.label(status.note, 12, UI.MUTED if status.get("locked", false) else UI.GOLD_INK, "body800")))
	row.add_child(text)
	row.add_child(UI.centered(status.node))
	card.add_child(row)
	return card


func _chip(content: Control, on := false, muted := false) -> PanelContainer:
	var chip := UI.card(Color(0, 0, 0, 0) if muted else (UI.CARD if on else UI.FAINT), 999, Vector4(10, 6, 10, 6), false)
	chip.add_child(content)
	return chip


func _check_chip(text: String, on: bool) -> PanelContainer:
	var row := UI.hbox(4)
	row.add_child(UI.centered(UI.icon("check", 14, UI.TEAL_INK if on else UI.MUTED)))
	row.add_child(UI.label(text, 12, UI.TEAL_INK if on else UI.MUTED, "body800"))
	return _chip(row, on)


func _price_button(item: Dictionary, short: bool) -> PanelContainer:
	var armed: bool = _armed == item.id
	var b: PanelContainer
	if armed:
		b = UI.button(Words.t("shop.confirm"), UI.INK, Color.WHITE)
	else:
		b = UI.button(UI.price(Words.num(item.price), 15, UI.MUTED if short else UI.INK), UI.FAINT if short else UI.GOLD)
	b.custom_minimum_size.x = 96
	UI.on_tap(b, func():
		if _armed == item.id:
			_arm("")
			Game.shop_buy(item.id)
		elif Game.shop_check(item.id):
			_arm(item.id))
	return b


# The right side of a card: what the player can do with this item now.
func _action(state: Dictionary, item: Dictionary, name: String) -> Dictionary:
	var short: bool = state.coins < item.price
	if section == "home":
		var index := Perks.home_index(item.id)
		if Perks.home_of(state).id == item.id:
			return {"node": _chip(UI.label(Words.t("shop.here"), 12, UI.TEAL_INK, "body800"), true)}
		if index < int(state.home.level):
			return {"node": _check_chip(Words.t("shop.livedHere"), false)}
		if item.id == Shop.next_home(state).get("id", ""):
			return {"node": _price_button(item, short), "note": Words.t("shop.saveMore", {"coins": Words.num(item.price - state.coins)}) if short else Words.t("shop.canMove")}
		return {"node": _chip(UI.price(Words.num(item.price), 14, UI.MUTED, 13), false, true), "locked": true,
			"note": Words.t("shop.after", {"home": Words.t("item." + Economy.HOMES[index - 1].id)})}
	if section == "clothes" and Perks.owns(state, item.id):
		var on: bool = state.nemla.outfit == item.id
		var b := UI.button(Words.t("shop.wearing" if on else "shop.wear"), UI.TEAL if on else UI.CARD, Color.WHITE if on else UI.TEAL_INK)
		if not on:
			UI.restyle(b, UI.CARD, UI.TEAL, 2)
		b.custom_minimum_size.x = 96
		UI.on_tap(b, func(): Game.shop_wear("" if on else item.id))
		return {"node": b, "note": Words.t("shop.takeOff")} if on else {"node": b}
	if Perks.owns(state, item.id):
		return {"node": _check_chip(Words.t("shop.owned"), true)}
	if section == "room" and int(state.home.level) < item.home:
		return {"node": _chip(UI.price(Words.num(item.price), 14, UI.MUTED, 13), false, true), "locked": true,
			"note": Words.t("shop.needsHome", {"home": Words.t("item." + Economy.HOMES[item.home - 1].id)})}
	return {"node": _price_button(item, short)}


# The dotted path that joins the homes, behind their cards.
class _Path:
	extends Control

	func _init() -> void:
		mouse_filter = MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var x := 40.0
		draw_dashed_line(Vector2(x, 30), Vector2(x, size.y - 30), Color("#c3cfcd"), 4.0, 4.0)

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			queue_redraw()
