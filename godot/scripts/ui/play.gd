# The full-screen layer a job's mini-game runs in. The × button, or
# Android's back button, closes it; a run left before it ends pays nothing
# and the job stays on the board.
extends Control

signal left(finished: bool, levels: Array)

const GAMES := {
	"fix": preload("res://scripts/minigames/fix.gd"),
	"run": preload("res://scripts/minigames/run.gd"),
	"tiles": preload("res://scripts/minigames/tiles.gd"),
	"stack": preload("res://scripts/minigames/stack.gd"),
}

var job := {}  # from Game.job_ticket: game, name, client, pay, run
var _finished := false
var _levels := []
var _closed := false


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	var back := ColorRect.new()
	back.color = UI.INK
	back.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	add_child(back)
	var game: MiniGame = GAMES[job.game].new()
	game.job = job
	game.on_end = func(score: int) -> Dictionary:
		_finished = true
		var result := Game.finish_job(job.run, score)
		_levels = result.get("levels", [])
		return result
	game.on_close = leave
	add_child(game)

	var close := UI.card(Color(1, 1, 1, 0.9), 22, Vector4.ZERO, true)
	close.custom_minimum_size = Vector2(44, 44)
	var x := UI.label("×", 26, UI.INK, "body700")
	x.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	x.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	close.add_child(x)
	var safe_top := 0.0
	var window := Vector2(DisplayServer.window_get_size())
	if window.y > 0:
		safe_top = DisplayServer.get_display_safe_area().position.y * get_viewport_rect().size.y / window.y
	close.position = Vector2(12, 12 + safe_top)
	UI.on_tap(close, leave)
	add_child(close)


func leave() -> void:
	if _closed:
		return
	_closed = true
	left.emit(_finished, _levels)
	queue_free()
