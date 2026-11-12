# From De9De9 Play, played here as a job.
# Nemla Run: three-lane endless runner. Swipe or tap a side to change lane.
extends MiniGame

const PLAYER_Y := H - 150.0
const R := 22.0
const START_SPEED := 260.0
const MAX_SPEED := 560.0


func init_game() -> void:
	title = "Nemla Run"
	hint = "Swipe to change lane"
	s = {"lane": 1, "x": lane_x(1), "rows": [], "speed": START_SPEED, "scroll": 0.0, "t": 0.0, "safe": 1}


func lane_w() -> float:
	return minf(96, (W - 24) / 3)


func lane_x(i: int) -> float:
	return W / 2 + (i - 1) * lane_w()


func _move(dir: int) -> void:
	var lane := clampi(s.lane + dir, 0, 2)
	if lane != s.lane:
		beep(600, 0.04, "sine", 0.06)
	s.lane = lane


func on_swipe(dir: String) -> void:
	if dir == "left":
		_move(-1)
	elif dir == "right":
		_move(1)


func on_tap(x: float, _y: float) -> void:
	_move(-1 if x < W / 2 else 1)


func update_game(dt: float) -> void:
	s.t += dt
	s.speed = minf(MAX_SPEED, START_SPEED + s.t * 5)
	s.scroll += s.speed * dt
	s.x += (lane_x(s.lane) - s.x) * minf(1, dt * 18)
	for row in s.rows:
		row.y += s.speed * dt
	if not s.rows.is_empty() and s.rows[0].y > H + 60:
		s.rows.pop_front()

	# Always leave a free lane next to the previous free one, so every row is reachable.
	if s.rows.is_empty() or s.rows.back().y > maxf(240, s.speed * 0.55):
		s.safe = clampi(s.safe + randi() % 3 - 1, 0, 2)
		var blocked := []
		for i in 3:
			blocked.append(i != s.safe and randf() < 0.65)
		if not blocked.has(true):
			blocked[(s.safe + 1) % 3] = true
		s.rows.append({"y": -40.0, "blocked": blocked, "passed": false})

	for row in s.rows:
		if not row.passed and row.y > PLAYER_Y + 44:
			row.passed = true
			add_score()
		if absf(row.y - PLAYER_Y) > 34:
			continue
		for i in 3:
			if row.blocked[i] and absf(lane_x(i) - s.x) < 32:
				game_over()
				return


func draw_game() -> void:
	var lw := lane_w()
	var left := W / 2 - lw * 1.5
	draw_rect(Rect2(0, 0, W, H), Color("#bfeae6"))
	draw_rect(Rect2(left, 0, lw * 3, H), SLATE)
	draw_rect(Rect2(left - 6, 0, 6, H), TEAL)
	draw_rect(Rect2(left + lw * 3, 0, 6, H), TEAL)
	for i in range(1, 3):
		var y := fmod(s.scroll, 56.0) - 56
		while y < H:
			draw_rect(Rect2(left + lw * i - 2, y, 4, 28), Color(1, 1, 1, 0.7))
			y += 56

	for row in s.rows:
		for i in 3:
			if not row.blocked[i]:
				continue
			var x := lane_x(i) - 28
			var y: float = row.y - 20
			box(x, y, 56, 40, 8, RED, RED_DARK)
			draw_rect(Rect2(x + 6, y + 14, 44, 10), Color.WHITE)

	draw_colored_polygon(ellipse(s.x, PLAYER_Y + R + 6, R, 6), Color(INK, 0.3))
	face(s.x, PLAYER_Y + sin(time * 14) * 2, R, (lane_x(s.lane) - s.x) * 0.006)
