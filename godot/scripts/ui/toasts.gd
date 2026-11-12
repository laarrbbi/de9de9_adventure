# Short messages that float above the tab bar and fade out by themselves.
extends VBoxContainer

const MAX := 3
const SHOW := 2.8


func _ready() -> void:
	add_theme_constant_override("separation", 8)
	alignment = BoxContainer.ALIGNMENT_END
	mouse_filter = MOUSE_FILTER_IGNORE


func show_toast(text: String, kind := "") -> void:
	var gold := kind == "gold"
	var box := UI.card(UI.GOLD if gold else UI.INK, 14, Vector4(16, 10, 16, 10), true)
	var l := UI.label(text, 14, UI.INK if gold else Color.WHITE, "body700")
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = minf(320.0, 24.0 + text.length() * 7.6)
	box.add_child(l)
	var holder := UI.centered(box)
	add_child(holder)
	while get_child_count() > MAX:
		get_child(0).queue_free()
		remove_child(get_child(0))
	holder.modulate.a = 0.0
	var tween := holder.create_tween()
	tween.tween_property(holder, "modulate:a", 1.0, 0.2)
	tween.tween_interval(SHOW)
	tween.tween_property(holder, "modulate:a", 0.0, 0.3)
	tween.tween_callback(holder.queue_free)
