# A rounded progress bar: `value` from 0 to 1.
class_name Bar
extends Control

var track := Color("#eef2f1")
var fill := Color("#65cbc4")
var value := 0.0:
	set(v):
		value = clampf(v, 0.0, 1.0)
		queue_redraw()


func _init() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE


func _draw() -> void:
	var r := size.y / 2.0
	_pill(Rect2(Vector2.ZERO, size), track, r)
	if value > 0.0:
		_pill(Rect2(Vector2.ZERO, Vector2(maxf(size.y, size.x * value), size.y)), fill, r)


func _pill(rect: Rect2, color: Color, r: float) -> void:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(int(r))
	s.anti_aliasing = true
	draw_style_box(s, rect)
