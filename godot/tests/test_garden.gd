extends TestCase

var mint := Garden.crop_by_id("mint")
var wheat := Garden.crop_by_id("wheat")
var tomato := Garden.crop_by_id("tomato")


func game(now := day(3)) -> Dictionary:
	var s := SaveGame.new_game(now)
	s.coins = 1000
	return s


func test_new_game_has_empty_plots_and_barn() -> void:
	var s := SaveGame.new_game(day(3))
	eq(s.garden.plots.size(), Economy.START_PLOTS, "plots")
	ok(s.garden.plots.all(func(p): return p.crop == ""), "empty plots")
	eq(Garden.barn_total(s), 0, "empty barn")


func test_planting_costs_the_seed_and_grows_in_real_time() -> void:
	var s := game()
	var now := day(3)
	eq(Garden.plant(s, 1, "wheat", now).ok, true, "planted")
	eq(s.coins, 1000 - wheat.seed, "coins")
	eq(s.garden.plots[1].crop, "wheat", "crop")
	eq(Garden.is_ready(s.garden.plots[1], now), false, "not ready")
	eq(Garden.progress(s.garden.plots[1], now + 30 * MIN), 0.5, "half grown")
	eq(Garden.is_ready(s.garden.plots[1], now + 60 * MIN), true, "ready")
	eq(Garden.ready_count(s, now + 60 * MIN), 1, "ready count")


func test_first_mint_grows_in_2_minutes() -> void:
	var s := game()
	eq(Garden.grow_time(s, mint), mint.first * MIN, "first")
	Garden.plant(s, 0, "mint", day(3))
	eq(s.garden.plots[0].readyAt - day(3), 2 * MIN, "2 min")
	Garden.plant(s, 1, "mint", day(3))
	eq(s.garden.plots[1].readyAt - day(3), 30 * MIN, "30 min")
	eq(Garden.grow_time(s, wheat), wheat.grow * MIN, "wheat has no quick first time")


func test_planting_says_no() -> void:
	var s := game()
	Garden.plant(s, 0, "mint", day(3))
	eq(Garden.plant(s, 0, "wheat", day(3)).why, "busy", "busy")
	var locked := Garden.plant(s, 1, "tomato", day(3))
	eq(locked.why, "level", "level")
	eq(locked.level, tomato.level, "level needed")
	s.nemla.level = tomato.level
	s.coins = tomato.seed - 1
	eq(Garden.plant(s, 1, "tomato", day(3)).why, "coins", "coins")
	eq(s.coins, tomato.seed - 1, "nothing taken")
	eq(Garden.plant(s, 9, "mint", day(3)).why, "missing", "no such plot")


func test_harvest_waits_fills_barn_pays_xp() -> void:
	var s := game()
	Garden.plant(s, 0, "wheat", day(3))
	var early := Garden.harvest(s, 0, day(3) + 10 * MIN)
	eq(early.why, "growing", "growing")
	eq(early.left, 50 * MIN, "time left")
	eq(Garden.harvest(s, 1, day(3)).why, "empty", "empty")
	var r := Garden.harvest(s, 0, day(3) + 60 * MIN)
	eq(r.crop, "wheat", "crop")
	eq(s.garden.barn.wheat, 1, "barn")
	eq(s.nemla.xp, wheat.xp, "xp")
	eq(s.garden.plots[0].crop, "", "plot empty again")


func test_ripe_crop_waits() -> void:
	var s := game()
	Garden.plant(s, 0, "mint", day(3))
	eq(Garden.harvest(s, 0, day(30)).ok, true, "still there")


func test_harvest_all() -> void:
	var s := game()
	s.garden.plots.append(Garden.empty_plot())
	Garden.plant(s, 0, "mint", day(3))
	Garden.plant(s, 1, "mint", day(3))
	Garden.plant(s, 2, "wheat", day(3))
	var r := Garden.harvest_all(s, day(3) + 30 * MIN)
	eq(r.count, 2, "count")
	eq(r.got, {"mint": 2}, "got")
	eq(s.nemla.xp, 2 * mint.xp, "xp")
	eq(s.garden.plots[2].crop, "wheat", "wheat still growing")
	eq(Garden.harvest_all(s, day(3) + 31 * MIN).why, "nothingReady", "nothing")


func test_plot_prices_and_room() -> void:
	var s := game()
	s.coins = 10000
	eq(Garden.next_plot_price(s), 500, "first price")
	eq(Garden.buy_plot(s).price, 500, "500")
	eq(Garden.buy_plot(s).price, 600, "600")
	while s.garden.plots.size() < Garden.room_for_plots(s):
		eq(Garden.buy_plot(s).ok, true, "buys")
	eq(s.garden.plots.size(), Economy.PLOTS_BY_HOME[0], "full")
	var coins: int = s.coins
	eq(Garden.buy_plot(s).why, "room", "no room")
	eq(s.coins, coins, "nothing taken")
	var poor := game()
	poor.coins = 499
	eq(Garden.buy_plot(poor).why, "coins", "poor")


func test_market_pays_and_buys_30_a_day() -> void:
	var s := game()
	s.garden.barn.wheat = 25
	s.garden.barn.mint = 10
	var coins: int = s.coins
	var r := Garden.sell(s, "wheat", day(3), 5)
	eq(r.count, 5, "count")
	eq(r.coins, 5 * wheat.sell, "coins")
	eq(r.short, false, "not short")
	eq(s.coins, coins + 5 * wheat.sell, "wallet")
	eq(Garden.market_left(s, day(3)), Economy.MARKET_PER_DAY - 5, "left")
	var rest := Garden.sell_all(s, day(3, 18))
	eq(rest.count, Economy.MARKET_PER_DAY - 5, "rest")
	eq(rest.short, true, "short")
	eq(s.garden.barn.wheat, 0, "best price first")
	eq(s.garden.barn.mint, 5, "mint left")
	eq(Garden.sell(s, "mint", day(3, 20)).why, "market", "full")
	eq(Garden.sell(s, "tomato", day(3, 20)).why, "nothing", "nothing")
	eq(Garden.market_left(s, day(4, 0)), Economy.MARKET_PER_DAY, "new day")
	eq(Garden.sell(s, "mint", day(4, 8)).count, 5, "sells again")
