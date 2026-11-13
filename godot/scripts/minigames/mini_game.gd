# The shell every job mini-game runs in, ported from the web version's
# engine.js (itself from De9De9 Play): the frame loop, input, and the
# ready / playing / done flow. A game extends this and fills in init_game,
# update_game and draw_game, plus any of the input hooks. Instead of paying
# into a wallet, a finished run asks the job what it pays (`on_end(score)`)
# and shows that; the next tap hands back (`on_close`).
#
# World units: the playfield is always H tall; its width W follows the screen.
class_name MiniGame
extends Control

const TEAL := Color("#65cbc4")
const RED := Color("#e7464e")
const RED_DARK := Color("#b3323a")
const ORANGE := Color("#ff8515")
const SLATE := Color("#455a64")
const INK := Color("#2f3f47")
const GOLD := Color("#ffc93c")
const H := 640.0
const CLOSE_DELAY := 0.8
const SWIPE := 22.0

# Set by each game.
var title := ""
var hint := ""
var first_tap_plays := false  # the tap that starts the run is also a move
var custom_start := false     # can_start() picks which first tap starts it

# Set by the play screen: { name, client, pay: [min, max] }, and what a
# finished run does.
var job := {}
var on_end: Callable
var on_close: Callable

var W := 360.0
var state := "ready"
var score := 0
var time := 0.0
var done_for := 0.0
var result := {}
var s := {}  # the run's own state

var _k := 1.0
var _down = null
var _head: Texture2D
var _logo: Texture2D


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	_head = UI.tex("res://assets/nemla-head.png")
	_logo = UI.tex("res://assets/logo-mark.png")
	resized.connect(_fit)
	_fit()
	init_game()


func _fit() -> void:
	if size.y <= 0:
		return
	_k = size.y / H
	W = size.x / _k


# --- What a game fills in ---------------------------------------------------
func init_game() -> void: pass
func update_game(_dt: float) -> void: pass
func draw_game() -> void: pass
func idle(_dt: float) -> void: pass        # the ready screen
func after(_dt: float) -> void: pass       # once the run is over
func can_start(_x: float, _y: float) -> bool: return true
func on_down(_x: float, _y: float) -> void: pass
func on_tap(_x: float, _y: float) -> void: pass
func on_swipe(_dir: String) -> void: pass


func add_score(n := 1) -> void:
	score += n


func game_over() -> void:
	if state != "playing":
		return
	state = "done"
	done_for = 0.0
	beep(140, 0.3, "saw", 0.1)
	result = on_end.call(score) if on_end.is_valid() else {"coins": 0, "rating": "ok", "bonus": 0.0, "tired": false}


func beep(freq: float, duration := 0.08, kind := "square", volume := 0.08) -> void:
	Sfx.beep(freq, duration, kind, volume)


# --- The loop ---------------------------------------------------------------
func _process(delta: float) -> void:
	var dt := minf(delta, 1.0 / 30.0)
	time += dt
	if state == "ready":
		idle(dt)
	elif state == "playing":
		update_game(dt)
	else:
		done_for += dt
		after(dt)
	queue_redraw()


func _draw() -> void:
	_world()
	draw_game()
	if state == "ready":
		_draw_ready()
	elif state == "playing":
		text(str(score), W / 2, 110, 60, Color.WHITE, INK)
	else:
		_draw_done()


func _world() -> void:
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(_k, _k))


# --- Input --------------------------------------------------------------------
# A press starts the run from the ready screen, and collects the pay once the
# run is done. Returns whether the game itself should handle it.
func _press() -> bool:
	if state == "done":
		if done_for > CLOSE_DELAY and on_close.is_valid():
			on_close.call()
		return false
	if state == "ready":
		state = "playing"
	return true


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		var p: Vector2 = event.position / _k
		if event.pressed:
			if state == "ready" and not can_start(p.x, p.y):
				return
			if not _press():
				return
			_down = {"p": p, "swiped": false}
			on_down(p.x, p.y)
		else:
			if _down != null and not _down.swiped and state == "playing":
				on_tap(_down.p.x, _down.p.y)
			_down = null
		accept_event()
	elif event is InputEventMouseMotion and _down != null and state == "playing":
		var p: Vector2 = event.position / _k
		var d: Vector2 = p - _down.p
		if maxf(absf(d.x), absf(d.y)) >= SWIPE:
			# re-anchor so one long drag can chain several swipes
			_down = {"p": p, "swiped": true}
			on_swipe(("right" if d.x > 0 else "left") if absf(d.x) > absf(d.y) else ("down" if d.y > 0 else "up"))


func _unhandled_key_input(event: InputEvent) -> void:
	if not event.pressed or event.echo:
		return
	var dirs := {KEY_LEFT: "left", KEY_RIGHT: "right", KEY_UP: "up", KEY_DOWN: "down"}
	if not dirs.has(event.keycode) and event.keycode not in [KEY_SPACE, KEY_ENTER]:
		return
	if not _press():
		return
	if dirs.has(event.keycode):
		on_swipe(dirs[event.keycode])
	else:
		on_down(W / 2, H / 2)
		on_tap(W / 2, H / 2)


# --- Drawing helpers, in world units -------------------------------------------
# Text is drawn at the screen's real size so it stays sharp.
func text(str_: String, x: float, y: float, size_: float, color: Color, stroke = null, align := "center", weight := 800) -> void:
	var font := UI.font("body%d" % weight)
	var px := int(round(size_ * _k))
	var width := font.get_string_size(str_, HORIZONTAL_ALIGNMENT_LEFT, -1, px).x
	var at := Vector2(x * _k, y * _k)
	if align == "center":
		at.x -= width / 2
	elif align == "right":
		at.x -= width
	draw_set_transform_matrix(Transform2D.IDENTITY)
	if stroke != null:
		draw_string_outline(font, at, str_, HORIZONTAL_ALIGNMENT_LEFT, -1, px, int(px / 5.0 * 2.0), stroke)
	draw_string(font, at, str_, HORIZONTAL_ALIGNMENT_LEFT, -1, px, color)
	_world()


func text_width(str_: String, size_: float, weight := 800) -> float:
	return UI.font("body%d" % weight).get_string_size(str_, HORIZONTAL_ALIGNMENT_LEFT, -1, int(round(size_ * _k))).x / _k


# Largest font size (up to `size_`) at which the text fits in max_w.
func fit(str_: String, size_: float, max_w: float, weight := 800) -> float:
	var w := text_width(str_, size_, weight)
	return floorf(size_ * max_w / w) if w > max_w else size_


func card(x: float, y: float, w: float, h: float, radius: float, fill: Color) -> void:
	var st := StyleBoxFlat.new()
	st.bg_color = fill
	st.set_corner_radius_all(int(radius))
	st.shadow_color = Color(0.184, 0.247, 0.278, 0.25)
	st.shadow_size = 14
	st.shadow_offset = Vector2(0, 6)
	st.anti_aliasing = true
	draw_style_box(st, Rect2(x, y, w, h))


func box(x: float, y: float, w: float, h: float, radius: float, fill: Color, stroke = null) -> void:
	var st := StyleBoxFlat.new()
	st.bg_color = fill
	st.set_corner_radius_all(int(radius))
	st.anti_aliasing = true
	if stroke != null:
		st.border_color = stroke
		st.set_border_width_all(3)
	draw_style_box(st, Rect2(x, y, w, h))


func sky(top := Color("#7fd4ce"), bottom := Color("#eefaf9")) -> void:
	draw_polygon(PackedVector2Array([Vector2(0, 0), Vector2(W, 0), Vector2(W, H), Vector2(0, H)]),
		PackedColorArray([top, top, bottom, bottom]))


func coin(x: float, y: float, r: float) -> void:
	draw_circle(Vector2(x, y), r, GOLD)
	draw_arc(Vector2(x, y), r, 0, TAU, 24, Color("#e09a00"), r * 0.22, true)


func circle(x: float, y: float, r: float, fill: Color, stroke = null, width := 3.0) -> void:
	draw_circle(Vector2(x, y), r, fill)
	if stroke != null:
		draw_arc(Vector2(x, y), r, 0, TAU, 32, stroke, width, true)


func heart(x: float, y: float, size_: float, full: bool) -> void:
	var k := size_ / 20.0
	var pts := cubic(Vector2(x, y + 7 * k), Vector2(x - 12 * k, y - 1 * k), Vector2(x - 7 * k, y - 11 * k), Vector2(x, y - 5 * k))
	pts.append_array(cubic(Vector2(x, y - 5 * k), Vector2(x + 7 * k, y - 11 * k), Vector2(x + 12 * k, y - 1 * k), Vector2(x, y + 7 * k)))
	draw_colored_polygon(pts, RED if full else Color(INK, 0.2))


# Points along a cubic Bézier curve.
static func cubic(a: Vector2, b: Vector2, c: Vector2, d: Vector2, steps := 12) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in steps + 1:
		var t := float(i) / steps
		var u := 1.0 - t
		pts.append(a * u * u * u + b * 3 * u * u * t + c * 3 * u * t * t + d * t * t * t)
	return pts


static func ellipse(x: float, y: float, rx: float, ry: float, rot := 0.0, steps := 24) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in steps:
		var a := TAU * i / steps
		pts.append(Vector2(x, y) + Vector2(cos(a) * rx, sin(a) * ry).rotated(rot))
	return pts


# The De9De9 mark, tinted, centred on (x, y) and `width` wide.
func logo(x: float, y: float, width: float, color: Color, alpha: float) -> void:
	var height := width * _logo.get_height() / _logo.get_width()
	draw_texture_rect(_logo, Rect2(x - width / 2, y - height / 2, width, height), false, Color(color, alpha))


# Nemla's head with the face centred on (x, y); r is the hitbox radius.
func face(x: float, y: float, r: float, rotation := 0.0) -> void:
	var w := r * 2.67
	var h := w * _head.get_height() / _head.get_width()
	draw_set_transform(Vector2(x, y) * _k, rotation, Vector2(_k, _k))
	draw_texture_rect(_head, Rect2(-w / 2, -h * 0.64, w, h), false)
	_world()


# --- Ready and done cards -------------------------------------------------------
# Titles are shown logo-style in two colours: split at the space, or in half.
func _draw_ready() -> void:
	var cut := title.find(" ") + 1 if title.contains(" ") else ceili(title.length() / 2.0)
	var a := title.substr(0, cut)
	var b := title.substr(cut)
	var size_ := fit(title, 44, W - 84)
	var total := text_width(title, size_)
	var x := (W - total) / 2
	card(x - 26, 96, total + 52, 74, 37, Color.WHITE)
	text(a, x, 133 + size_ * 0.35, size_, RED, null, "left")
	text(b, x + text_width(a, size_), 133 + size_ * 0.35, size_, TEAL, null, "left")

	var pw := minf(300, W - 40)
	var px := (W - pw) / 2
	var py := 200.0
	card(px, py, pw, 96, 20, Color.WHITE)
	text(job.get("name", ""), W / 2, py + 36, fit(job.get("name", ""), 20, pw - 32), INK)
	text(job.get("client", ""), W / 2, py + 58, 14, SLATE, null, "center", 600)
	var range_: Array = job.get("pay", [0, 0])
	var pay := Words.t("play.pay", {"min": Words.num(range_[0]), "max": Words.num(range_[1])})
	var left := W / 2 - (text_width(pay, 15) + 22) / 2
	coin(left + 8, py + 76, 8)
	text(pay, left + 22, py + 82, 15, Color("#b06f00"), null, "left")

	text(hint, W / 2, H * 0.62, fit(hint, 24, W - 32), Color.WHITE, INK)
	# a game that needs a particular first tap says so in its hint, and in
	# one whose first tap already plays the hint is enough
	if not custom_start and not first_tap_plays:
		text(Words.t("play.start"), W / 2, H * 0.62 + 40, 16, Color.WHITE, INK, "center", 700)


func _draw_done() -> void:
	var notes := []
	if result.get("bonus", 0.0) > 0:
		notes.append(Words.t("play.streak", {"pct": roundi(result.bonus * 100)}))
	if result.get("tired", false):
		notes.append(Words.t("play.tired"))
	if result.get("sick", false):
		notes.append(Words.t("play.sick"))
	var pw := minf(280, W - 40)
	var ph := 222.0 + notes.size() * 20
	var x := (W - pw) / 2
	var y := 150.0
	card(x, y, pw, ph, 24, Color.WHITE)
	text(Words.t("play.done"), W / 2, y + 46, 30, TEAL)
	text(Words.t("rating." + result.get("rating", "ok")), W / 2, y + 74, 16, SLATE, null, "center", 700)
	text(Words.t("play.score"), x + 28, y + 118, 18, SLATE, null, "left", 600)
	text(str(score), x + pw - 28, y + 118, 24, SLATE, null, "right")
	text(Words.t("play.coins"), x + 28, y + 164, 18, SLATE, null, "left", 600)
	coin(x + pw - 38, y + 157, 11)
	text("+" + Words.num(result.get("coins", 0)), x + pw - 56, y + 166, 30, Color("#d98200"), null, "right")
	for i in notes.size():
		text(notes[i], W / 2, y + 204 + i * 20, 13, SLATE, null, "center", 600)
	if done_for > CLOSE_DELAY:
		var bw := 200.0
		var bx := (W - bw) / 2
		var by := y + ph + 22
		_capsule(bx, by, bw, 54)
		text(Words.t("play.collect"), W / 2, by + 35, 20, Color.WHITE, null, "center", 700)


# The Collect button: a capsule from red to orange.
func _capsule(x: float, y: float, w: float, h: float) -> void:
	var st := StyleBoxFlat.new()
	st.bg_color = Color(0, 0, 0, 0)
	st.shadow_color = Color(0.184, 0.247, 0.278, 0.25)
	st.shadow_size = 14
	st.shadow_offset = Vector2(0, 6)
	st.set_corner_radius_all(int(h / 2))
	draw_style_box(st, Rect2(x, y, w, h))
	var r := h / 2
	var pts := PackedVector2Array()
	for i in 13:
		var a := PI / 2 + PI * i / 12.0
		pts.append(Vector2(x + r + cos(a) * r, y + r + sin(a) * r))
	for i in 13:
		var a := -PI / 2 + PI * i / 12.0
		pts.append(Vector2(x + w - r + cos(a) * r, y + r + sin(a) * r))
	var colors := PackedColorArray()
	for p in pts:
		colors.append(RED.lerp(ORANGE, clampf((p.x - x) / (w * 1.45), 0, 1)))
	draw_polygon(pts, colors)
