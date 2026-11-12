# Nemla's four needs. Plain functions on the save's `nemla` dictionary.
class_name Needs

const NEEDS := ["hunger", "energy", "clean", "fun"]
const HOUR := 3600000.0
const SAME := {"drop": {"hunger": 1.0, "energy": 1.0, "clean": 1.0, "fun": 1.0}, "sleep": 1.0}


static func _clamp(n: float) -> float:
	return clampf(n, 0.0, 100.0)


# Moves the needs forward by `ms` of real time. While Nemla sleeps, energy
# refills instead of dropping; once it is full Nemla wakes up and energy
# starts dropping again for the rest of the time. `rates` are the perks
# from things Nemla owns: `drop` slows each need down, `sleep` speeds up
# sleeping.
static func pass_time(nemla: Dictionary, ms: int, rates: Dictionary = SAME) -> void:
	var hours := maxf(0.0, ms) / HOUR
	var needs: Dictionary = nemla.needs
	for k in ["hunger", "clean", "fun"]:
		needs[k] = _clamp(needs[k] - _drop(rates, k) * hours)

	var awake := hours
	if nemla.sleeping:
		var gain: float = Economy.SLEEP_GAIN_PER_HOUR * rates.sleep
		var to_full: float = (100.0 - needs.energy) / gain
		if hours < to_full:
			needs.energy = _clamp(needs.energy + gain * hours)
			awake = 0.0
		else:
			needs.energy = 100.0
			nemla.sleeping = false
			awake = hours - to_full
	needs.energy = _clamp(needs.energy - _drop(rates, "energy") * awake)


static func _drop(rates: Dictionary, k: String) -> float:
	return Economy.NEED_DROP_PER_HOUR[k] * rates.drop[k]


static func average(needs: Dictionary) -> float:
	var sum := 0.0
	for k in NEEDS:
		sum += needs[k]
	return sum / NEEDS.size()


# The need Nemla is thinking about: the lowest one, if it is low at all.
static func worst_need(needs: Dictionary) -> String:
	var worst := ""
	for k in NEEDS:
		if needs[k] < Economy.NEED_LOW and (worst == "" or needs[k] < needs[worst]):
			worst = k
	return worst


static func mood(needs: Dictionary) -> String:
	var avg := average(needs)
	return "happy" if avg >= 70 else ("ok" if avg >= 40 else "low")
