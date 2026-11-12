# A dashed rounded outline, for things still to unlock or buy.
class_name Dashed
extends Control

var color := Color("#c3cfcd")
var fill := Color(0, 0, 0, 0)
var radius := 16.0
var width := 2.0


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)


func _draw() -> void:
	var r := minf(radius, minf(size.x, size.y) / 2.0)
	var w := width / 2.0
	if fill.a > 0.0:
		var s := StyleBoxFlat.new()
		s.bg_color = fill
		s.set_corner_radius_all(int(r))
		draw_style_box(s, Rect2(Vector2.ZERO, size))
	var a := Vector2(w, w)
	var b := size - Vector2(w, w)
	draw_dashed_line(Vector2(a.x + r, a.y), Vector2(b.x - r, a.y), color, width, 6.0)
	draw_dashed_line(Vector2(a.x + r, b.y), Vector2(b.x - r, b.y), color, width, 6.0)
	draw_dashed_line(Vector2(a.x, a.y + r), Vector2(a.x, b.y - r), color, width, 6.0)
	draw_dashed_line(Vector2(b.x, a.y + r), Vector2(b.x, b.y - r), color, width, 6.0)
	draw_arc(Vector2(a.x + r, a.y + r), r - 0.0, PI, PI * 1.5, 6, color, width, true)
	draw_arc(Vector2(b.x - r, a.y + r), r, PI * 1.5, TAU, 6, color, width, true)
	draw_arc(Vector2(b.x - r, b.y - r), r, 0.0, PI * 0.5, 6, color, width, true)
	draw_arc(Vector2(a.x + r, b.y - r), r, PI * 0.5, PI, 6, color, width, true)
