# What every test file extends: a few checks that record what went wrong
# instead of stopping, and helpers shared by the tests.
class_name TestCase
extends RefCounted

const HOUR := 3600000
const MIN := 60000

var failures := []


func eq(actual, expected, what := "") -> void:
	if not same(actual, expected):
		failures.append("%s: got %s, expected %s" % [what, JSON.stringify(actual), JSON.stringify(expected)])


# Deep equality where 45 and 45.0 are the same number, as they are to the game.
static func same(a, b) -> bool:
	var numbers := [TYPE_INT, TYPE_FLOAT]
	if typeof(a) in numbers and typeof(b) in numbers:
		return absf(float(a) - float(b)) < 1e-6
	if typeof(a) != typeof(b):
		return false
	if typeof(a) == TYPE_DICTIONARY:
		if a.size() != b.size():
			return false
		for key in a:
			if not b.has(key) or not same(a[key], b[key]):
				return false
		return true
	if typeof(a) == TYPE_ARRAY:
		if a.size() != b.size():
			return false
		for i in a.size():
			if not same(a[i], b[i]):
				return false
		return true
	return a == b


func ok(value: bool, what := "") -> void:
	if not value:
		failures.append("expected " + what)


# 12:00 (or `hour`) on that day of November 2026, on the phone's calendar.
static func day(d: int, hour := 12) -> int:
	return Clock.local_ms(2026, 11, d, hour)


static func always(n: float) -> Callable:
	return func(): return n
