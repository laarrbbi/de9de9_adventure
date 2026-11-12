# The app's frame: the top bar, the guide, the screen that scrolls, the tab
# bar and the messages. It shows the screen the player picked and redraws it
# when the game changes. Android's back button closes a job, then goes home.
extends Control

const SCREENS := {
	"home": preload("res://scripts/ui/home.gd"),
	"garden": preload("res://scripts/ui/garden.gd"),
	"work": preload("res://scripts/ui/work.gd"),
	"shop": preload("res://scripts/ui/shop.gd"),
}

var screens := {}
var current := "home"
var _hud
var _guide
var _tabs
var _toasts
var _ring
var _scroll: ScrollContainer
var _top: MarginContainer
var _guide_box: MarginContainer
var _bottom_pad: Control
var _play: Control = null


func _ready() -> void:
	get_tree().set_quit_on_go_back(false)
	var page := ColorRect.new()
	page.color = UI.PAGE
	page.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	page.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(page)

	var column := VBoxContainer.new()
	column.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	column.add_theme_constant_override("separation", 0)
	add_child(column)

	_top = _margins(UI.SIDE, 10, UI.SIDE, 8)
	_hud = preload("res://scripts/ui/hud.gd").new()
	_top.add_child(_hud)
	column.add_child(_top)

	_guide_box = _margins(UI.SIDE, 0, UI.SIDE, 8)
	_guide = preload("res://scripts/ui/guide_bar.gd").new()
	_guide.go.connect(show_screen)
	_guide.close.connect(Game.close_guide)
	_guide_box.add_child(_guide)
	column.add_child(_guide_box)

	_scroll = ScrollContainer.new()
	_scroll.size_flags_vertical = SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	column.add_child(_scroll)
	var content := _margins(UI.SIDE, 4, UI.SIDE, 16)
	content.size_flags_horizontal = SIZE_EXPAND_FILL
	_scroll.add_child(content)
	var stack := UI.vbox(0)
	content.add_child(stack)
	for name in SCREENS:
		var screen: Control = SCREENS[name].new()
		screen.size_flags_horizontal = SIZE_EXPAND_FILL
		screen.visible = false
		stack.add_child(screen)
		screens[name] = screen
	screens.work.start.connect(_start_job)

	_tabs = preload("res://scripts/ui/tabs.gd").new()
	_tabs.selected.connect(func(tab):
		Sfx.tap()
		show_screen(tab))
	_tabs.locked.connect(func(tab):
		Sfx.tap()
		Game.toast(Words.t("toast.soon", {"name": Words.t("tab." + tab)})))
	column.add_child(_tabs)
	_bottom_pad = Control.new()
	_bottom_pad.mouse_filter = MOUSE_FILTER_IGNORE
	column.add_child(_bottom_pad)

	_ring = preload("res://scripts/ui/hint_ring.gd").new()
	_ring.clip = _scroll
	add_child(_ring)

	_toasts = preload("res://scripts/ui/toasts.gd").new()
	_toasts.set_anchors_and_offsets_preset(PRESET_BOTTOM_WIDE)
	_toasts.offset_left = UI.SIDE
	_toasts.offset_right = -UI.SIDE
	_toasts.grow_vertical = GROW_DIRECTION_BEGIN
	add_child(_toasts)

	Game.changed.connect(render)
	Game.ticked.connect(render)
	Game.toasted.connect(_toasts.show_toast)
	Game.reacted.connect(func(where, what, data):
		if screens.has(where):
			screens[where].react(what, data))
	Game.show_tab.connect(func(tab: String):
		if tab.begins_with("shop:"):
			screens.shop.open(tab.substr(5))
			tab = "shop"
		show_screen(tab))
	get_viewport().size_changed.connect(_fit_safe_area)
	_fit_safe_area()
	show_screen("home")
	Game.welcome()


func _margins(left: float, top: float, right: float, bottom: float) -> MarginContainer:
	var m := MarginContainer.new()
	m.add_theme_constant_override("margin_left", int(left))
	m.add_theme_constant_override("margin_top", int(top))
	m.add_theme_constant_override("margin_right", int(right))
	m.add_theme_constant_override("margin_bottom", int(bottom))
	m.mouse_filter = MOUSE_FILTER_IGNORE
	return m


# Keeps the top bar and tab bar clear of the phone's notch and system bars.
func _fit_safe_area() -> void:
	var window := Vector2(DisplayServer.window_get_size())
	var view := get_viewport_rect().size
	var safe := Rect2(DisplayServer.get_display_safe_area())
	var top := 0.0
	var bottom := 0.0
	if window.y > 0 and safe.size.y > 0:
		var k := view.y / window.y
		top = maxf(0.0, safe.position.y) * k
		bottom = maxf(0.0, window.y - safe.end.y) * k
	_top.add_theme_constant_override("margin_top", int(10 + top))
	_bottom_pad.custom_minimum_size.y = bottom
	_toasts.offset_bottom = -(80 + bottom)
	_toasts.offset_top = _toasts.offset_bottom - 200


func show_screen(name: String) -> void:
	current = name
	for key in screens:
		screens[key].visible = key == name
	_tabs.set_active(name)
	_scroll.scroll_vertical = 0
	render()


func render() -> void:
	if Game.state.is_empty():
		return
	var state := Game.state
	var now := Clock.now()
	_hud.update(state)
	_tabs.set_badge("garden", Garden.ready_count(state, now))
	screens[current].update(state, now)
	var guide: Dictionary = _guide.update(state, now, current)
	_ring.target = null
	if not guide.is_empty() and guide.here and not guide.wait:
		_ring.target = screens[current].hint_target(guide.step.target)


func _start_job(slot: int) -> void:
	var job := Game.job_ticket(slot)
	if job.is_empty():
		return
	_play = preload("res://scripts/ui/play.gd").new()
	_play.job = job
	_play.left.connect(func(finished, levels):
		_play = null
		Game.left_job(finished, levels))
	add_child(_play)


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if _play and is_instance_valid(_play):
			_play.leave()
		elif current != "home":
			show_screen("home")
		else:
			Game.persist()
			get_tree().quit()
