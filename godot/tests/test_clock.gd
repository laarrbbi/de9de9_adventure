extends TestCase


func test_advance_plays_out_the_time_away() -> void:
	var s := SaveGame.new_game(0)
	var hunger: float = s.nemla.needs.hunger
	var r := Clock.advance(s, 3 * HOUR)
	eq(r.ms, 3 * HOUR, "ms")
	eq(s.lastSeen, 3 * HOUR, "lastSeen")
	eq(s.nemla.needs.hunger, hunger - 3 * Economy.NEED_DROP_PER_HOUR.hunger, "hunger")


func test_clock_set_back_counts_as_no_time() -> void:
	var s := SaveGame.new_game(10 * HOUR)
	var needs: Dictionary = s.nemla.needs.duplicate()
	eq(Clock.advance(s, 2 * HOUR).ms, 0, "ms")
	eq(s.nemla.needs, needs, "needs")


func test_long_absence_is_capped() -> void:
	var s := SaveGame.new_game(0)
	eq(Clock.advance(s, 1000 * 24 * HOUR).ms, Economy.MAX_CATCH_UP_HOURS * HOUR, "capped")


func test_advance_says_when_nemla_woke_up() -> void:
	var s := SaveGame.new_game(0)
	s.nemla.sleeping = true
	s.nemla.needs.energy = 90
	eq(Clock.advance(s, int(5.0 / Economy.SLEEP_GAIN_PER_HOUR * HOUR)).woke_up, false, "still asleep")
	eq(Clock.advance(s, HOUR).woke_up, true, "woke")


func test_days_counted_on_the_calendar() -> void:
	var start := Clock.local_ms(2026, 10, 31, 23, 50)
	eq(Clock.day_number(start, start), 1, "day 1")
	eq(Clock.day_number(start, Clock.local_ms(2026, 11, 1, 0, 5)), 2, "day 2")
	eq(Clock.day_number(start, Clock.local_ms(2026, 11, 7, 12)), 8, "day 8")
	eq(Clock.day_key(Clock.local_ms(2026, 11, 3, 9)), "2026-11-03", "day key")
	eq(Clock.yesterday_key(Clock.local_ms(2026, 11, 1, 9)), "2026-10-31", "yesterday")


func test_night_is_8pm_to_6am() -> void:
	eq(Clock.is_night(Clock.local_ms(2026, 10, 31, 21)), true, "9 pm")
	eq(Clock.is_night(Clock.local_ms(2026, 10, 31, 5, 59)), true, "5:59 am")
	eq(Clock.is_night(Clock.local_ms(2026, 10, 31, 12)), false, "noon")
