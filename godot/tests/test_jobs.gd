extends TestCase

var first := always(0.0)
var fix := Jobs.job_by_id("fixPipe")


func game(now := day(3)) -> Dictionary:
	var s := SaveGame.new_game(now)
	s.nemla.needs = {"hunger": 80.0, "energy": 80.0, "clean": 80.0, "fun": 50.0}
	Jobs.refresh_board(s, now, first)
	return s


func test_new_day_brings_a_board_nemla_can_take() -> void:
	var s := SaveGame.new_game(day(3))
	eq(Jobs.refresh_board(s, day(3)), true, "new board")
	eq(s.work.board.size(), Economy.JOBS_PER_DAY, "size")
	for entry in s.work.board:
		ok(entry.job != "wedding", "no level 2 job on a level 1 board")
		ok(entry.job != "buildRoom", "no job that needs a toolbox")
		eq(entry.done, false, "not done")
	eq(Jobs.refresh_board(s, day(3, 23)), false, "same day, same board")
	eq(Jobs.refresh_board(s, day(4, 0)), true, "midnight, new board")


func test_pay_goes_from_half_to_one_and_a_half() -> void:
	var s := game()
	eq(Jobs.pay_for(s, fix, 0, day(3)), 75, "score 0")
	eq(Jobs.pay_for(s, fix, fix.great / 2, day(3)), 150, "half")
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 225, "great")
	eq(Jobs.pay_for(s, fix, fix.great * 10, day(3)), 225, "capped")


func test_tired_nemla_earns_less() -> void:
	var s := game()
	s.nemla.needs = {"hunger": 10.0, "energy": 10.0, "clean": 10.0, "fun": 10.0}
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 180, "tired pay")


func test_finishing_a_job_pays_once() -> void:
	var s := game()
	var coins: int = s.coins
	var run := Jobs.ticket(s, 0)
	var r := Jobs.finish_job(s, run, fix.great, day(3))
	eq(r.coins, 225, "coins")
	eq(r.rating, "perfect", "rating")
	eq(s.coins, coins + 225, "wallet")
	eq(s.work.earnedToday, 225, "earned today")
	eq(s.work.board[0].done, true, "done")
	eq(s.work.board[0].paid, 225, "paid")
	eq(s.nemla.needs.energy, 80 + Economy.JOB_EFFECT.energy, "tired")
	eq(s.nemla.needs.fun, 50 + Economy.JOB_EFFECT.fun, "fun")
	eq(s.nemla.xp, Economy.JOB_XP, "xp")
	eq(Jobs.finish_job(s, run, fix.great, day(3)), {}, "paid twice")
	eq(s.coins, coins + 225, "wallet once")


func test_run_ending_after_midnight_is_still_paid() -> void:
	var s := game(day(3, 23))
	var run := Jobs.ticket(s, 0)
	Jobs.refresh_board(s, day(4, 0), first)
	eq(Jobs.finish_job(s, run, 0, day(4, 0)).coins, 75, "paid")
	ok(s.work.board.all(func(e): return not e.done), "the new day's board is untouched")


func test_work_streak() -> void:
	var s := game(day(3))
	Jobs.finish_job(s, Jobs.ticket(s, 0), 0, day(3))
	Jobs.finish_job(s, Jobs.ticket(s, 1), 0, day(3))
	eq(Jobs.current_streak(s, day(3)), 1, "day 1")
	Jobs.refresh_board(s, day(4), first)
	eq(Jobs.current_streak(s, day(4)), 1, "yesterday still counts")
	eq(Jobs.finish_job(s, Jobs.ticket(s, 0), fix.great, day(4)).bonus, Economy.STREAK_BONUS, "bonus")
	eq(Jobs.current_streak(s, day(4)), 2, "day 2")
	eq(Jobs.current_streak(s, day(6)), 0, "a missed day breaks it")
	Jobs.refresh_board(s, day(6), first)
	Jobs.finish_job(s, Jobs.ticket(s, 0), 0, day(6))
	eq(Jobs.current_streak(s, day(6)), 1, "starts again")


func test_ratings() -> void:
	eq(Jobs.rating(fix, 0), "ok", "0")
	eq(Jobs.rating(fix, 12), "good", "12")
	eq(Jobs.rating(fix, 25), "great", "25")
	eq(Jobs.rating(fix, 30), "perfect", "30")
