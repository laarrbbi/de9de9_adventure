# Nemla's level. XP comes from almost everything; each new level pays coins.
class_name Level


# Adds XP and returns the levels reached on the way, usually none.
static func add_xp(nemla: Dictionary, xp: int) -> Array:
	nemla.xp += xp
	var reached := []
	while nemla.xp >= Economy.xp_to_next(nemla.level):
		nemla.xp -= Economy.xp_to_next(nemla.level)
		nemla.level += 1
		reached.append(nemla.level)
	return reached


# How far into the current level, from 0 to 1, for the XP bar.
static func progress(nemla: Dictionary) -> float:
	return float(nemla.xp) / Economy.xp_to_next(nemla.level)
