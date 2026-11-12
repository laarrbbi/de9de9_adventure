# The guide's banner, under the top bar: what to do next and a Go button
# that opens the right tab. Main draws a ring on the thing to tap.
extends PanelContainer

signal go(tab: String)
signal close

var _count: Label
var _say: Label
var _go: PanelContainer
var _go_label: Label
var _here := false
var _step := {}


func _ready() -> void:
	add_theme_stylebox_override("panel", UI.style(UI.INK, 16, Vector4(10, 8, 8, 8)))
	var row := UI.hbox(10)
	add_child(row)
	row.add_child(UI.centered(UI.picture("res://assets/nemla-head.png", Vector2(34, 39))))
	var text := UI.vbox(1)
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	_count = UI.label("", 10, Color("#9fdcd6"), "body800")
	_say = UI.wrapped(UI.label("", 13, Color.WHITE, "body800"))
	text.add_child(_count)
	text.add_child(_say)
	row.add_child(text)
	_go_label = UI.label("", 13, UI.INK, "body800")
	_go = UI.button(_go_label, UI.GOLD, UI.INK, 13, Vector4(12, 0, 12, 0), 12, 40)
	UI.on_tap(_go, func():
		if _step.is_empty():
			return
		if _here:
			close.emit()
		else:
			go.emit(_step.tab))
	row.add_child(UI.centered(_go))


# Returns the step being shown (empty once the guide is over), and whether
# the player is on its tab.
func update(state: Dictionary, now: int, tab: String) -> Dictionary:
	_step = Guide.step(state)
	visible = not _step.is_empty()
	if not visible:
		return {}
	var home := Shop.next_home(state)
	var wait := Guide.waiting(state, now)
	_count.text = Words.t("guide.count", {"n": Guide.STEPS.find(_step) + 1, "total": Guide.STEPS.size()}).to_upper()
	_say.text = Words.t("guide.growing") if wait else Words.t("guide." + _step.id, {
		"coins": Words.num(home.get("price", 0)), "home": Words.t("item." + home.get("id", "anthill"))})
	_here = tab == _step.tab
	_go.visible = not _here or _step.id == "goal"
	_go_label.text = Words.t("guide.ok") if _here else Words.t("guide.go", {"tab": Words.t("tab." + _step.tab)})
	return {"step": _step, "here": _here, "wait": wait}
