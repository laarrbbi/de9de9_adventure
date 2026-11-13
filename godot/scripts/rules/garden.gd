# The garden: plots that grow crops in real time (also while the app is
# closed), the barn that keeps the harvest, and the market that buys it.
# Each action returns { ok = true, ... } or { ok = false, why, ...details }.
# Nothing dies: a ripe crop waits in its plot for as long as it takes.
class_name Garden

const MIN := 60000


static func no(why: String, details := {}) -> Dictionary:
	var out := {"ok": false, "why": why}
	out.merge(details)
	return out


static func crop_by_id(id) -> Dictionary:
	for crop in Economy.CROPS:
		if crop.id == id:
			return crop
	return {}


static func empty_plot() -> Dictionary:
	return {"crop": "", "plantedAt": 0, "readyAt": 0}


static func can_grow(state: Dictionary, crop: Dictionary) -> bool:
	return state.nemla.level >= crop.level


# How long a crop planted now would take, in ms. The sprinkler speeds it up.
static func grow_time(state: Dictionary, crop: Dictionary) -> int:
	var first_one: bool = crop.has("first") and state.garden.planted.get(crop.id, 0) == 0
	var minutes: int = crop.first if first_one else crop.grow
	return roundi(minutes * MIN * Perks.perks(state).grow)


# What the market pays for one, with the straw hat's bonus.
static func price_of(state: Dictionary, crop: Dictionary) -> int:
	return roundi(crop.sell * (1.0 + Perks.perks(state).sells))


static func is_ready(plot: Dictionary, now_ms: int) -> bool:
	return plot.crop != "" and now_ms >= plot.readyAt


static func ready_count(state: Dictionary, now_ms: int) -> int:
	return state.garden.plots.filter(func(p): return is_ready(p, now_ms)).size()


# How far the crop has grown, from 0 to 1.
static func progress(plot: Dictionary, now_ms: int) -> float:
	if plot.crop == "":
		return 0.0
	var total: int = plot.readyAt - plot.plantedAt
	return clampf(float(now_ms - plot.plantedAt) / total, 0.0, 1.0) if total > 0 else 1.0


# The drawing to show for a crop that is `share` of the way grown.
static func stage(plot: Dictionary, now_ms: int) -> int:
	if is_ready(plot, now_ms):
		return 3
	var share := progress(plot, now_ms)
	return 0 if share < 0.25 else (1 if share < 0.6 else 2)


static func plant(state: Dictionary, index: int, id: String, now_ms: int) -> Dictionary:
	var crop := crop_by_id(id)
	if index < 0 or index >= state.garden.plots.size() or crop.is_empty():
		return no("missing")
	var plot: Dictionary = state.garden.plots[index]
	if plot.crop != "":
		return no("busy")
	if not can_grow(state, crop):
		return no("level", {"level": crop.level})
	if not Wallet.spend(state, crop.seed):
		return no("coins")
	plot.crop = crop.id
	plot.plantedAt = now_ms
	plot.readyAt = now_ms + grow_time(state, crop)
	state.garden.planted[crop.id] = state.garden.planted.get(crop.id, 0) + 1
	return {"ok": true, "crop": crop.id, "cost": crop.seed}


# Takes a ripe crop into the barn without paying XP.
static func _pick(state: Dictionary, plot: Dictionary) -> Dictionary:
	var crop := crop_by_id(plot.crop)
	plot.merge(empty_plot(), true)
	state.garden.barn[crop.id] = state.garden.barn.get(crop.id, 0) + 1
	state.stats.harvests += 1
	return crop


static func harvest(state: Dictionary, index: int, now_ms: int) -> Dictionary:
	if index < 0 or index >= state.garden.plots.size() or state.garden.plots[index].crop == "":
		return no("empty")
	var plot: Dictionary = state.garden.plots[index]
	if not is_ready(plot, now_ms):
		return no("growing", {"left": plot.readyAt - now_ms})
	var crop := _pick(state, plot)
	return {"ok": true, "crop": crop.id, "levels": Care.gain_xp(state, crop.xp)}


# Every ripe plot at once. `got` counts the crops by id.
static func harvest_all(state: Dictionary, now_ms: int) -> Dictionary:
	var got := {}
	var xp := 0
	var count := 0
	for plot in state.garden.plots:
		if not is_ready(plot, now_ms):
			continue
		var crop := _pick(state, plot)
		got[crop.id] = got.get(crop.id, 0) + 1
		xp += crop.xp
		count += 1
	if count == 0:
		return no("nothingReady")
	return {"ok": true, "count": count, "got": got, "levels": Care.gain_xp(state, xp)}


# Plots: how many fit at this home, and what the next one costs.
static func room_for_plots(state: Dictionary) -> int:
	return Economy.PLOTS_BY_HOME[mini(int(state.home.level), Economy.PLOTS_BY_HOME.size()) - 1]


static func next_plot_price(state: Dictionary) -> int:
	return Economy.plot_price(state.garden.plots.size())


static func buy_plot(state: Dictionary) -> Dictionary:
	var plots: Array = state.garden.plots
	if plots.size() >= room_for_plots(state):
		return no("room")
	var price := next_plot_price(state)
	if not Wallet.spend(state, price):
		return no("coins")
	plots.append(empty_plot())
	return {"ok": true, "price": price, "index": plots.size() - 1}


# The market: how many it buys a day (more with the pickup truck), and how
# many more today. The count resets on the first sale of a new day.
static func market_size(state: Dictionary) -> int:
	var perks := Perks.perks(state)
	return Economy.MARKET_PER_DAY * perks.market + perks.marketPlus


static func market_left(state: Dictionary, now_ms: int) -> int:
	var market: Dictionary = state.garden.market
	var size := market_size(state)
	return maxi(0, size - int(market.sold)) if market.day == Clock.day_key(now_ms) else size


# Sells up to `count` of one crop from the barn, as many as the market
# still takes today. `short` says the market took fewer than asked.
static func sell(state: Dictionary, id: String, now_ms: int, count := 1 << 30) -> Dictionary:
	var crop := crop_by_id(id)
	var have: int = state.garden.barn.get(id, 0) if not crop.is_empty() else 0
	if have <= 0:
		return no("nothing")
	var left := market_left(state, now_ms)
	if left <= 0:
		return no("market")
	var wanted := mini(have, count)
	var sold := mini(wanted, left)
	var market: Dictionary = state.garden.market
	var today := Clock.day_key(now_ms)
	if market.day != today:
		market.day = today
		market.sold = 0
	market.sold += sold
	state.garden.barn[id] = have - sold
	state.stats.sold += sold
	var coins := sold * price_of(state, crop)
	Wallet.earn(state, coins)
	return {"ok": true, "crop": id, "count": sold, "coins": coins, "short": sold < wanted}


# Sells the whole barn, the best-paying crops first while the market fills.
static func sell_all(state: Dictionary, now_ms: int) -> Dictionary:
	var count := 0
	var coins := 0
	var short := false
	var best := Economy.CROPS.duplicate()
	best.sort_custom(func(a, b): return price_of(state, a) > price_of(state, b))
	for crop in best:
		if state.garden.barn.get(crop.id, 0) <= 0:
			continue
		var result := sell(state, crop.id, now_ms)
		if not result.ok:
			short = result.why == "market"
			if short:
				break
			continue
		count += result.count
		coins += result.coins
		short = result.short
	if count == 0:
		return no("market" if short else "nothing")
	return {"ok": true, "count": count, "coins": coins, "short": short}


# The tractor: harvests every ripe plot and plants it again with the same
# crop, and plants the picked seed in every empty plot, while the coins last.
static func has_tractor(state: Dictionary) -> bool:
	return Perks.owns(state, "tractor")


static func tractor(state: Dictionary, now_ms: int) -> Dictionary:
	if not has_tractor(state):
		return no("missing")
	var plots: Array = state.garden.plots
	var got := {}
	var harvested := 0
	var planted := 0
	var xp := 0
	var short := false
	for index in plots.size():
		var plot: Dictionary = plots[index]
		var crop_id: String = state.garden.seed
		if is_ready(plot, now_ms):
			var picked := _pick(state, plot)
			got[picked.id] = got.get(picked.id, 0) + 1
			harvested += 1
			xp += picked.xp
			crop_id = picked.id
		elif plot.crop != "":
			continue
		var result := plant(state, index, crop_id, now_ms)
		if result.ok:
			planted += 1
		elif result.why == "coins":
			short = true
	if harvested == 0 and planted == 0:
		return no("coins" if short else "nothingToDo")
	return {"ok": true, "harvested": harvested, "planted": planted, "got": got, "short": short, "levels": Care.gain_xp(state, xp)}


static func barn_total(state: Dictionary) -> int:
	var total := 0
	for id in state.garden.barn:
		total += int(state.garden.barn[id])
	return total
