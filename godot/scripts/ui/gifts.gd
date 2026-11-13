# Pieces the friend screens share: a bug's portrait, its hearts, and the
# gift picker (crops from the barn, the bug's favourite marked, or a gift box).
class_name Gifts


static func portrait(id: String, size := 52.0, met := true) -> PanelContainer:
	var circle := UI.card(UI.PAGE, int(size), Vector4.ZERO, false)
	circle.custom_minimum_size = Vector2(size + 8, size + 8)
	var pic := UI.picture("res://assets/art/bugs/%s.svg" % id, Vector2(size, size), Color.WHITE if met else Color(0.13, 0.16, 0.18, 0.9))
	circle.add_child(UI.centered(pic))
	return circle


static func hearts(n: int, size := 16.0) -> HBoxContainer:
	var row := UI.hbox(2)
	for i in Economy.HEARTS_AT.size():
		row.add_child(UI.picture("res://assets/art/icons/heart_%s.svg" % ("full" if i < n else "empty"), Vector2(size, size)))
	return row


# The gifts Nemla can give this bug now; tapping one gives it.
static func picker(state: Dictionary, id: String) -> VBoxContainer:
	var bug := Friends.bug_by_id(id)
	var box := UI.vbox(8)
	box.add_child(UI.label(Words.t("friends.pickGift", {"bug": Words.t("bug." + id)}), 12, UI.MUTED, "body800"))
	var flow := HFlowContainer.new()
	flow.add_theme_constant_override("h_separation", 8)
	flow.add_theme_constant_override("v_separation", 8)
	flow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var any := false
	for crop in Economy.CROPS:
		var have: int = state.garden.barn.get(crop.id, 0)
		if have <= 0:
			continue
		any = true
		var loved: bool = crop.id == bug.loves
		var row := UI.hbox(4)
		row.add_child(UI.centered(UI.picture("res://assets/art/crops/icon_%s.svg" % crop.id, Vector2(26, 26))))
		row.add_child(UI.label("%s ×%d" % [Words.t("crop." + crop.id), have], 13, UI.INK, "body800"))
		if loved:
			row.add_child(UI.centered(UI.picture("res://assets/art/icons/heart_full.svg", Vector2(14, 14))))
		var chip := UI.card(UI.GOLD_SOFT if loved else UI.CARD, 14, Vector4(8, 6, 10, 6), false)
		UI.restyle(chip, UI.GOLD_SOFT if loved else UI.CARD, UI.GOLD if loved else UI.LINE, 2)
		chip.add_child(row)
		chip.custom_minimum_size.y = 44
		UI.on_tap(chip, func(): Game.gift(id, crop.id))
		flow.add_child(chip)
	var gift_row := UI.hbox(5)
	gift_row.add_child(UI.centered(UI.picture("res://assets/art/icons/gift.svg", Vector2(26, 26))))
	gift_row.add_child(UI.label(Words.t("friends.giftBox"), 13, UI.INK, "body800"))
	gift_row.add_child(UI.centered(UI.coin(14)))
	gift_row.add_child(UI.label(str(Economy.GIFT_BOX), 13, UI.INK, "display"))
	var gift_chip := UI.card(UI.CARD, 14, Vector4(8, 6, 10, 6), false)
	UI.restyle(gift_chip, UI.CARD, UI.LINE, 2)
	gift_chip.custom_minimum_size.y = 44
	gift_chip.add_child(gift_row)
	UI.on_tap(gift_chip, func(): Game.gift(id, "box"))
	flow.add_child(gift_chip)
	box.add_child(flow)
	if not any:
		box.add_child(UI.wrapped(UI.label(Words.t("friends.noCrops"), 12, UI.MUTED, "body600")))
	return box


# A small link to De9De9, for the real-life side of a service.
static func link(text: String) -> Control:
	var row := UI.hbox(4)
	row.add_child(UI.label(text, 12, UI.RED_INK, "body800"))
	row.add_child(UI.label("›", 14, UI.RED_INK, "body800"))
	row.custom_minimum_size.y = 32
	UI.on_tap(row, Game.open_de9de9)
	return row
