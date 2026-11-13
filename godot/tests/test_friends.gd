extends TestCase

var first := always(0.0)


# A game past the guide, at level 5, with coins and crops to give.
func game(now := day(3)) -> Dictionary:
	var s := SaveGame.new_game(now)
	s.guide.step = Guide.STEPS.size()
	s.nemla.level = 5
	s.coins = 1000
	s.garden.barn = {"mint": 5, "wheat": 5, "tomato": 5}
	return s


func befriend(s: Dictionary, id: String, points := 1) -> void:
	s.friends[id] = {"points": points, "giftDay": "", "callDay": ""}


func test_hearts_come_at_1_4_9_16_25_points() -> void:
	eq([0, 1, 3, 4, 8, 9, 15, 16, 24, 25, 40].map(func(p): return Friends.hearts_for(p)), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], "hearts")


func test_bugs_visit_in_order_and_leave() -> void:
	var s := game()
	var now := day(3)
	eq(Friends.update_visitor(s, now, first), "snail", "Snail first")
	eq(Friends.visitor(s, now).id, "snail", "visiting")
	eq(Friends.update_visitor(s, now + HOUR, first), "", "one at a time")
	eq(Friends.visitor(s, now + Economy.VISIT_HOURS * HOUR).is_empty(), true, "gone after its visit")
	Friends.update_visitor(s, now + Economy.VISIT_HOURS * HOUR, first)
	eq(s.visitor.bug, "", "a gap before the next one")
	befriend(s, "snail")
	eq(Friends.update_visitor(s, now + 12 * HOUR, first), "beetle", "then the next bug to meet")


func test_bugs_wait_for_their_level() -> void:
	var s := game()
	s.nemla.level = 1
	befriend(s, "snail")
	befriend(s, "beetle")
	eq(Friends.next_to_meet(s), "", "nobody new at level 1")
	eq(Friends.update_visitor(s, day(3), always(0.6)), "beetle", "a friend visits instead")
	s.nemla.level = 2
	eq(Friends.next_to_meet(s), "ladybug", "ladybug at level 2")


func test_no_visitors_during_the_guide_except_snail() -> void:
	var s := game()
	s.guide.step = 2
	eq(Friends.update_visitor(s, day(3)), "", "nobody during the guide")
	s.guide.step = Guide.STEPS.find(Guide.STEPS.filter(func(x): return x.id == "friend")[0])
	eq(Friends.update_visitor(s, day(3)), "snail", "Snail at the friend step")


func test_a_gift_makes_a_friend_and_the_visitor_goes_home() -> void:
	var s := game()
	var now := day(3)
	eq(Friends.give_gift(s, "snail", "box", now).why, "notMet", "not visiting yet")
	Friends.update_visitor(s, now, first)
	var r := Friends.give_gift(s, "snail", "mint", now)
	eq([r.ok, r.new_friend, r.loved, r.points, r.hearts], [true, true, true, 2, 1], "loved gift")
	eq(s.garden.barn.mint, 4, "the mint is given")
	ok(Friends.is_friend(s, "snail"), "friends")
	eq(Friends.visitor(s, now), {}, "the visitor went home")
	eq(Friends.give_gift(s, "snail", "wheat", now).why, "gifted", "one gift a day")
	var r2 := Friends.give_gift(s, "snail", "wheat", now + Clock.DAY_MS)
	eq([r2.points, r2.hearts], [1, 1], "another crop counts 1")
	Friends.give_gift(s, "snail", "mint", now + 2 * Clock.DAY_MS)
	eq(Friends.hearts(s, "snail"), 2, "second heart at 4 points")


func test_gift_box_and_empty_barn() -> void:
	var s := game()
	befriend(s, "beetle")
	s.garden.barn = {"mint": 0, "wheat": 0, "tomato": 0}
	eq(Friends.give_gift(s, "beetle", "wheat", day(3)).why, "noGift", "nothing in the barn")
	var coins: int = s.coins
	eq(Friends.give_gift(s, "beetle", "box", day(3)).points, 1, "a gift box")
	eq(s.coins, coins - Economy.GIFT_BOX, "costs coins")
	s.coins = 0
	eq(Friends.give_gift(s, "beetle", "box", day(4)).why, "coins", "no coins")


func test_calls_once_a_day_and_favors() -> void:
	var s := game()
	var now := day(3)
	eq(Friends.call_friend(s, "snail", now).why, "notFriend", "not a friend")
	befriend(s, "snail")
	s.nemla.needs.clean = 30.0
	var r := Friends.call_friend(s, "snail", now)
	eq([r.favor, r.amount], ["clean", 70], "Snail cleans")
	eq(s.nemla.needs.clean, 100, "clean is full")
	eq(Friends.call_friend(s, "snail", now).why, "called", "once a day")
	eq(Friends.call_friend(s, "snail", now + Clock.DAY_MS).ok, true, "again tomorrow")

	befriend(s, "beetle", 9)
	var coins: int = s.coins
	eq(Friends.call_friend(s, "beetle", now).amount, Economy.FAVOR.coins * 3, "Beetle brings coins, more with hearts")
	eq(s.coins, coins + Economy.FAVOR.coins * 3, "paid")

	befriend(s, "ladybug")
	Jobs.refresh_board(s, now, first)
	var jobs: int = s.work.board.size()
	Friends.call_friend(s, "ladybug", now)
	eq(s.work.board.size(), jobs + 1, "Ladybug finds a delivery")
	eq(s.work.board.back().job, "deliver", "a delivery")

	befriend(s, "firefly", 4)
	Garden.plant(s, 0, "wheat", now)
	Friends.call_friend(s, "firefly", now)
	eq(s.garden.plots[0].readyAt - now, 60 * MIN - 20 * MIN, "Firefly's light: 10 min sooner per heart")

	befriend(s, "mantis", 16)
	eq(Friends.call_friend(s, "mantis", now).amount, 40, "Mantis's lesson: XP by hearts")


func test_friends_help_all_the_time() -> void:
	var s := game()
	var fix := Jobs.job_by_id("fixPipe")
	var deliver := Jobs.job_by_id("deliver")
	befriend(s, "beetle", 25)
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 270, "+20% on Travaux jobs at 5 hearts")
	eq(Jobs.pay_for(s, deliver, deliver.great, day(3)), 180, "nothing on Auto jobs")
	befriend(s, "bee", 25)
	eq(Garden.grow_time(s, Garden.crop_by_id("wheat")), 48 * MIN, "crops 20% faster")
	befriend(s, "firefly", 9)
	eq(Garden.market_left(s, day(3)), Economy.MARKET_PER_DAY + 6, "the market buys 2 more per heart")
	befriend(s, "snail", 4)
	s.nemla.needs.clean = 80.0
	Needs.pass_time(s.nemla, HOUR, Perks.perks(s))
	eq(s.nemla.needs.clean, 80 - 3 * 0.9, "clean drops 10% slower")
	eq(Perks.friend_perk_value(s, Friends.bug_by_id("beetle")), 20, "shown as 20%")


func test_problems_come_after_the_guide() -> void:
	var s := game()
	var now := day(3)
	s.guide.step = 0
	eq(Friends.update_problem(s, now, first), "", "none during the guide")
	s.guide.step = Guide.STEPS.size()
	eq(Friends.update_problem(s, now, first), "", "the first one is scheduled")
	eq(Friends.update_problem(s, now + 30 * MIN, first), "", "not yet")
	eq(Friends.update_problem(s, now + HOUR, first), "leak", "a leak")
	eq(Friends.update_problem(s, now + 2 * HOUR, first), "", "one at a time")


func test_problems_block_and_friends_fix_them() -> void:
	var s := game()
	var now := day(3)
	s.problem.kind = "leak"
	s.nemla.needs.clean = 20.0
	eq(Care.wash(s).why, "leak", "no bath with a leak")
	eq(Friends.fix_problem(s, "friend", now).why, "notFriend", "Beetle not met")
	var coins: int = s.coins
	var r := Friends.fix_problem(s, "pay", now, first)
	eq([r.ok, r.bug], [true, "beetle"], "paid fix")
	eq(s.coins, coins - Economy.FIX_COST, "cost")
	eq(Care.wash(s).ok, true, "bath works again")
	eq(s.problem.nextAt, now + Economy.PROBLEM_GAP_HOURS[0] * HOUR, "the next one comes later")

	befriend(s, "firefly")
	s.problem.kind = "brokenRadio"
	s.nemla.needs.fun = 20.0
	eq(Care.play(s).why, "brokenRadio", "no music")
	eq(Friends.fix_problem(s, "friend", now).ok, true, "Firefly fixes it")
	eq(s.friends.firefly.points, 2, "and gets a friendship point")

	s.problem.kind = "flatTire"
	eq(Jobs.blocked(s, Jobs.job_by_id("deliver")), "flatTire", "no deliveries")
	eq(Jobs.blocked(s, Jobs.job_by_id("fixPipe")), "", "other jobs are fine")

	s.problem.kind = "sick"
	var fix := Jobs.job_by_id("fixPipe")
	eq(Jobs.pay_for(s, fix, fix.great, now), 180, "sick: 20% less")

	s.problem.kind = "mess"
	eq(Perks.perks(s).drop.clean, 2.0, "dirty twice as fast")


func test_old_save_keeps_its_place_in_the_guide() -> void:
	eq(SaveGame.upgrade({"version": 1, "guide": {"step": 6}}).guide.step, 7, "finished stays finished")
	eq(SaveGame.upgrade({"version": 1, "guide": {"step": 5}}).guide.step, 6, "at the goal stays at the goal")
	eq(SaveGame.upgrade({"version": 1, "guide": {"step": 3}}).guide.step, 3, "earlier steps unchanged")
