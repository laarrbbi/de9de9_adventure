extends TestCase


func test_eating_costs_coins_and_fills_hunger() -> void:
	var s := SaveGame.new_game(0)
	var coins: int = s.coins
	var hunger: float = s.nemla.needs.hunger
	eq(Care.eat(s).ok, true, "ok")
	eq(s.coins, coins - Economy.MEAL.cost, "coins")
	eq(s.nemla.needs.hunger, hunger + Economy.MEAL.hunger, "hunger")
	eq(s.stats.meals, 1, "meals")


func test_eating_says_no_when_full_broke_or_asleep() -> void:
	var s := SaveGame.new_game(0)
	s.nemla.needs.hunger = 99
	eq(Care.eat(s).why, "full", "full")
	s.nemla.needs.hunger = 10
	s.coins = Economy.MEAL.cost - 1
	eq(Care.eat(s).why, "coins", "broke")
	eq(s.coins, Economy.MEAL.cost - 1, "nothing taken")
	s.nemla.sleeping = true
	eq(Care.eat(s).why, "sleeping", "asleep")


func test_washing_and_playing() -> void:
	var s := SaveGame.new_game(0)
	s.nemla.needs.clean = 30
	s.nemla.needs.fun = 30
	eq(Care.wash(s).gained, {"clean": 70}, "gained")
	eq(s.nemla.needs.clean, 100, "clean")
	Care.play(s)
	eq(s.nemla.needs.fun, 30 + Economy.PLAY_FUN, "fun")


func test_sleep_and_wake() -> void:
	var s := SaveGame.new_game(0)
	s.nemla.needs.energy = 99
	eq(Care.sleep(s).why, "rested", "rested")
	s.nemla.needs.energy = 20
	eq(Care.sleep(s).ok, true, "sleeps")
	eq(s.nemla.sleeping, true, "asleep")
	eq(Care.play(s).why, "sleeping", "no play while asleep")
	eq(Care.wake(s).ok, true, "wakes")
	eq(Care.wake(s).why, "awake", "already awake")


func test_xp_passes_several_levels_and_each_pays() -> void:
	var s := SaveGame.new_game(0)
	var coins: int = s.coins
	var levels := Care.gain_xp(s, Economy.xp_to_next(1) + Economy.xp_to_next(2) + 3)
	eq(levels, [{"level": 2, "coins": Economy.level_up_coins(2)}, {"level": 3, "coins": Economy.level_up_coins(3)}], "levels")
	eq(s.nemla.level, 3, "level")
	eq(s.nemla.xp, 3, "xp")
	eq(s.coins, coins + Economy.level_up_coins(2) + Economy.level_up_coins(3), "coins")
	eq(Level.add_xp({"level": 1, "xp": 0}, Economy.xp_to_next(1) - 1), [], "no level")
