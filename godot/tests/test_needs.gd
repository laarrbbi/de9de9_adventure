extends TestCase


func nemla(needs := {}, sleeping := false) -> Dictionary:
	var all := {"hunger": 80.0, "energy": 80.0, "clean": 80.0, "fun": 80.0}
	all.merge(needs, true)
	return {"needs": all, "sleeping": sleeping}


func test_needs_drop_with_time_and_stop_at_zero() -> void:
	var n := nemla()
	Needs.pass_time(n, 2 * HOUR)
	eq(n.needs.hunger, 80 - 2 * Economy.NEED_DROP_PER_HOUR.hunger, "hunger")
	eq(n.needs.energy, 80 - 2 * Economy.NEED_DROP_PER_HOUR.energy, "energy")
	Needs.pass_time(n, 100 * HOUR)
	for k in Needs.NEEDS:
		eq(n.needs[k], 0, k)


func test_sleeping_refills_energy() -> void:
	var n := nemla({"energy": 10.0}, true)
	Needs.pass_time(n, int(0.1 * HOUR))
	eq(n.needs.energy, 10 + 0.1 * Economy.SLEEP_GAIN_PER_HOUR, "energy")
	eq(n.sleeping, true, "still asleep")


func test_waking_up_when_full_then_energy_drops() -> void:
	var n := nemla({"energy": 40.0}, true)
	var to_full := 60.0 / Economy.SLEEP_GAIN_PER_HOUR
	Needs.pass_time(n, int((to_full + 2) * HOUR))
	eq(n.sleeping, false, "awake")
	eq(n.needs.energy, 100 - 2 * Economy.NEED_DROP_PER_HOUR.energy, "energy")


func test_time_going_backwards_changes_nothing() -> void:
	var n := nemla()
	Needs.pass_time(n, -5 * HOUR)
	eq(n.needs, nemla().needs, "needs")


func test_worst_need() -> void:
	eq(Needs.worst_need(nemla().needs), "", "nothing low")
	eq(Needs.worst_need(nemla({"hunger": 30.0, "fun": 10.0}).needs), "fun", "lowest")


func test_mood() -> void:
	eq(Needs.mood(nemla().needs), "happy", "happy")
	eq(Needs.mood({"hunger": 50, "energy": 50, "clean": 50, "fun": 50}), "ok", "ok")
	eq(Needs.mood({"hunger": 10, "energy": 20, "clean": 30, "fun": 40}), "low", "low")
