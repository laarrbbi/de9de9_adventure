# The tab bar. Open tabs switch screens; the others show a lock and say they
# are coming, so players can see what the game will become.
extends PanelContainer

signal selected(tab: String)
signal locked(tab: String)

const TABS := ["home", "garden", "work", "shop", "friends", "map"]
const OPEN := ["home", "garden", "work", "shop"]

var _tabs := {}
var _badges := {}


func _ready() -> void:
	var s := UI.style(UI.CARD, 0, Vector4(6, 6, 6, 8))
	s.border_color = UI.LINE
	s.border_width_top = 1
	add_theme_stylebox_override("panel", s)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 0)
	add_child(row)
	for id in TABS:
		var tab := UI.vbox(4)
		tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tab.custom_minimum_size.y = 52
		tab.alignment = BoxContainer.ALIGNMENT_CENTER
		var pill := PanelContainer.new()
		pill.custom_minimum_size = Vector2(46, 30)
		pill.add_theme_stylebox_override("panel", UI.style(Color(0, 0, 0, 0), 15, Vector4.ZERO))
		pill.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var art := Control.new()
		art.custom_minimum_size = Vector2(46, 30)
		art.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var icon := UI.icon(id, 22, UI.MUTED)
		icon.position = Vector2(12, 4)
		art.add_child(icon)
		if not id in OPEN:
			var lock := UI.card(UI.CARD, 8, Vector4(2, 2, 2, 2), false)
			lock.position = Vector2(28, 15)
			lock.add_child(UI.icon("lock", 10, UI.MUTED))
			art.add_child(lock)
		pill.add_child(art)
		tab.add_child(UI.centered(pill))
		var name := UI.label(Words.t("tab." + id), 11, UI.MUTED, "body800")
		name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		tab.add_child(name)
		UI.on_tap(tab, func(): (selected if id in OPEN else locked).emit(id))
		row.add_child(tab)
		_tabs[id] = {"pill": pill, "icon": icon, "name": name, "art": art}


func set_active(tab: String) -> void:
	for id in _tabs:
		var on: bool = id == tab
		var t: Dictionary = _tabs[id]
		var color := UI.TEAL_INK if on else UI.MUTED
		t.icon.modulate = color
		t.name.add_theme_color_override("font_color", color)
		t.pill.add_theme_stylebox_override("panel", UI.style(UI.TEAL_SOFT if on else Color(0, 0, 0, 0), 15, Vector4.ZERO))


# A small red count on a tab's icon, like crops ready in the garden.
func set_badge(tab: String, n: int) -> void:
	if not _badges.has(tab):
		var badge := UI.card(UI.RED, 9, Vector4(5, 0, 5, 0), false)
		var s: StyleBoxFlat = badge.get_theme_stylebox("panel")
		s.border_color = UI.CARD
		s.set_border_width_all(2)
		badge.custom_minimum_size = Vector2(20, 20)
		var l := UI.label("", 11, Color.WHITE, "body800")
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		badge.add_child(l)
		badge.position = Vector2(28, -6)
		_tabs[tab].art.add_child(badge)
		_badges[tab] = badge
	_badges[tab].visible = n > 0
	_badges[tab].get_child(0).text = "9+" if n > 9 else str(n)
