# What Nemla's home, rooms, cars, equipment and outfit add up to. Every rule
# that a Shop item changes asks here, so an item's perk lives in one place:
# its line in economy.gd.
class_name Perks

# Every item the Shop sells, by kind, and where the save records it.
const KINDS := {
	"home": Economy.HOMES,
	"room": Economy.ROOMS,
	"car": Economy.CARS,
	"tool": Economy.EQUIPMENT,
	"clothes": Economy.CLOTHES,
}
const LIST := {"car": "cars", "tool": "equipment", "clothes": "clothes"}


# { kind, item } for an item id, or {} if there is no such item.
static func item_by_id(id: String) -> Dictionary:
	for kind in KINDS:
		for item in KINDS[kind]:
			if item.id == id:
				return {"kind": kind, "item": item}
	return {}


static func home_of(state: Dictionary) -> Dictionary:
	return Economy.HOMES[mini(int(state.home.level), Economy.HOMES.size()) - 1]


static func home_index(id: String) -> int:
	for i in Economy.HOMES.size():
		if Economy.HOMES[i].id == id:
			return i
	return -1


# Whether Nemla has an item. A home counts once Nemla has lived there; the
# first car and the first tool come with every game.
static func owns(state: Dictionary, id: String) -> bool:
	var found := item_by_id(id)
	if found.is_empty():
		return false
	var kind: String = found.kind
	if kind == "home":
		return home_index(id) < int(state.home.level)
	if kind == "room":
		return state.home.rooms.has(id)
	if found.item.price == 0:
		return true
	return state.owned[LIST[kind]].has(id)


static func perks(state: Dictionary) -> Dictionary:
	var p := {
		"jobs": Economy.JOBS_PER_HOME * (mini(int(state.home.level), Economy.HOMES.size()) - 1),
		"pay": 0.0, "market": 1, "marketPlus": 0, "grow": 1.0, "sells": 0.0, "sleep": 1.0, "helpers": 0,
		"servicePay": {},
		"drop": {"hunger": 1.0, "energy": 1.0, "clean": 1.0, "fun": 1.0},
		"meal": Economy.MEAL.hunger, "washFun": 0, "playFun": Economy.PLAY_FUN,
	}
	for item in _working(state):
		p.jobs += item.get("jobs", 0)
		p.pay += item.get("pay", 0.0)
		p.sells += item.get("sells", 0.0)
		p.helpers += item.get("helpers", 0)
		p.market *= item.get("market", 1)
		p.grow *= item.get("grow", 1.0)
		p.sleep *= item.get("sleep", 1.0)
		var drop: Dictionary = item.get("drop", {})
		for need in drop:
			p.drop[need] *= drop[need]
		p.meal = maxi(p.meal, item.get("meal", 0))
		p.playFun = maxi(p.playFun, item.get("playFun", 0))
		p.washFun += item.get("washFun", 0)
	_add_friends(state, p)
	# A messy room makes Nemla dirty twice as fast.
	if state.get("problem", {}).get("kind", "") == "mess":
		p.drop.clean *= 2.0
	return p


# Each bug friend helps all the time, more with each heart.
static func _add_friends(state: Dictionary, p: Dictionary) -> void:
	for bug in Economy.BUGS:
		var h := Friends.hearts(state, bug.id) if state.has("friends") else 0
		if h == 0:
			continue
		var v: float = bug.per_heart * h
		match bug.perk:
			"dropClean":
				p.drop.clean *= 1.0 - v
			"dropFun":
				p.drop.fun *= 1.0 - v
			"dropEnergy":
				p.drop.energy *= 1.0 - v
			"payTravaux", "payAuto", "payEvenement":
				var service: String = bug.service
				p.servicePay[service] = p.servicePay.get(service, 0.0) + v
			"grow":
				p.grow *= 1.0 - v
			"market":
				p.marketPlus += int(v)
			"pay":
				p.pay += v


# What a friend's perk adds up to now, for the screen: a percent, or a count
# for the firefly's market.
static func friend_perk_value(state: Dictionary, bug: Dictionary) -> int:
	var h := Friends.hearts(state, bug.id)
	return roundi(bug.per_heart * h) if bug.perk == "market" else roundi(bug.per_heart * h * 100)


# The items whose perks are working now.
static func _working(state: Dictionary) -> Array:
	var items := []
	for room in Economy.ROOMS:
		if state.home.rooms.has(room.id):
			items.append(room)
	for list in [Economy.CARS, Economy.EQUIPMENT]:
		for item in list:
			if owns(state, item.id):
				items.append(item)
	for outfit in Economy.CLOTHES:
		if outfit.id == state.nemla.outfit:
			items.append(outfit)
	return items
