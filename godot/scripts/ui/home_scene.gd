# Nemla's home: the scene, drawn in layers from the exported drawings and
# placed in scene units (360×380), scaled to the screen's width. Each home
# has its own background; rooms swap in better furniture; Nemla wears her
# outfit. Tapping things calls Game.home_act, as in the web version.
extends Control

const ART := "res://assets/art/"
const SIZE := ArtLayout.SCENE
const RADIUS := 24.0
# What tapping each thing does.
const ACTS := {"sign": "garden", "play": "play", "bed": "bed", "wash": "wash", "eat": "eat"}
# Where a problem at home shows, centred, in scene units.
const PROBLEM_SPOTS := {"leak": Vector2(272, 258), "brokenRadio": Vector2(122, 186), "mess": Vector2(126, 330), "sick": Vector2(228, 196), "flatTire": Vector2(290, 50)}

var _stage: Control
var _look := ""
var _time := ""
var _back: TextureRect
var _nemla: Control
var _eyelids: TextureRect
var _in_bed: Control
var _shade: TextureRect
var _zzz: Control
var _fx: Control
var _talk: Control
var _thoughts := {}
var _badges := {}
var _speech: PanelContainer
var _speech_label: Label
var _bob: Tween
var _state := {}
var _problem: TextureRect
var _problem_kind := ""


func _ready() -> void:
	clip_contents = true
	mouse_filter = MOUSE_FILTER_IGNORE
	_stage = Control.new()
	_stage.size = SIZE
	_stage.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_stage)
	var corners := _Corners.new()
	corners.radius = RADIUS
	add_child(corners)
	_speech = UI.card(UI.CARD, 14, Vector4(12, 8, 12, 8), true)
	_speech_label = UI.label("", 14, UI.INK, "body800")
	_speech.add_child(_speech_label)
	_speech.visible = false
	add_child(_speech)
	var blink := Timer.new()
	blink.wait_time = 5.0
	blink.autostart = true
	blink.timeout.connect(_blink)
	add_child(blink)
	resized.connect(_fit)


func _get_minimum_size() -> Vector2:
	return Vector2(0, size.x * SIZE.y / SIZE.x)


func _fit() -> void:
	var k := size.x / SIZE.x
	_stage.scale = Vector2(k, k)
	update_minimum_size()


func _layer(path: String, rect: Rect2, parent: Control = _stage) -> TextureRect:
	var r := TextureRect.new()
	r.texture = UI.tex(ART + path)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.position = rect.position
	r.size = rect.size
	r.mouse_filter = MOUSE_FILTER_IGNORE
	parent.add_child(r)
	return r


func _box(name: String) -> Rect2:
	var b: Array = ArtLayout.BOXES[name]
	return Rect2(b[0], b[1], b[2], b[3])


func _piece(file: String, box: String) -> TextureRect:
	return _layer("home/%s.svg" % file, _box(box).grow(ArtLayout.PAD))


func _head(parent: Control, x: float, y: float, width: float, eyes_closed: bool) -> TextureRect:
	var height := width * ArtLayout.HEAD_RATIO
	var head := TextureRect.new()
	head.texture = UI.tex("res://assets/nemla-head.png")
	head.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	head.stretch_mode = TextureRect.STRETCH_SCALE
	head.position = Vector2(x, y)
	head.size = Vector2(width, height)
	head.mouse_filter = MOUSE_FILTER_IGNORE
	parent.add_child(head)
	var lids := _layer("nemla/eyelids.svg", Rect2(x, y, width, height), parent)
	lids.visible = eyes_closed
	return lids


# Builds the scene for a home, its rooms and Nemla's outfit.
func _build(level: int, rooms: Array, outfit: String) -> void:
	UI.clear(_stage)
	_thoughts.clear()
	_badges.clear()
	_back = _layer("home/back_%d_day.svg" % level, Rect2(Vector2.ZERO, SIZE))
	_time = ""
	for logo in ArtLayout.LOGOS[level - 1]:
		_layer("../logo-mark.png", Rect2(logo.x, logo.y, logo.w, logo.h))
	_piece("sign", "sign")
	var sign_text := UI.label(Words.t("garden.sign"), 9, Color("#5b3a22"), "body800")
	sign_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sign_text.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_stage.add_child(sign_text)
	sign_text.position = Vector2(34, 45)
	sign_text.size = Vector2(46, 14)
	_piece("stereo" if rooms.has("musicRoom") else "radio", "play")
	var big := rooms.has("bedroom")
	_piece("bigbed_back" if big else "bed_back", "bed")
	_in_bed = Control.new()
	_in_bed.mouse_filter = MOUSE_FILTER_IGNORE
	_stage.add_child(_in_bed)
	_head(_in_bed, ArtLayout.IN_BED.x, ArtLayout.IN_BED.y, ArtLayout.IN_BED.width, true)
	_piece("bigbed_front" if big else "bed_front", "bed")
	_piece("bathtub" if rooms.has("bathroom") else "tub", "wash")
	_piece("fridge" if rooms.has("kitchen") else "pantry", "eat")

	# Nemla standing, as in the web version's nemla.js.
	_nemla = Control.new()
	_nemla.size = SIZE
	_nemla.pivot_offset = Vector2(ArtLayout.NEMLA.x, ArtLayout.NEMLA.feet)
	_nemla.mouse_filter = MOUSE_FILTER_IGNORE
	_stage.add_child(_nemla)
	var width: float = ArtLayout.NEMLA.width
	var s := width / 56.0
	var body_y: float = ArtLayout.NEMLA.feet - 38.0 * s
	var head_x: float = ArtLayout.NEMLA.x - width / 2.0
	var head_y := body_y + 9.0 * s - width * ArtLayout.HEAD_RATIO
	_layer("nemla/body_overalls.svg" if outfit == "overalls" else "nemla/body.svg", Rect2(ArtLayout.NEMLA.x - 23.0 * s, body_y, 46.0 * s, 38.0 * s), _nemla)
	_eyelids = _head(_nemla, head_x, head_y, width, false)
	if outfit in ["redCap", "strawHat", "sunglasses"]:
		_layer("nemla/%s.svg" % outfit, Rect2(head_x, head_y, width, width * ArtLayout.HEAD_RATIO), _nemla)

	for need in Needs.NEEDS:
		var at: Array = ArtLayout.BADGES[need]
		var badge := _layer("home/badge.svg", Rect2(at[0] - 12, at[1] - 12, 24, 24))
		badge.pivot_offset = Vector2(12, 12)
		badge.visible = false
		_badges[need] = badge
		var t: Array = ArtLayout.THOUGHT
		var thought := _layer("home/thought_%s.svg" % need, Rect2(t[0], t[1], t[2], t[3]))
		thought.visible = false
		_thoughts[need] = thought

	_shade = _layer("home/shade_%d.svg" % level, Rect2(Vector2.ZERO, SIZE))
	_shade.modulate.a = 0.35
	_zzz = Control.new()
	_zzz.mouse_filter = MOUSE_FILTER_IGNORE
	_stage.add_child(_zzz)
	for z in [[96, 248, 15], [108, 234, 15], [121, 214, 19]]:
		var l := UI.label("z" if z[2] < 19 else "Z", z[2], Color.WHITE, "display")
		l.position = Vector2(z[0], z[1])
		_zzz.add_child(l)
	_problem = TextureRect.new()
	_problem.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_problem.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_problem.size = Vector2(34, 34)
	_problem.pivot_offset = Vector2(17, 17)
	_problem.mouse_filter = MOUSE_FILTER_IGNORE
	_problem.visible = false
	_stage.add_child(_problem)
	_problem_kind = ""
	var shake := _problem.create_tween().set_loops()
	shake.tween_property(_problem, "rotation", 0.15, 0.4).set_trans(Tween.TRANS_SINE)
	shake.tween_property(_problem, "rotation", -0.15, 0.4).set_trans(Tween.TRANS_SINE)
	_fx = Control.new()
	_fx.mouse_filter = MOUSE_FILTER_IGNORE
	_stage.add_child(_fx)

	# Tap areas, on top of everything.
	for box in ACTS:
		_target(_box(box), ACTS[box])
	_talk = _target(Rect2(134, 188, 92, 162), "talk")
	_start_bob()


func _target(rect: Rect2, act: String) -> Control:
	var hit := Control.new()
	hit.position = rect.position
	hit.size = rect.size
	_stage.add_child(hit)
	UI.on_tap(hit, func(): Game.home_act(act))
	hit.set_meta("act", act)
	return hit


# The thing to point at for the guide, by what tapping it does.
func target(act: String) -> Control:
	for child in _stage.get_children():
		if child.get_meta("act", "") == act:
			return child
	return null


func update(state: Dictionary, now: int) -> void:
	_state = state
	var look := "%s|%s|%s" % [state.home.level, state.home.rooms, state.nemla.outfit]
	if look != _look:
		_look = look
		_build(int(state.home.level), state.home.rooms, state.nemla.outfit)
	var time := "night" if Clock.is_night(now) else "day"
	if time != _time:
		_time = time
		_back.texture = UI.tex(ART + "home/back_%d_%s.svg" % [state.home.level, time])
	var sleeping: bool = state.nemla.sleeping
	var worst := "" if sleeping else Needs.worst_need(state.nemla.needs)
	_nemla.visible = not sleeping
	_talk.visible = not sleeping
	_in_bed.visible = sleeping
	_shade.visible = sleeping
	_zzz.visible = sleeping
	for need in Needs.NEEDS:
		_thoughts[need].visible = need == worst
		_set_badge(need, need == worst)
	var kind: String = state.get("problem", {}).get("kind", "")
	if kind != _problem_kind:
		_problem_kind = kind
		_problem.visible = kind != ""
		if kind != "":
			_problem.texture = UI.tex(ART + "problems/%s.svg" % kind)
			_problem.position = PROBLEM_SPOTS[kind] - _problem.size / 2


func _set_badge(need: String, on: bool) -> void:
	var badge: TextureRect = _badges[need]
	if badge.visible == on:
		return
	badge.visible = on
	if on:
		var tween := badge.create_tween().set_loops()
		tween.tween_property(badge, "position:y", badge.position.y - 4, 0.5).set_trans(Tween.TRANS_SINE)
		tween.tween_property(badge, "position:y", badge.position.y, 0.5).set_trans(Tween.TRANS_SINE)


func _start_bob() -> void:
	if _bob:
		_bob.kill()
	_bob = _nemla.create_tween().set_loops()
	_bob.tween_property(_nemla, "position:y", -3.0, 1.6).set_trans(Tween.TRANS_SINE)
	_bob.tween_property(_nemla, "position:y", 0.0, 1.6).set_trans(Tween.TRANS_SINE)


func _blink() -> void:
	if not _eyelids:
		return
	_eyelids.visible = true
	await get_tree().create_timer(0.12).timeout
	if is_instance_valid(_eyelids):
		_eyelids.visible = false


# Shows what an action did, on top of what update() draws.
func react(act: String, gained: Dictionary) -> void:
	match act:
		"eat":
			_bite()
			_float("+%d" % gained.get("hunger", Economy.MEAL.hunger), ArtLayout.SPOTS.head)
			_bounce()
		"wash":
			_bubbles()
			_bounce()
		"play":
			_notes()
			_bounce()
		"talk":
			_say(Words.saying(Needs.worst_need(_state.nemla.needs) if not _state.is_empty() else "happy"))
			_bounce()


func _bounce() -> void:
	var tween := _nemla.create_tween()
	tween.tween_property(_nemla, "scale", Vector2(0.97, 1.03), 0.15).set_trans(Tween.TRANS_SINE)
	tween.parallel().tween_property(_nemla, "position:y", -14.0, 0.15)
	tween.tween_property(_nemla, "scale", Vector2(1.05, 0.95), 0.15)
	tween.parallel().tween_property(_nemla, "position:y", 0.0, 0.15)
	tween.tween_property(_nemla, "scale", Vector2.ONE, 0.2)


func _say(text: String) -> void:
	_speech_label.text = text
	_speech.visible = true
	_speech.reset_size()
	_speech.position = Vector2(size.x * 0.53, size.y * 0.48 - _speech.size.y)
	_speech.pivot_offset = Vector2(0, _speech.size.y)
	_speech.scale = Vector2(0.9, 0.9)
	var tween := _speech.create_tween()
	tween.tween_property(_speech, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK)
	tween.tween_interval(2.2)
	tween.tween_callback(func(): _speech.visible = false)


func _float(text: String, at: Dictionary) -> void:
	var l := UI.label(text, 20, Color("#2e7d4f"), "display")
	l.add_theme_color_override("font_outline_color", Color.WHITE)
	l.add_theme_constant_override("outline_size", 6)
	l.position = Vector2(at.x - 20, at.y - 14)
	_fx.add_child(l)
	var tween := l.create_tween().set_parallel()
	tween.tween_property(l, "position:y", l.position.y - 36, 1.2).set_ease(Tween.EASE_OUT)
	tween.tween_property(l, "modulate:a", 0.0, 1.2)
	tween.chain().tween_callback(l.queue_free)


func _bite() -> void:
	var at: Dictionary = ArtLayout.SPOTS.mouth
	var bite := _layer("fx/bite.svg", Rect2(at.x - 11, at.y - 7, 22, 14), _fx)
	bite.pivot_offset = Vector2(11, 7)
	var tween := bite.create_tween()
	tween.tween_property(bite, "scale", Vector2.ZERO, 0.7).set_ease(Tween.EASE_IN)
	tween.tween_callback(bite.queue_free)


func _bubbles() -> void:
	for i in 9:
		var r := 8.0 + randf() * 12.0
		var b := _layer("fx/bubble.svg", Rect2(146 + randf() * 68 - r / 2, 220 + randf() * 110 - r / 2, r, r), _fx)
		b.modulate.a = 0.0
		b.pivot_offset = Vector2(r / 2, r / 2)
		b.scale = Vector2(0.3, 0.3)
		var tween := b.create_tween()
		tween.tween_interval(i * 0.07)
		tween.tween_property(b, "modulate:a", 1.0, 0.25)
		tween.parallel().tween_property(b, "scale", Vector2.ONE, 0.4)
		tween.tween_property(b, "position:y", b.position.y - 30, 0.9)
		tween.parallel().tween_property(b, "modulate:a", 0.0, 0.9)
		tween.tween_callback(b.queue_free)


func _notes() -> void:
	var at: Dictionary = ArtLayout.SPOTS.radio
	for i in 4:
		var n := _layer("fx/note.svg", Rect2(at.x - 18 + i * 12, at.y - 20, 12, 15), _fx)
		n.modulate.a = 0.0
		var tween := n.create_tween()
		tween.tween_interval(i * 0.22)
		tween.tween_property(n, "modulate:a", 1.0, 0.3)
		tween.tween_property(n, "position", n.position + Vector2(10, -40), 1.3)
		tween.parallel().tween_property(n, "rotation", 0.26, 1.3)
		tween.parallel().tween_property(n, "modulate:a", 0.0, 1.3)
		tween.tween_callback(n.queue_free)


# Paints the page colour outside rounded corners, so the scene looks like a
# rounded card.
class _Corners:
	extends Control
	var radius := 24.0

	func _init() -> void:
		mouse_filter = MOUSE_FILTER_IGNORE
		set_anchors_and_offsets_preset(PRESET_FULL_RECT)

	func _draw() -> void:
		var r := radius
		for at: Vector2 in [Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.y), Vector2(0, size.y)]:
			var dir := Vector2(1 if at.x == 0 else -1, 1 if at.y == 0 else -1)
			var centre := at + dir * r
			var points := PackedVector2Array([at])
			for i in 9:
				var a := float(i) / 8.0 * PI / 2.0
				points.append(centre + Vector2(-dir.x * cos(a), -dir.y * sin(a)) * r)
			draw_colored_polygon(points, UI.PAGE)

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			queue_redraw()
