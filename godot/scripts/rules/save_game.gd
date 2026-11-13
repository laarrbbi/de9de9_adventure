# The save: one JSON file on the phone (user://save.json), with a version
# number so old saves can be upgraded. A save that can't be read is kept
# under a second name, so a bug never silently wipes a player's progress.
class_name SaveGame

const PATH := "user://save.json"
const VERSION := 2


static func per_crop() -> Dictionary:
	var out := {}
	for crop in Economy.CROPS:
		out[crop.id] = 0
	return out


static func new_game(now_ms: int) -> Dictionary:
	var plots := []
	for i in Economy.START_PLOTS:
		plots.append(Garden.empty_plot())
	return {
		"version": VERSION,
		"createdAt": now_ms,
		"lastSeen": now_ms,
		"nemla": {"level": 1, "xp": 0, "needs": Economy.START.needs.duplicate(), "sleeping": false, "outfit": ""},
		"coins": Economy.START.coins,
		"totalEarned": 0,
		"points": {"balance": 0, "day": "", "today": 0},
		"home": {"level": 1, "rooms": []},
		"owned": {"cars": [], "equipment": [], "clothes": []},
		"work": {"day": "", "board": [], "earnedToday": 0, "done": 0, "streak": 0, "lastWorked": "", "helpedDay": ""},
		"garden": {"plots": plots, "seed": Economy.CROPS[0].id, "barn": per_crop(), "planted": per_crop(), "market": {"day": "", "sold": 0}},
		"stats": {"meals": 0, "baths": 0, "plays": 0, "naps": 0, "harvests": 0, "sold": 0, "gifts": 0, "calls": 0, "fixes": 0},
		"guide": {"step": 0},
		"friends": {},
		"visitor": {"bug": "", "until": 0, "nextAt": 0},
		"problem": {"kind": "", "since": 0, "nextAt": 0},
	}


# Returns { state, fresh }.
static func load_game(now_ms: int, path := PATH) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {"state": new_game(now_ms), "fresh": true}
	var raw := FileAccess.get_file_as_string(path)
	var saved = JSON.parse_string(raw)
	if typeof(saved) != TYPE_DICTIONARY or not saved.has("version"):
		var keep := FileAccess.open(path + ".unreadable", FileAccess.WRITE)
		if keep:
			keep.store_string(raw)
		return {"state": new_game(now_ms), "fresh": true}
	saved = whole_numbers(saved)
	while saved.version < VERSION:
		saved = upgrade(saved)
	return {"state": fill_in(saved, new_game(now_ms)), "fresh": false}


# Brings a save one version up. Fields that are only new get filled in by
# fill_in; this is for changes to what is already there.
static func upgrade(saved: Dictionary) -> Dictionary:
	match int(saved.version):
		1:
			# The guide got a step (meeting the first friend) before its goal.
			# A save already at the goal skips it; the first visitor still comes.
			if saved.has("guide") and saved.guide.step >= 5:
				saved.guide.step += 1
	saved.version = int(saved.version) + 1
	return saved


static func save_game(state: Dictionary, path := PATH) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(state))
	return true


# Adds any field the saved game is missing (from a new feature) with its
# starting value, keeping everything the player already has.
static func fill_in(saved: Dictionary, defaults: Dictionary) -> Dictionary:
	for key in defaults:
		if not saved.has(key):
			saved[key] = defaults[key]
		elif typeof(defaults[key]) == TYPE_DICTIONARY and typeof(saved[key]) == TYPE_DICTIONARY:
			fill_in(saved[key], defaults[key])
	return saved


# JSON reads every number as a float; counts, levels and times are whole.
static func whole_numbers(value):
	match typeof(value):
		TYPE_DICTIONARY:
			for key in value:
				value[key] = whole_numbers(value[key])
		TYPE_ARRAY:
			for i in value.size():
				value[i] = whole_numbers(value[i])
		TYPE_FLOAT:
			if value == floorf(value) and absf(value) < 9.0e15:
				return int(value)
	return value
