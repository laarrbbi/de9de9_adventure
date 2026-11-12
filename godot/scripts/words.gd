# Every word the player reads goes through here, so the game can be
# translated into Arabic and French later. `{name}` marks a value filled in
# by t(). The English words are generated from the web version.
class_name Words

static var _vars := RegEx.create_from_string("\\{(\\w+)\\}")


static func t(key: String, vars := {}) -> String:
	var text: String = WordsEn.WORDS.get(key, key)
	var out := ""
	var at := 0
	for m in _vars.search_all(text):
		out += text.substr(at, m.get_start() - at) + str(vars.get(m.get_string(1), ""))
		at = m.get_end()
	return out + text.substr(at)


static func saying(topic: String) -> String:
	var list: Array = WordsEn.SAYINGS.get(topic, WordsEn.SAYINGS.happy)
	return list[randi() % list.size()]


# 1250 → "1,250"
static func num(n) -> String:
	var digits := str(floori(absf(n)))
	var out := ""
	while digits.length() > 3:
		out = "," + digits.substr(digits.length() - 3) + out
		digits = digits.substr(0, digits.length() - 3)
	return ("-" if n < 0 else "") + digits + out


static func duration(ms: int) -> String:
	var minutes := roundi(ms / 60000.0)
	if minutes < 60:
		return t("time.min", {"n": minutes})
	var hours := roundi(minutes / 60.0)
	if hours < 48:
		return t("time.hours", {"n": hours})
	return t("time.days", {"n": roundi(hours / 24.0)})


# Time left on a countdown, rounded up so it never says 0 before the end.
static func countdown(ms: int) -> String:
	var sec := maxi(1, ceili(ms / 1000.0))
	if sec < 60:
		return t("time.sec", {"n": sec})
	var minutes := ceili(sec / 60.0)
	if minutes < 60:
		return t("time.min", {"n": minutes})
	var h := minutes / 60
	var m := minutes % 60
	return t("time.hmin", {"h": h, "m": m}) if m else t("time.hours", {"n": h})
