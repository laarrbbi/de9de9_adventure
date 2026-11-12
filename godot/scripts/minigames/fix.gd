# From De9De9 Play, played here as a job.
# Nemla Fix: leaks spring up on the pipes. Tap each one before it floods the
# house, but keep your fingers off the sparks. Three mistakes and it's over.
extends MiniGame

const COLS := 3
const ROWS := 4
const TOP := 200.0
const BOTTOM := H - 100.0
const MARGIN := 48.0
const REACH := 40.0  # how close a tap must be to a joint
const WATER := Color("#4aa8e0")
const BOLT := [[4, -16], [-9, 2], [-1, 2], [-4, 16], [9, -3], [1, -3]]


func init_game() -> void:
	title = "Nemla Fix"
	hint = "Tap the leaks, not the sparks"
	s = {"active": [], "puffs": [], "wait": 0.4, "t": 0.0, "lives": 3}


func spot(i: int) -> Vector2:
	return Vector2(MARGIN + (i % COLS) * (W - 2 * MARGIN) / (COLS - 1), TOP + (i / COLS) * (BOTTOM - TOP) / (ROWS - 1))


func _spring() -> void:
	var free := []
	for i in COLS * ROWS:
		if not s.active.any(func(a): return a.i == i):
			free.append(i)
	if free.is_empty():
		return
	var spark := randf() < minf(0.25, 0.08 + s.t / 200.0)
	var life := maxf(0.75, 1.7 - s.t * 0.02)
	s.active.append({"i": free[randi() % free.size()], "spark": spark, "life": life, "max": life})


func _mistake() -> void:
	s.lives -= 1
	beep(200, 0.15, "square", 0.08)
	if s.lives <= 0:
		game_over()


func on_down(x: float, y: float) -> void:
	for a in s.active:
		if spot(a.i).distance_to(Vector2(x, y)) < REACH:
			s.active.erase(a)
			if a.spark:
				_mistake()
				return
			s.puffs.append({"at": spot(a.i), "life": 0.25})
			add_score()
			beep(640 + randf() * 200, 0.05, "sine", 0.1)
			return


func update_game(dt: float) -> void:
	s.t += dt
	s.wait -= dt
	if s.wait <= 0:
		_spring()
		s.wait = maxf(0.38, 1.0 - s.t * 0.012)
	for p in s.puffs:
		p.life -= dt
	s.puffs = s.puffs.filter(func(p): return p.life > 0)
	for a in s.active:
		a.life -= dt
	var gone: Array = s.active.filter(func(a): return a.life <= 0)
	s.active = s.active.filter(func(a): return a.life > 0)
	# a spark just fizzles out; a leak left alone is a mistake
	for a in gone:
		if not a.spark and state == "playing":
			_mistake()


func _pipe(a: Vector2, b: Vector2, width: float, color: Color) -> void:
	draw_line(a, b, color, width)
	draw_circle(a, width / 2, color)
	draw_circle(b, width / 2, color)


func draw_game() -> void:
	sky()
	logo(W / 2, (TOP + BOTTOM) / 2, W * 0.6, Color.WHITE, 0.4)
	# the pipe grid: dark outline first, then the pipe colour on top
	for layer in [[18.0, INK], [12.0, Color("#8ea1ab")]]:
		for r in ROWS:
			_pipe(spot(r * COLS), spot(r * COLS + COLS - 1), layer[0], layer[1])
		for c in COLS:
			_pipe(spot(c), spot((ROWS - 1) * COLS + c), layer[0], layer[1])
	for i in COLS * ROWS:
		circle(spot(i).x, spot(i).y, 15, SLATE, INK)

	for a in s.active:
		var p := spot(a.i)
		var pulse := 1.0 + sin(time * 14) * 0.06
		if a.spark:
			circle(p.x, p.y, 24 * pulse, ORANGE, INK)
			var pts := PackedVector2Array()
			for b in BOLT:
				pts.append(p + Vector2(b[0], b[1]) * 1.05)
			draw_colored_polygon(pts, GOLD)
			pts.append(pts[0])
			draw_polyline(pts, INK, 3.0, true)
		else:
			_drop(p.x, p.y + 3, 19 * pulse)
			draw_colored_polygon(ellipse(p.x - 7, p.y + 6, 4, 7, 0.4), Color(1, 1, 1, 0.75))
		# ring that runs down as the leak (or spark) is about to go
		draw_arc(p, 33, -PI / 2, -PI / 2 + TAU * a.life / a.max, 32, RED if a.spark else Color.WHITE, 4.0, true)

	for puff in s.puffs:
		var k: float = puff.life / 0.25
		draw_arc(puff.at, 20 + (1 - k) * 22, 0, TAU, 32, Color(1, 1, 1, k), 4.0, true)

	for i in 3:
		heart(W - 26 - i * 28, 96, 22, i < s.lives)


func _drop(x: float, y: float, r: float) -> void:
	var pts := cubic(Vector2(x, y - r * 1.45), Vector2(x + r * 1.25, y - r * 0.1), Vector2(x + r, y + r), Vector2(x, y + r))
	pts.append_array(cubic(Vector2(x, y + r), Vector2(x - r, y + r), Vector2(x - r * 1.25, y - r * 0.1), Vector2(x, y - r * 1.45)))
	draw_colored_polygon(pts, WATER)
	draw_polyline(pts, INK, 3.0, true)
