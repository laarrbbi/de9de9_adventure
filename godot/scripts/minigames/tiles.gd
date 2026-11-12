# From De9De9 Play, played here as a job.
# Nemla Tiles: tap every dark tile before it slides off. Touch a white one and it's over.
extends MiniGame

const COLS := 4
const TILE_H := 130.0
const START_SPEED := 230.0
const MAX_SPEED := 640.0

# The tiles play a tune, one note per tile, looped. This one is original,
# written in a D Hijaz scale for a raï feel. Numbers are steps of the scale.
const SCALE := [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33]
const TUNE := [
	1, 1, 3, 4, 5, 5, 4, 3, 4, 5, 6, 5, 4, 3, 2, 1,
	5, 5, 6, 7, 8, 8, 7, 6, 5, 6, 5, 4, 3, 2, 3, 1,
	1, 3, 4, 5, 6, 5, 4, 3, 2, 3, 4, 3, 2, 1, 2, 1,
	8, 7, 6, 5, 6, 5, 4, 3, 4, 3, 2, 1, 2, 3, 2, 1,
]


# n is the tile's place in the run, which picks its note.
func _row(y: float, n: int) -> Dictionary:
	return {"y": y, "col": randi() % COLS, "hit": false, "note": SCALE[TUNE[n % TUNE.size()] - 1]}


func init_game() -> void:
	title = "Nemla Tiles"
	hint = "Tap the dark tile to start"
	custom_start = true
	s = {"rows": [], "t": 0.0, "miss": {}}
	var y := H - 2 * TILE_H
	while y > -2 * TILE_H:
		s.rows.append(_row(y, s.rows.size()))
		y -= TILE_H
	s.made = s.rows.size()


# A stray first tap on white would end the run instantly, so only the tile starts it.
func can_start(x: float, y: float) -> bool:
	var first: Dictionary = s.rows[0]
	return floori(x / (W / COLS)) == first.col and y >= first.y and y < first.y + TILE_H


func on_down(x: float, y: float) -> void:
	var col := mini(COLS - 1, floori(x / (W / COLS)))
	for row in s.rows:
		if y >= row.y and y < row.y + TILE_H:
			if row.col == col and row.hit:
				return
			if row.col != col:
				s.miss = {"row": row, "col": col}
				game_over()
				return
			row.hit = true
			add_score()
			Sfx.note(row.note)
			return


func update_game(dt: float) -> void:
	s.t += dt
	var speed := minf(MAX_SPEED, START_SPEED + s.t * 9)
	for r in s.rows:
		r.y += speed * dt
	var bottom: Dictionary = s.rows[0]
	if bottom.y > H - 30 and not bottom.hit:
		s.miss = {"row": bottom, "col": bottom.col}
		game_over()
		return
	if bottom.y > H:
		s.rows.pop_front()
	var top: Dictionary = s.rows.back()
	if top.y > -TILE_H:
		s.rows.append(_row(top.y - TILE_H, s.made))
		s.made += 1


func draw_game() -> void:
	var cw := W / COLS
	draw_rect(Rect2(0, 0, W, H), Color.WHITE)
	for r in s.rows:
		draw_rect(Rect2(r.col * cw, r.y, cw, TILE_H), Color(TEAL, 0.45) if r.hit else INK)
		if not r.hit:
			logo(r.col * cw + cw / 2, r.y + TILE_H / 2, cw * 0.66, TEAL, 0.9)
	if not s.miss.is_empty():
		draw_rect(Rect2(s.miss.col * cw, s.miss.row.y, cw, TILE_H), RED)
	for c in range(1, COLS):
		draw_rect(Rect2(c * cw - 1, 0, 2, H), TEAL)
	for r in s.rows:
		draw_rect(Rect2(0, r.y - 1, W, 2), TEAL)
