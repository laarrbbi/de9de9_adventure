# The Garden screen: the seeds to choose from, the plots, and the market.
# It only shows the save; taps go to Game.garden_act.
extends VBoxContainer

var _harvest_all: PanelContainer
var _harvest_label: Label
var _harvest_icon: Control
var _seeds: GridContainer
var _field: PanelContainer
var _plots: GridContainer
var _field_note: Label
var _market_left: Label
var _barn: VBoxContainer
var _market_note: Label
var _keys := {"seeds": "", "plots": "", "barn": ""}
var _growing := []
var _plot_cards := []
var _rows := {}


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	mouse_filter = MOUSE_FILTER_IGNORE

	var top := UI.hbox(12)
	top.add_child(UI.title(Words.t("garden.title"), Words.t("garden.sub")))
	var hrow := UI.hbox(6)
	_harvest_icon = UI.centered(Control.new())
	hrow.add_child(_harvest_icon)
	_harvest_label = UI.label("", 15, UI.INK, "display")
	hrow.add_child(_harvest_label)
	_harvest_all = UI.button(hrow)
	UI.on_tap(_harvest_all, func(): Game.garden_act(_harvest_all.get_meta("act", "harvestAll")))
	top.add_child(UI.centered(_harvest_all))
	add_child(top)

	_seeds = UI.grid(3, 8)
	add_child(_seeds)

	_field = UI.card(Color("#cdeac0"), 24, Vector4(10, 12, 10, 12), false)
	_plots = UI.grid(3, 8)
	_plots.add_theme_constant_override("v_separation", 10)
	_field.add_child(_plots)
	add_child(_field)
	_field_note = UI.wrapped(UI.label("", 12, UI.MUTED, "body700"))
	_field_note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_field_note)

	var market := UI.card(UI.CARD, 18, Vector4(14, 12, 14, 14), true)
	var mbox := UI.vbox(4)
	var mtop := UI.hbox(8)
	mtop.add_child(UI.label(Words.t("market.title"), 19, UI.INK, "display"))
	mtop.add_child(UI.spacer())
	_market_left = UI.label("", 12, UI.TEAL_INK, "body800")
	mtop.add_child(UI.centered(_market_left))
	mbox.add_child(mtop)
	_barn = UI.vbox(0)
	mbox.add_child(_barn)
	_market_note = UI.wrapped(UI.label("", 12, UI.MUTED, "body700"))
	mbox.add_child(_market_note)
	market.add_child(mbox)
	add_child(market)


func update(state: Dictionary, now: int) -> void:
	var garden: Dictionary = state.garden
	var ready := Garden.ready_count(state, now)
	# With the tractor, one button harvests and replants everything.
	var tractor := Garden.has_tractor(state)
	var empty: bool = garden.plots.any(func(p): return p.crop == "")
	_harvest_all.visible = (ready > 0 or empty) if tractor else ready >= 2
	_harvest_all.set_meta("act", "tractor" if tractor else "harvestAll")
	_harvest_label.text = Words.t("garden.tractor") if tractor else Words.t("garden.harvestAll", {"n": ready})
	if _harvest_icon.get_child_count() == 0 or _harvest_icon.get_meta("tractor", false) != tractor:
		UI.clear(_harvest_icon)
		_harvest_icon.add_child(UI.item("tractor", 26) if tractor else UI.icon("garden", 18, UI.INK))
		_harvest_icon.set_meta("tractor", tractor)

	_draw_seeds(state)
	_draw_plots(state, now)
	for g in _growing:
		var plot: Dictionary = g.plot
		g.time.text = Words.countdown(plot.readyAt - now)
		g.bar.value = Garden.progress(plot, now)

	var left := Garden.market_left(state, now)
	_market_left.text = Words.t("market.left", {"n": left}) if left else Words.t("market.closed")
	_market_left.add_theme_color_override("font_color", UI.TEAL_INK if left else UI.RED_INK)
	_draw_barn(state, left)
	if not left:
		_market_note.text = Words.t("market.fullNote", {"time": Words.duration(Clock.ms_to_midnight(now))})
	else:
		_market_note.text = "" if Garden.barn_total(state) else Words.t("market.empty")
	_market_note.visible = _market_note.text != ""
	var full: bool = garden.plots.size() >= Garden.room_for_plots(state)
	_field_note.visible = full
	_field_note.text = Words.t("garden.noRoom", {"n": Garden.room_for_plots(state)})


func _draw_seeds(state: Dictionary) -> void:
	var key := "%s|%s|%s" % [state.garden.seed, state.nemla.level, Economy.CROPS.map(func(c): return Garden.grow_time(state, c) + Garden.price_of(state, c))]
	if key == _keys.seeds:
		return
	_keys.seeds = key
	UI.clear(_seeds)
	for crop in Economy.CROPS:
		var locked := not Garden.can_grow(state, crop)
		var on: bool = crop.id == state.garden.seed
		var card := UI.card(UI.FAINT if locked else (UI.TEAL_SOFT if on else UI.CARD), 16, Vector4(4, 8, 4, 10), not locked)
		card.size_flags_horizontal = SIZE_EXPAND_FILL
		if on:
			UI.restyle(card, UI.TEAL_SOFT, UI.TEAL, 2)
		var box := UI.vbox(2)
		box.alignment = BoxContainer.ALIGNMENT_CENTER
		var pic := UI.picture("res://assets/art/crops/icon_%s.svg" % crop.id, Vector2(34, 34), Color(1, 1, 1, 0.45) if locked else Color.WHITE)
		box.add_child(UI.centered(pic))
		var name := UI.label(Words.t("crop." + crop.id), 14, UI.INK, "body800")
		name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		box.add_child(name)
		if locked:
			box.add_child(_center_label(Words.t("work.needsLevel", {"level": crop.level}), UI.MUTED))
			UI.on_tap(card, func(): Game.garden_act("seedLocked", crop.id))
		else:
			var line := UI.hbox(3)
			line.alignment = BoxContainer.ALIGNMENT_CENTER
			line.add_child(UI.centered(UI.coin(11)))
			line.add_child(UI.label("%d · %s" % [crop.seed, Words.duration(Garden.grow_time(state, crop))], 11, UI.TEAL_INK if on else UI.MUTED, "body700"))
			box.add_child(line)
			box.add_child(_center_label(Words.t("garden.sells", {"coins": Garden.price_of(state, crop)}), UI.GOLD_INK))
			UI.on_tap(card, func(): Game.garden_act("seed", crop.id))
		card.add_child(box)
		_seeds.add_child(card)


func _center_label(text: String, color: Color) -> Label:
	var l := UI.label(text, 11, color, "body700")
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l


func _draw_plots(state: Dictionary, now: int) -> void:
	var plots: Array = state.garden.plots
	var seed := Garden.crop_by_id(state.garden.seed)
	var price := Garden.next_plot_price(state)
	var room := Garden.room_for_plots(state)
	var stages := plots.map(func(p): return "-" if p.crop == "" else "%s%d" % [p.crop, Garden.stage(p, now)])
	var key := "%s|%s|%s|%s" % [seed.id, room, state.coins >= price, stages]
	if key == _keys.plots:
		return
	_keys.plots = key
	UI.clear(_plots)
	_growing.clear()
	_plot_cards.clear()
	for i in plots.size():
		var plot: Dictionary = plots[i]
		var cell := UI.vbox(4)
		cell.size_flags_horizontal = SIZE_EXPAND_FILL
		cell.custom_minimum_size.y = 98
		var art := "res://assets/art/crops/plot_empty.svg" if plot.crop == "" else "res://assets/art/crops/%s_%d.svg" % [plot.crop, Garden.stage(plot, now)]
		var pic := UI.picture(art, Vector2(100, 64))
		pic.size_flags_horizontal = SIZE_EXPAND_FILL
		pic.stretch_mode = TextureRect.STRETCH_SCALE
		pic.custom_minimum_size = Vector2(0, 0)
		var holder := AspectRatioContainer.new()
		holder.ratio = 100.0 / 64.0
		holder.mouse_filter = MOUSE_FILTER_IGNORE
		holder.custom_minimum_size.y = 64
		holder.add_child(pic)
		cell.add_child(holder)
		if plot.crop == "":
			var act := UI.hbox(3)
			act.add_child(UI.label(Words.t("garden.plant"), 12, Color.WHITE, "body800"))
			act.add_child(UI.centered(UI.coin(12)))
			act.add_child(UI.label(str(seed.seed), 12, Color.WHITE, "body800"))
			cell.add_child(UI.centered(_pill(act, UI.INK)))
		elif Garden.is_ready(plot, now):
			var pill := _pill(UI.label(Words.t("garden.harvest"), 12, UI.INK, "body800"), UI.GOLD)
			cell.add_child(UI.centered(pill))
			_hop(pill)
		else:
			var info := UI.hbox(4)
			info.add_child(UI.label(Words.t("crop." + plot.crop), 11, UI.INK, "body800"))
			info.add_child(UI.spacer())
			var time := UI.label("", 11, Color("#3d6b36"), "body800")
			info.add_child(time)
			cell.add_child(info)
			var bar := UI.bar(6, Color(1, 1, 1, 0.75), Color("#4f9e4c"))
			cell.add_child(bar)
			_growing.append({"plot": plot, "time": time, "bar": bar})
		UI.on_tap(cell, func(): Game.garden_act("plot", i))
		_plots.add_child(cell)
		_plot_cards.append(cell)
	if plots.size() < room:
		var buy := Control.new()
		buy.custom_minimum_size = Vector2(0, 98)
		buy.size_flags_horizontal = SIZE_EXPAND_FILL
		var dash := Dashed.new()
		dash.color = Color("#8fbf80")
		dash.fill = Color(1, 1, 1, 0.35)
		dash.radius = 14
		buy.add_child(dash)
		var box := UI.vbox(8)
		box.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
		box.alignment = BoxContainer.ALIGNMENT_CENTER
		var plus := UI.card(Color(1, 1, 1, 0.85), 20, Vector4.ZERO, false)
		plus.custom_minimum_size = Vector2(40, 40)
		plus.add_child(UI.centered(UI.icon("plus", 22, Color("#3a7d36"))))
		box.add_child(UI.centered(plus))
		var cost := UI.hbox(3)
		cost.add_child(UI.centered(UI.coin(12)))
		cost.add_child(UI.label(Words.num(price), 12, Color.WHITE, "body800"))
		box.add_child(UI.centered(_pill(cost, UI.INK if state.coins >= price else Color("#6b7c80"))))
		buy.add_child(box)
		UI.on_tap(buy, func(): Game.garden_act("buyPlot"))
		_plots.add_child(buy)
	# The rest of this home's room, as faint outlines.
	for i in maxi(0, room - plots.size() - 1):
		var spare := Control.new()
		spare.custom_minimum_size = Vector2(0, 84)
		spare.size_flags_horizontal = SIZE_EXPAND_FILL
		spare.mouse_filter = MOUSE_FILTER_IGNORE
		var dash := Dashed.new()
		dash.color = Color("#bfe0b2")
		dash.radius = 14
		spare.add_child(dash)
		_plots.add_child(spare)


func _pill(content: Control, fill: Color) -> PanelContainer:
	var p := UI.card(fill, 999, Vector4(10, 4, 10, 4), false)
	p.add_child(content)
	return p


func _hop(node: Control) -> void:
	var tween := node.create_tween().set_loops()
	tween.tween_property(node, "position:y", -4.0, 0.5).as_relative().set_trans(Tween.TRANS_SINE)
	tween.tween_property(node, "position:y", 4.0, 0.5).as_relative().set_trans(Tween.TRANS_SINE)


func _draw_barn(state: Dictionary, left: int) -> void:
	var barn: Dictionary = state.garden.barn
	var key := "%s|%s" % [left > 0, Economy.CROPS.map(func(c): return "%s:%s" % [barn.get(c.id, 0), Garden.price_of(state, c)])]
	if key == _keys.barn:
		return
	_keys.barn = key
	UI.clear(_barn)
	_rows.clear()
	var total := 0
	var kinds := 0
	for crop in Economy.CROPS:
		var count: int = barn.get(crop.id, 0)
		if count <= 0:
			continue
		kinds += 1
		var price := Garden.price_of(state, crop)
		total += count * price
		var row := UI.hbox(10)
		row.custom_minimum_size.y = 60
		var icon := UI.card(Color("#eef6ea"), 22, Vector4.ZERO, false)
		icon.custom_minimum_size = Vector2(44, 44)
		icon.add_child(UI.centered(UI.picture("res://assets/art/crops/icon_%s.svg" % crop.id, Vector2(34, 34))))
		row.add_child(UI.centered(icon))
		var text := UI.vbox(2)
		text.size_flags_horizontal = SIZE_EXPAND_FILL
		text.alignment = BoxContainer.ALIGNMENT_CENTER
		text.add_child(UI.label(Words.t("market.count", {"crop": Words.t("crop." + crop.id), "n": count}), 14, UI.INK, "body800"))
		text.add_child(UI.label(Words.t("market.price", {"coins": price}), 11, UI.MUTED, "body600"))
		row.add_child(text)
		row.add_child(UI.centered(_sell_button(Words.t("market.sell"), count * price, left > 0, func(): Game.garden_act("sell", crop.id))))
		_barn.add_child(_rule())
		_barn.add_child(row)
		_rows[crop.id] = row
	if kinds > 1:
		var all := _sell_button(Words.t("market.sellAll"), total, left > 0, func(): Game.garden_act("sellAll"))
		_barn.add_child(all)


func _rule() -> ColorRect:
	var line := ColorRect.new()
	line.color = UI.LINE
	line.custom_minimum_size.y = 1
	line.mouse_filter = MOUSE_FILTER_IGNORE
	return line


func _sell_button(text: String, coins: int, open: bool, action: Callable) -> PanelContainer:
	var row := UI.hbox(5)
	row.add_child(UI.label(text, 15, UI.INK if open else UI.MUTED, "display"))
	row.add_child(UI.centered(UI.coin(15)))
	row.add_child(UI.label("+" + Words.num(coins), 15, UI.INK if open else UI.MUTED, "display"))
	var b := UI.button(row, UI.GOLD if open else UI.FAINT)
	if open:
		UI.on_tap(b, action)
	return b


# Shows what an action did: a number floating up from a plot or a market row.
func react(what: String, data: Dictionary) -> void:
	var target: Control = null
	if what == "plot" and data.index < _plot_cards.size():
		target = _plot_cards[data.index]
	elif what == "crop":
		target = _rows.get(data.crop, _barn)
	if target == null:
		return
	var l := UI.label(data.text, 17, Color("#2e7d4f"), "display")
	l.add_theme_color_override("font_outline_color", Color.WHITE)
	l.add_theme_constant_override("outline_size", 6)
	l.top_level = true
	l.position = target.global_position + Vector2(target.size.x / 2 - 30, 4)
	add_child(l)
	var tween := l.create_tween().set_parallel()
	tween.tween_property(l, "position:y", l.position.y - 38, 1.2).set_ease(Tween.EASE_OUT)
	tween.tween_property(l, "modulate:a", 0.0, 1.2)
	tween.chain().tween_callback(l.queue_free)


func hint_target(name: String) -> Control:
	var plots: Array = Game.state.garden.plots
	var now := Clock.now()
	for i in mini(plots.size(), _plot_cards.size()):
		if name == "empty_plot" and plots[i].crop == "":
			return _plot_cards[i]
		if name == "ready_plot" and Garden.is_ready(plots[i], now):
			return _plot_cards[i]
	if name == "sell" and not _rows.is_empty():
		return _rows.values()[0].get_child(2)
	return null
