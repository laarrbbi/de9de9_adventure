extends TestCase

var last := always(0.99)


func test_guide_walks_through_the_loop() -> void:
	var now := day(3)
	var s := SaveGame.new_game(now)
	Jobs.refresh_board(s, now, last)
	Guide.first_job(s)
	eq([s.work.board[0].job, s.work.board[0].client], ["fixPipe", "snail"], "snail's leak first")
	eq(Guide.step(s).id, "eat", "step 1")
	Care.eat(s)
	var coins: int = s.coins
	var r := Guide.advance(s)
	eq([r.steps, r.coins, r.finished], [1, Economy.GUIDE_STEP_COINS, false], "one step")
	eq(s.coins, coins + Economy.GUIDE_STEP_COINS, "paid")
	eq(Guide.step(s).id, "job", "step 2")
	eq(Guide.advance(s).steps, 0, "nothing new")
	Jobs.finish_job(s, Jobs.ticket(s, 0), 10, now)
	Garden.plant(s, 0, "mint", now)
	eq(Guide.advance(s).steps, 2, "two at once")
	eq(Guide.step(s).id, "harvest", "harvest step")
	eq(Guide.waiting(s, now), true, "mint growing")
	eq(Guide.waiting(s, now + 2 * MIN), false, "mint ready")
	Garden.harvest(s, 0, now + 2 * MIN)
	Garden.sell(s, "mint", now + 2 * MIN)
	Guide.advance(s)
	eq(Guide.step(s).id, "goal", "goal")
	eq(Guide.advance(s).steps, 0, "the goal waits for the player")
	eq(Guide.close(s), true, "closed")
	eq(Guide.step(s), {}, "over")
	eq(Guide.close(s), false, "closed once")


func test_old_save_skips_done_steps_without_paying() -> void:
	var s := SaveGame.new_game(day(3))
	s.stats.meals = 4
	s.work.done = 3
	var coins: int = s.coins
	eq(Guide.advance(s, false).steps, 2, "skipped")
	eq(s.coins, coins, "not paid")
	eq(Guide.step(s).id, "plant", "at plant")


func test_first_job_only_while_needed() -> void:
	var s := SaveGame.new_game(day(3))
	Jobs.refresh_board(s, day(3), last)
	s.guide.step = 2
	Guide.first_job(s)
	ok(s.work.board[0].client != "snail", "board untouched")
