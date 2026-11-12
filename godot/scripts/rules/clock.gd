# Real time. The game keeps running while the app is closed: on start, and
# then every second, `advance` plays out everything since the last visit.
# Times are in milliseconds since 1970, like the web version's save.
class_name Clock

const DAY_MS := 86400000


static func now() -> int:
	return int(Time.get_unix_time_from_system() * 1000.0)


static func _bias_s() -> int:
	return int(Time.get_time_zone_from_system().get("bias", 0)) * 60


# The phone's calendar and clock at `ms`.
static func local(ms: int) -> Dictionary:
	return Time.get_datetime_dict_from_unix_time(floori(ms / 1000.0) + _bias_s())


# The time, in ms, of a date and hour on the phone's calendar.
static func local_ms(year: int, month: int, day: int, hour := 0, minute := 0) -> int:
	var unix := Time.get_unix_time_from_datetime_dict({"year": year, "month": month, "day": day, "hour": hour, "minute": minute, "second": 0})
	return (unix - _bias_s()) * 1000


static func midnight(ms: int) -> int:
	var d := local(ms)
	return local_ms(d.year, d.month, d.day)


static func advance(state: Dictionary, now_ms: int) -> Dictionary:
	# A clock set back in time counts as no time passing.
	var ms := clampi(now_ms - int(state.lastSeen), 0, Economy.MAX_CATCH_UP_HOURS * 3600000)
	var was_sleeping: bool = state.nemla.sleeping
	Needs.pass_time(state.nemla, ms, Perks.perks(state))
	state.lastSeen = now_ms
	return {"ms": ms, "woke_up": was_sleeping and not state.nemla.sleeping}


# Day 1 is the day the game started, counted on the phone's calendar.
static func day_number(created_at: int, now_ms: int) -> int:
	return roundi(float(midnight(now_ms) - midnight(created_at)) / DAY_MS) + 1


static func is_night(ms: int) -> bool:
	var hour: int = local(ms).hour
	return hour >= 20 or hour < 6


# The calendar day, as 2026-11-03, for things that reset at midnight.
static func day_key(ms: int) -> String:
	var d := local(ms)
	return "%04d-%02d-%02d" % [d.year, d.month, d.day]


static func yesterday_key(ms: int) -> String:
	return day_key(midnight(ms) - 1)


static func ms_to_midnight(now_ms: int) -> int:
	return midnight(now_ms) + DAY_MS - now_ms


static func clock_time(ms: int) -> String:
	var d := local(ms)
	return "%d:%02d" % [d.hour, d.minute]
