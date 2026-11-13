# The Friends screen: the bug book. Friends show their hearts, what they do
# for Nemla all the time, and two buttons: Call (once a day) and Gift (once
# a day). Bugs not met yet show as shadows, with when they will visit.
extends VBoxContainer

var _count: Label
var _bar: Bar
var _list: VBoxContainer
var _open := ""  # the friend whose gift picker is open
var _key := ""
var _state := {}


func _ready() -> void:
	add_theme_constant_override("separation", 12)
	mouse_filter = MOUSE_FILTER_IGNORE
	add_child(UI.title(Words.t("friends.title"), Words.t("friends.sub")))
	var book := UI.card(UI.CARD, 18, Vector4(14, 12, 14, 12), true)
	var box := UI.vbox(6)
	var top := UI.hbox(8)
	top.add_child(UI.caps(Words.t("friends.book")))
	top.add_child(UI.spacer())
	_count = UI.label("", 13, UI.TEAL_INK, "body800")
	top.add_child(_count)
	box.add_child(top)
	_bar = UI.bar(8)
	box.add_child(_bar)
	book.add_child(box)
	add_child(book)
	_list = UI.vbox(8)
	add_child(_list)


func update(state: Dictionary, now: int) -> void:
	_state = state
	_count.text = Words.t("friends.count", {"n": Friends.count(state), "total": Economy.BUGS.size()})
	_bar.value = float(Friends.count(state)) / Economy.BUGS.size()
	var key := "%s|%s|%s|%s|%s|%s" % [JSON.stringify(state.friends), Clock.day_key(now), state.nemla.level, state.garden.barn, state.coins >= Economy.GIFT_BOX, _open]
	if key == _key:
		return
	_key = key
	UI.clear(_list)
	for bug in Economy.BUGS:
		_list.add_child(_friend_card(state, bug, now) if Friends.is_friend(state, bug.id) else _stranger_card(state, bug))


func _toggle(id: String) -> void:
	Sfx.tap()
	_open = "" if _open == id else id
	_key = ""
	update(_state, Clock.now())


func _friend_card(state: Dictionary, bug: Dictionary, now: int) -> Control:
	var h := Friends.hearts(state, bug.id)
	var card := UI.card(UI.CARD, 16, Vector4(12, 12, 12, 10), true)
	var box := UI.vbox(10)
	var row := UI.hbox(12)
	row.add_child(UI.centered(Gifts.portrait(bug.id)))
	var text := UI.vbox(3)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	var name_row := UI.hbox(8)
	name_row.add_child(UI.label(Words.t("bug." + bug.id), 15, UI.INK, "body800"))
	name_row.add_child(UI.spacer())
	var chip := UI.card(UI.TEAL_SOFT, 999, Vector4(8, 2, 8, 2), false)
	chip.add_child(UI.label(Words.t("service." + bug.service), 11, UI.TEAL_INK, "body800"))
	name_row.add_child(UI.centered(chip))
	text.add_child(name_row)
	text.add_child(Gifts.hearts(h))
	text.add_child(UI.wrapped(UI.label(Words.t("perk.friend." + bug.perk, {"n": Perks.friend_perk_value(state, bug)}), 12, UI.MUTED, "body600")))
	var next := Friends.to_next_heart(state, bug.id)
	var loves := Words.t("friends.maxHearts", {"crop": Words.t("crop." + bug.loves)}) if next == 0 else Words.t("friends.lovesBox", {"crop": Words.t("crop." + bug.loves), "next": next})
	text.add_child(UI.wrapped(UI.label(loves, 11, UI.GOLD_INK, "body700")))
	row.add_child(text)
	box.add_child(row)

	var buttons := UI.hbox(8)
	var called := Friends.called_today(state, bug.id, now)
	var call_row := UI.hbox(6)
	call_row.add_child(UI.centered(UI.icon("phone", 16, UI.MUTED if called else Color.WHITE)))
	call_row.add_child(UI.label(Words.t("friends.called") if called else Words.t("favor." + bug.favor), 14, UI.MUTED if called else Color.WHITE, "display"))
	var call := UI.button(call_row, UI.FAINT if called else UI.TEAL_INK)
	call.size_flags_horizontal = SIZE_EXPAND_FILL
	if not called:
		UI.on_tap(call, func(): Game.call_friend(bug.id))
	buttons.add_child(call)
	var gifted := Friends.gifted_today(state, bug.id, now)
	var gift_row := UI.hbox(6)
	gift_row.add_child(UI.centered(UI.picture("res://assets/art/icons/gift.svg", Vector2(20, 20), Color(1, 1, 1, 0.5) if gifted else Color.WHITE)))
	gift_row.add_child(UI.label(Words.t("friends.gifted") if gifted else Words.t("friends.gift"), 14, UI.MUTED if gifted else UI.INK, "display"))
	var gift := UI.button(gift_row, UI.FAINT if gifted else UI.GOLD)
	gift.custom_minimum_size.x = 110
	if not gifted:
		UI.on_tap(gift, func(): _toggle(bug.id))
	buttons.add_child(gift)
	box.add_child(buttons)
	if _open == bug.id and not gifted:
		box.add_child(Gifts.picker(state, bug.id))
	box.add_child(Gifts.link(Words.t("friends.realLife", {"service": Words.t("service." + bug.service)})))
	card.add_child(box)
	return card


func _stranger_card(state: Dictionary, bug: Dictionary) -> Control:
	var holder := Control.new()
	holder.custom_minimum_size.y = 84
	holder.mouse_filter = MOUSE_FILTER_IGNORE
	var dash := Dashed.new()
	dash.fill = UI.FAINT
	holder.add_child(dash)
	var row := UI.hbox(12)
	row.set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	row.offset_left = 12
	row.offset_right = -12
	row.add_child(UI.centered(Gifts.portrait(bug.id, 52, false)))
	var text := UI.vbox(3)
	text.size_flags_horizontal = SIZE_EXPAND_FILL
	text.alignment = BoxContainer.ALIGNMENT_CENTER
	text.add_child(UI.label(Words.t("friends.unknown"), 15, UI.MUTED, "body800"))
	var soon: bool = state.nemla.level >= bug.meet
	text.add_child(UI.wrapped(UI.label(Words.t("friends.meetSoon") if soon else Words.t("friends.meetAt", {"level": bug.meet}), 12, UI.MUTED, "body600")))
	text.add_child(UI.label(Words.t("service." + bug.service), 11, UI.TEAL_INK, "body800"))
	row.add_child(text)
	holder.add_child(row)
	return holder


func hint_target(_name: String) -> Control:
	return null
