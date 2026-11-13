# Opens the game and takes screenshots of each screen, for checking how it
# looks. Needs a display (on a server: xvfb-run). Writes PNGs to the folder
# given after "--" (default /tmp/de9de9-shots):
#   godot --path godot --resolution 780x1688 -s res://tests/shots.gd -- /tmp/shots
# It starts from a fresh game, then from a saved-up one (it never writes
# the player's save).
extends SceneTree

var out := "/tmp/de9de9-shots"
var main: Control
var problems := []


func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	if not args.is_empty():
		out = args[0]
	DirAccess.make_dir_recursive_absolute(out)
	_run.call_deferred()


func _frames(n := 6) -> void:
	for i in n:
		await process_frame


func _shot(name: String) -> void:
	await _frames(4)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("%s/%s.png" % [out, name])
	print("shot ", name)


func _game(state: Dictionary) -> void:
	var game = root.get_node("Game")
	game.set_process(false)
	for child in game.get_children():
		if child is Timer and child.wait_time == 15.0:
			child.stop()  # never save over the player's game
	game.start({"state": state, "fresh": false})
	if main:
		main.queue_free()
		await _frames(2)
	main = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await _frames(8)


func _run() -> void:
	var game = root.get_node("Game")
	var now := Clock.now()

	# A new game: the guide, the first job, the garden.
	await _game(SaveGame.new_game(now))
	await _shot("1_home_new")
	_check(main.find_children("*", "Label", true, false).any(func(l): return l.text.begins_with("STEP 1")), "the guide to start at step 1")
	game.home_act("eat")
	_check(game.state.coins == 200 - 5 + Economy.GUIDE_STEP_COINS, "eating to cost 5 and the guide step to pay 20")
	await _shot("2_home_after_eat")
	main.show_screen("work")
	await _shot("3_work")
	main.show_screen("garden")
	await _shot("4_garden_new")

	# A job: the ready card, playing, and the result.
	main.show_screen("work")
	main._start_job(0)
	await _frames(10)
	await _shot("5_job_ready")
	var play: Node = main._play
	var mini = play.get_child(1)
	_check(mini.size.is_equal_approx(main.size), "the job to cover the whole screen")
	var before: int = game.state.coins
	mini.state = "playing"
	await _frames(90)
	await _shot("6_job_playing")
	mini.score = 18
	mini.game_over()
	await _frames(70)
	await _shot("7_job_done")
	_check(game.state.coins > before, "the job to pay")
	play.leave()
	await _frames(4)
	_check(game.state.work.board[0].done, "the job to show as done")

	# The guide's friend step: Snail visits the garden and gets a gift.
	game.state.guide.step = Guide.STEPS.find(Guide.STEPS.filter(func(x): return x.id == "friend")[0])
	game._tick()
	main.show_screen("garden")
	_check(not Friends.visitor(game.state, Clock.now()).is_empty(), "Snail to visit at the guide's friend step")
	await _shot("6b_garden_visitor")
	main.screens.garden._picking = true
	main.render()
	await _shot("6c_gift_picker")
	game.gift("snail", "box")
	_check(Friends.is_friend(game.state, "snail"), "a gift to make Snail a friend")
	_check(Guide.step(game.state).get("id", "") == "goal", "the guide to move on to the goal")

	# A saved-up game in the villa, with a full garden and the shop.
	var rich := SaveGame.new_game(now - 9 * Clock.DAY_MS)
	rich.coins = 60000
	rich.totalEarned = 90000
	rich.nemla.level = 6
	rich.nemla.outfit = "sunglasses"
	rich.nemla.needs = {"hunger": 25.0, "energy": 80.0, "clean": 80.0, "fun": 80.0}
	rich.home = {"level": 4, "rooms": ["kitchen", "bathroom", "bedroom", "musicRoom"]}
	rich.owned = {"cars": ["scooter"], "equipment": ["sprinkler"], "clothes": ["sunglasses", "redCap"]}
	rich.guide.step = Guide.STEPS.size()
	rich.lastSeen = now
	var plots := []
	for p in [["mint", -10, 20], ["wheat", -70, -10], ["tomato", -120, 60], ["", 0, 0], ["mint", -40, -10]]:
		plots.append({"crop": p[0], "plantedAt": now + p[1] * 60000 if p[0] != "" else 0, "readyAt": now + p[2] * 60000 if p[0] != "" else 0})
	rich.garden.plots = plots
	rich.garden.barn = {"mint": 4, "wheat": 2, "tomato": 0}
	rich.garden.planted = {"mint": 3, "wheat": 1, "tomato": 1}
	rich.friends = {"snail": {"points": 9, "giftDay": "", "callDay": ""}, "beetle": {"points": 4, "giftDay": "", "callDay": ""},
		"ladybug": {"points": 1, "giftDay": "", "callDay": ""}, "bee": {"points": 16, "giftDay": "", "callDay": ""}}
	rich.problem = {"kind": "leak", "since": now, "nextAt": 0}
	rich.visitor = {"bug": "", "until": 0, "nextAt": now + 3600000}
	await _game(rich)
	await _shot("8_home_villa")
	main._scroll.scroll_vertical = 300
	await _shot("8b_home_problem")
	_check(Care.wash(game.state).why == "leak", "no bath while the pipe leaks")
	game.fix_problem("friend")
	_check(Friends.problem(game.state) == "", "Beetle to fix the leak")
	main.show_screen("friends")
	await _shot("13_friends")
	var coins: int = game.state.coins
	game.call_friend("beetle")
	_check(game.state.coins == coins + Economy.FAVOR.coins * 2, "Beetle's call to bring coins")
	main.screens.friends._toggle("snail")
	await _shot("14_friends_gift")
	main._scroll.scroll_vertical = 2000
	await _shot("15_friends_strangers")
	game.state.problem.kind = "flatTire"
	main.show_screen("work")
	await _shot("16_work_flat_tire")
	game.state.problem.kind = ""
	game.touch()
	main.show_screen("garden")
	await _shot("9_garden_full")
	main.show_screen("shop")
	await _shot("10_shop_homes")
	main.screens.shop.open("clothes")
	await _shot("11_shop_clothes")
	main.show_screen("work")
	await _shot("12_work_villa")
	for problem in problems:
		print("PROBLEM: expected ", problem)
	print("checks done, %d problems" % problems.size())
	quit(1 if problems else 0)


func _check(ok: bool, what: String) -> void:
	if not ok:
		problems.append(what)
