# From De9De9 Play, played here as a job.
# De9a Stack: tap to drop the sliding block. Whatever overhangs is cut off.
extends MiniGame

const BH := 28.0
const BASE_Y := H - 120.0
const PERFECT := 5.0
const GRAVITY := 1600.0


static func color(i: int) -> Color:
	return Color.from_hsv(fmod(176.0 + i * 12.0, 360.0) / 360.0, 0.5, 0.82)


func init_game() -> void:
	title = "De9a Stack"
	hint = "Tap to drop"
	# The block already slides on the ready screen, so the first tap is a real drop.
	first_tap_plays = true
	s = {"blocks": [{"x": W / 2 - 80, "w": 160.0}], "scraps": [], "cam": 0.0, "cur": {}}
	_spawn()


func _spawn() -> void:
	var top: Dictionary = s.blocks.back()
	var from_left: bool = s.blocks.size() % 2 == 0
	s.cur = {"x": -top.w if from_left else W, "w": top.w, "dir": 1 if from_left else -1}


func _slide(dt: float) -> void:
	var cur: Dictionary = s.cur
	var speed := minf(430, 150 + s.blocks.size() * 7)
	cur.x += cur.dir * speed * dt
	if cur.x < -cur.w * 0.6:
		cur.dir = 1
	if cur.x > W - cur.w * 0.4:
		cur.dir = -1


# Camera follow and falling scraps; keeps running after a game over.
func _settle(dt: float) -> void:
	s.cam += (maxf(0, s.blocks.size() * BH - 220) - s.cam) * minf(1, dt * 6)
	for p in s.scraps:
		p.vy += GRAVITY * dt
		p.y += p.vy * dt
	s.scraps = s.scraps.filter(func(p): return p.y + s.cam < H + 40)


func on_down(_x: float, _y: float) -> void:
	var cur: Dictionary = s.cur
	if cur.is_empty():
		return
	var top: Dictionary = s.blocks.back()
	var y: float = BASE_Y - s.blocks.size() * BH
	var left: float = maxf(cur.x, top.x)
	var right: float = minf(cur.x + cur.w, top.x + top.w)
	if right - left <= 0:
		s.scraps.append({"x": cur.x, "y": y, "w": cur.w, "vy": 0.0, "i": s.blocks.size()})
		s.cur = {}
		game_over()
		return
	if absf(cur.x - top.x) < PERFECT:
		s.blocks.append({"x": top.x, "w": top.w})
		beep(980, 0.08, "sine", 0.1)
	else:
		# the part hanging over the edge falls away
		var cut_x: float = cur.x if cur.x < top.x else right
		s.scraps.append({"x": cut_x, "y": y, "w": cur.w - (right - left), "vy": 0.0, "i": s.blocks.size()})
		s.blocks.append({"x": left, "w": right - left})
		beep(440, 0.06, "square", 0.07)
	add_score()
	_spawn()


func idle(dt: float) -> void:
	_slide(dt)


func update_game(dt: float) -> void:
	_slide(dt)
	_settle(dt)


func after(dt: float) -> void:
	_settle(dt)


func draw_game() -> void:
	sky()
	for i in s.blocks.size():
		var b: Dictionary = s.blocks[i]
		box(b.x, BASE_Y - i * BH + s.cam, b.w, BH, 5, color(i), INK)
	for p in s.scraps:
		box(p.x, p.y + s.cam, p.w, BH, 5, color(p.i), INK)
	if not s.cur.is_empty():
		box(s.cur.x, BASE_Y - s.blocks.size() * BH + s.cam, s.cur.w, BH, 5, color(s.blocks.size()), INK)
