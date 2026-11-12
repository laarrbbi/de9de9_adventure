# A pulsing orange ring around the thing the guide wants tapped. It follows
# its target every frame (the screen may scroll) and lets taps through.
extends Control

var target: Control = null
var clip: Control = null  # only drawn where this control shows the target
var _t := 0.0


func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)


func _process(delta: float) -> void:
	_t += delta
	queue_redraw()


func _draw() -> void:
	if target == null or not is_instance_valid(target) or not target.is_visible_in_tree():
		return
	var rect := target.get_global_rect()
	var transform_inv := get_global_transform().affine_inverse()
	rect = Rect2(transform_inv * rect.position, rect.size)
	if clip and not Rect2(transform_inv * clip.get_global_rect().position, clip.size).intersects(rect):
		return
	var pulse := (sin(_t * TAU / 1.4) + 1.0) / 2.0
	var s := StyleBoxFlat.new()
	s.draw_center = false
	s.set_corner_radius_all(18)
	s.border_color = Color.WHITE
	s.set_border_width_all(2)
	draw_style_box(s, rect.grow(2))
	s.border_color = UI.ORANGE
	s.set_border_width_all(3)
	draw_style_box(s, rect.grow(5))
	s.border_color = Color(UI.ORANGE, 0.5 * (1.0 - pulse))
	s.set_border_width_all(2)
	draw_style_box(s, rect.grow(6 + 8 * pulse))
