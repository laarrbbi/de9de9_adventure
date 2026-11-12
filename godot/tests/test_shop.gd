extends TestCase

var first := always(0.0)


func rich(coins := 1000000) -> Dictionary:
	var s := SaveGame.new_game(day(3))
	s.coins = coins
	s.nemla.needs = {"hunger": 60.0, "energy": 60.0, "clean": 60.0, "fun": 60.0}
	return s


func test_new_game_owns_the_starting_things() -> void:
	var s := SaveGame.new_game(day(3))
	eq(Perks.home_of(s).id, "hole", "home")
	ok(Perks.owns(s, "hole") and Perks.owns(s, "leafCart") and Perks.owns(s, "wateringCan"), "starting things")
	ok(not Perks.owns(s, "anthill") and not Perks.owns(s, "scooter") and not Perks.owns(s, "redCap"), "nothing else")
	eq(Shop.next_home(s).id, "anthill", "next home")


func test_buying_takes_the_coins_once() -> void:
	var s := rich(3500)
	var r := Shop.buy(s, "scooter")
	eq([r.ok, r.kind, r.price], [true, "car", 3000], "bought")
	eq(s.coins, 500, "coins")
	ok(Perks.owns(s, "scooter"), "owned")
	eq(Shop.buy(s, "scooter").why, "owned", "not twice")
	eq(s.coins, 500, "coins once")


func test_the_shop_says_why_not() -> void:
	var s := rich(1000)
	var poor := Shop.check(s, "anthill")
	eq(poor.why, "coins", "coins")
	eq(poor.short, 1000, "short by")
	eq(Shop.check(s, "house").why, "order", "homes in order")
	eq(Shop.check(s, "house").home, "anthill", "the home before")
	eq(Shop.check(s, "kitchen").why, "home", "room needs a home")
	eq(Shop.check(s, "leafCart").why, "owned", "owned")
	eq(Shop.check(s, "spaceship").why, "missing", "missing")


func test_moving_home_adds_plots_and_jobs() -> void:
	var s := rich()
	eq(Shop.buy(s, "anthill").ok, true, "moved")
	eq(Perks.home_of(s).id, "anthill", "home")
	eq(Garden.room_for_plots(s), Economy.PLOTS_BY_HOME[1], "plots")
	eq(Jobs.jobs_per_day(s), Economy.JOBS_PER_DAY + 1, "jobs")
	for id in ["house", "villa", "palace"]:
		eq(Shop.buy(s, id).ok, true, id)
	eq(Perks.home_of(s).id, "palace", "palace")
	eq(Shop.next_home(s), {}, "no next home")


func test_rooms_make_care_better() -> void:
	var s := rich()
	for id in ["anthill", "kitchen", "bathroom"]:
		Shop.buy(s, id)
	s.nemla.needs = {"hunger": 20.0, "energy": 60.0, "clean": 20.0, "fun": 20.0}
	eq(Care.eat(s).gained.hunger, 40, "meal")
	eq(Care.wash(s).gained, {"clean": 80, "fun": 15}, "bath")
	for id in ["house", "musicRoom"]:
		Shop.buy(s, id)
	eq(Care.play(s).gained.fun, 35, "music")


func test_bedroom_doubles_sleep() -> void:
	var s := rich()
	for id in ["anthill", "house", "bedroom"]:
		Shop.buy(s, id)
	s.nemla.needs.energy = 0
	s.nemla.sleeping = true
	Needs.pass_time(s.nemla, 10 * MIN, Perks.perks(s))
	eq(s.nemla.needs.energy, 100, "full")
	eq(s.nemla.sleeping, false, "awake")


func test_clothes_work_while_worn() -> void:
	var s := rich()
	var fix := Jobs.job_by_id("fixPipe")
	Shop.buy(s, "overalls")
	eq(s.nemla.outfit, "overalls", "worn at once")
	Jobs.refresh_board(s, day(3), first)
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 235, "+5%")
	Shop.wear(s, "")
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 225, "taken off")
	eq(Shop.wear(s, "redCap").why, "missing", "not owned")
	Shop.buy(s, "redCap")
	var before: float = s.nemla.needs.fun
	Needs.pass_time(s.nemla, HOUR, Perks.perks(s))
	eq(before - s.nemla.needs.fun, 5 * 0.75, "fun drops slower")
	Shop.buy(s, "strawHat")
	eq(Garden.price_of(s, Garden.crop_by_id("wheat")), 44, "+10% at the market")


func test_scooter_and_toolbox_unlock_jobs() -> void:
	var s := rich()
	ok(not Jobs.can_take(s, Jobs.job_by_id("express")), "express locked")
	Shop.buy(s, "scooter")
	Shop.buy(s, "toolbox")
	ok(Jobs.can_take(s, Jobs.job_by_id("express")), "express open")
	ok(Jobs.can_take(s, Jobs.job_by_id("buildRoom")), "building open")
	Jobs.refresh_board(s, day(3), first)
	Jobs.post_job(s, "express", first)
	eq(s.work.board.back().job, "express", "posted")


func test_at_most_one_building_job() -> void:
	var s := rich()
	Shop.buy(s, "toolbox")
	Jobs.refresh_board(s, day(3), always(0.99))
	eq(s.work.board.filter(func(e): return e.job == "buildRoom").size(), 1, "one")


func test_little_car_adds_two_jobs_today() -> void:
	var s := rich()
	Jobs.refresh_board(s, day(3), first)
	Shop.buy(s, "littleCar")
	eq(Jobs.fill_board(s, first), 2, "added")
	Jobs.refresh_board(s, day(4), first)
	eq(s.work.board.size(), Economy.JOBS_PER_DAY + 2, "every day")


func test_sports_car_adds_10_percent() -> void:
	var s := rich()
	var fix := Jobs.job_by_id("fixPipe")
	Shop.buy(s, "sportsCar")
	eq(Jobs.pay_for(s, fix, fix.great, day(3)), 250, "+10%")


func test_workshop_does_two_jobs_a_day() -> void:
	var s := rich()
	Jobs.refresh_board(s, day(3), first)
	eq(Jobs.run_workshop(s, day(3), first), {}, "no workshop")
	Shop.buy(s, "workshop")
	var coins: int = s.coins
	var r := Jobs.run_workshop(s, day(3), first)
	eq(r.count, 2, "two")
	eq(s.coins, coins + r.coins, "paid")
	eq(s.work.board.filter(func(e): return e.get("by", "") == "workshop" and e.done).size(), 2, "on the board")
	eq(s.work.board.filter(func(e): return not e.done).size(), Economy.JOBS_PER_DAY, "own jobs untouched")
	eq(Jobs.run_workshop(s, day(3, 20), first), {}, "once a day")
	Jobs.refresh_board(s, day(4), first)
	eq(Jobs.run_workshop(s, day(4), first).count, 2, "next day")


func test_sprinkler_and_pickup() -> void:
	var s := rich()
	Shop.buy(s, "sprinkler")
	eq(Garden.grow_time(s, Garden.crop_by_id("wheat")), 45 * MIN, "25% faster")
	Shop.buy(s, "pickup")
	eq(Garden.market_left(s, day(3)), Economy.MARKET_PER_DAY * 3, "3x market")
	s.garden.barn.mint = 50
	eq(Garden.sell(s, "mint", day(3)).count, 50, "sells 50")


func test_tractor() -> void:
	var s := rich()
	Garden.plant(s, 0, "wheat", day(3))
	eq(Garden.tractor(s, day(3)).why, "missing", "no tractor")
	Shop.buy(s, "tractor")
	s.garden.seed = "mint"
	var coins: int = s.coins
	var r := Garden.tractor(s, day(3) + 60 * MIN)
	eq([r.harvested, r.planted], [1, 2], "harvested and planted")
	eq(s.garden.barn.wheat, 1, "barn")
	eq(s.garden.plots[0].crop, "wheat", "replanted")
	eq(s.garden.plots[1].crop, "mint", "picked seed")
	eq(s.coins, coins - 15 - 10, "seeds paid")
	eq(Garden.tractor(s, day(3) + 61 * MIN).why, "nothingToDo", "nothing to do")
