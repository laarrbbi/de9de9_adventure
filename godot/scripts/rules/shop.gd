# The Shop: homes (moved into in order), rooms, cars, equipment and clothes.
# Nothing bought is ever lost. Each returns { ok = true, ... } or
# { ok = false, why, ...details for the message }.
class_name Shop


static func no(why: String, details := {}) -> Dictionary:
	var out := {"ok": false, "why": why}
	out.merge(details)
	return out


static func next_home(state: Dictionary) -> Dictionary:
	var level := int(state.home.level)
	return Economy.HOMES[level] if level < Economy.HOMES.size() else {}


# Whether an item can be bought now, without buying it.
static func check(state: Dictionary, id: String) -> Dictionary:
	var found := Perks.item_by_id(id)
	if found.is_empty():
		return no("missing")
	var kind: String = found.kind
	var item: Dictionary = found.item
	if Perks.owns(state, id):
		return no("owned")
	if kind == "home" and item.id != next_home(state).get("id", ""):
		return no("order", {"home": Economy.HOMES[Perks.home_index(id) - 1].id})
	if kind == "room" and state.home.level < item.home:
		return no("home", {"home": Economy.HOMES[item.home - 1].id})
	if state.coins < item.price:
		return no("coins", {"short": item.price - state.coins})
	return {"ok": true, "kind": kind, "item": item}


static func buy(state: Dictionary, id: String) -> Dictionary:
	var can := check(state, id)
	if not can.ok:
		return can
	var kind: String = can.kind
	var item: Dictionary = can.item
	Wallet.spend(state, item.price)
	if kind == "home":
		state.home.level += 1
	elif kind == "room":
		state.home.rooms.append(id)
	else:
		state.owned[Perks.LIST[kind]].append(id)
	if kind == "clothes":
		state.nemla.outfit = id
	return {"ok": true, "kind": kind, "id": id, "price": item.price}


# Puts on an owned outfit, or takes it off with "".
static func wear(state: Dictionary, id: String) -> Dictionary:
	if id != "" and (Perks.item_by_id(id).get("kind", "") != "clothes" or not Perks.owns(state, id)):
		return no("missing")
	state.nemla.outfit = id
	return {"ok": true, "id": id}
