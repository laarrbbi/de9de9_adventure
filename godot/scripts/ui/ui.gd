# The look of the game: De9De9 brand colours and fonts (the same as the web
# version's style.css), and small builders for the pieces every screen uses:
# cards, labels, pictures, bars and things to tap. Screens are built in code
# from these, so they stay consistent.
class_name UI

const TEAL := Color("#65cbc4")
const TEAL_INK := Color("#16736c")
const TEAL_SOFT := Color("#dff4f1")
const RED := Color("#e7464e")
const RED_INK := Color("#b42f38")
const RED_SOFT := Color("#fde5e6")
const GOLD := Color("#ffc93c")
const GOLD_INK := Color("#8a5800")
const GOLD_SOFT := Color("#fff3cf")
const ORANGE := Color("#ff8515")
const INK := Color("#2f3f47")
const MUTED := Color("#56696f")
const LINE := Color("#e1ebe9")
const PAGE := Color("#f3f8f7")
const CARD := Color("#ffffff")
const FAINT := Color("#e9efee")
const SHADOW := Color(0.184, 0.247, 0.278, 0.12)

const WIDTH := 390.0
const SIDE := 16.0

static var _fonts := {}
static var _textures := {}


# "display" is Fredoka for titles and numbers; "body" + weight is Plus
# Jakarta Sans for everything else.
static func font(kind := "body800") -> Font:
	if _fonts.has(kind):
		return _fonts[kind]
	var display := kind == "display"
	var file: FontFile = load("res://assets/fonts/%s" % ("fredoka-latin-wght-normal.woff2" if display else "plus-jakarta-sans-latin-wght-normal.woff2"))
	var variation := FontVariation.new()
	variation.base_font = file
	var weight := 600 if display else int(kind.substr(4))
	variation.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): weight}
	_fonts[kind] = variation
	return variation


static func label(text: String, size := 14, color := INK, kind := "body800") -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font(kind))
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


static func wrapped(l: Label) -> Label:
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 1
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return l


static func style(fill: Color, radius := 16, pad := Vector4(12, 12, 12, 12), shadow := false) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = fill
	s.set_corner_radius_all(radius)
	s.corner_detail = 6
	s.content_margin_left = pad.x
	s.content_margin_top = pad.y
	s.content_margin_right = pad.z
	s.content_margin_bottom = pad.w
	s.anti_aliasing = true
	if shadow:
		s.shadow_color = SHADOW
		s.shadow_size = 3
		s.shadow_offset = Vector2(0, 1)
	return s


static func card(fill := CARD, radius := 16, pad := Vector4(12, 12, 12, 12), shadow := true) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", style(fill, radius, pad, shadow))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p


static func restyle(p: PanelContainer, fill: Color, border := Color.TRANSPARENT, border_width := 0) -> void:
	var s: StyleBoxFlat = p.get_theme_stylebox("panel").duplicate()
	s.bg_color = fill
	s.border_color = border
	s.set_border_width_all(border_width)
	p.add_theme_stylebox_override("panel", s)


static func vbox(gap := 8) -> VBoxContainer:
	var b := VBoxContainer.new()
	b.add_theme_constant_override("separation", gap)
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return b


static func hbox(gap := 8) -> HBoxContainer:
	var b := HBoxContainer.new()
	b.add_theme_constant_override("separation", gap)
	b.alignment = BoxContainer.ALIGNMENT_BEGIN
	b.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return b


static func grid(columns: int, gap := 10) -> GridContainer:
	var g := GridContainer.new()
	g.columns = columns
	g.add_theme_constant_override("h_separation", gap)
	g.add_theme_constant_override("v_separation", gap)
	g.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return g


static func spacer() -> Control:
	var c := Control.new()
	c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c


static func tex(path: String) -> Texture2D:
	if not _textures.has(path):
		_textures[path] = load(path)
	return _textures[path]


static func picture(path: String, size: Vector2, tint := Color.WHITE) -> TextureRect:
	var r := TextureRect.new()
	r.texture = tex(path)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = size
	r.size = size
	r.modulate = tint
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


static func icon(name: String, size := 22.0, color := INK) -> TextureRect:
	return picture("res://assets/art/icons/%s.svg" % name, Vector2(size, size), color)


static func coin(size := 22.0) -> TextureRect:
	return picture("res://assets/art/icons/coin.svg", Vector2(size, size))


static func item(id: String, size := 56.0) -> TextureRect:
	return picture("res://assets/art/items/%s.svg" % id, Vector2(size, size))


static func centered(child: Control) -> CenterContainer:
	var c := CenterContainer.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(child)
	return c


static func bar(height := 8.0, track := Color("#eef2f1"), fill := TEAL) -> Bar:
	var b := Bar.new()
	b.track = track
	b.fill = fill
	b.custom_minimum_size = Vector2(0, height)
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return b


# A coin and an amount, like "◎ 150".
static func price(amount, size := 15, color := INK, coin_size := 16.0) -> HBoxContainer:
	var row := hbox(4)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_child(centered(coin(coin_size)))
	row.add_child(label(str(amount), size, color, "display"))
	return row


# A rounded button made of a card: `content` is a Control or a text.
static func button(content, fill := GOLD, color := INK, size := 15, pad := Vector4(12, 0, 12, 0), radius := 13, height := 44.0) -> PanelContainer:
	var p := card(fill, radius, pad, false)
	p.custom_minimum_size.y = height
	var inner: Control = content if content is Control else label(content, size, color, "display")
	if inner is Label:
		inner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		inner.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	p.add_child(inner if (inner is Label) else centered(inner))
	return p


# Makes any control a button: it calls `action` on a tap, ignores a drag
# that scrolls the screen, and shrinks a little while pressed.
static func on_tap(control: Control, action: Callable) -> Control:
	control.mouse_filter = Control.MOUSE_FILTER_STOP
	var pressed_at := [null]
	control.gui_input.connect(func(event: InputEvent):
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				pressed_at[0] = event.global_position
				control.pivot_offset = control.size / 2
				control.scale = Vector2(0.97, 0.97)
			else:
				control.scale = Vector2.ONE
				var start = pressed_at[0]
				pressed_at[0] = null
				if start != null and start.distance_to(event.global_position) < 12 and Rect2(Vector2.ZERO, control.size).has_point(event.position):
					action.call()
		elif event is InputEventMouseMotion and pressed_at[0] != null and pressed_at[0].distance_to(event.global_position) >= 12:
			pressed_at[0] = null
			control.scale = Vector2.ONE)
	return control


static func clear(node: Node) -> void:
	for child in node.get_children():
		node.remove_child(child)
		child.queue_free()


# The title row of a screen: a big title and a line under it.
static func title(text: String, sub := "") -> VBoxContainer:
	var box := vbox(2)
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_child(label(text, 25, INK, "display"))
	if sub != "":
		box.add_child(wrapped(label(sub, 12, MUTED, "body700")))
	return box


# Small grey capitals over a list.
static func caps(text: String, color := MUTED) -> Label:
	var l := label(text.to_upper(), 11, color, "body800")
	return l
