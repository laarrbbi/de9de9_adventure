extends TestCase

const PATH := "user://test_save.json"


func test_no_save_starts_a_new_game() -> void:
	DirAccess.remove_absolute(PATH)
	var loaded := SaveGame.load_game(123, PATH)
	eq(loaded.fresh, true, "fresh")
	eq(loaded.state, SaveGame.new_game(123), "new game")


func test_saved_game_comes_back_as_it_was() -> void:
	var s := SaveGame.new_game(5)
	s.coins = 777
	s.nemla.level = 3
	s.garden.plots[0] = {"crop": "mint", "plantedAt": 1794000000000, "readyAt": 1794000120000}
	eq(SaveGame.save_game(s, PATH), true, "saved")
	var loaded := SaveGame.load_game(99, PATH)
	eq(loaded.fresh, false, "not fresh")
	eq(loaded.state, s, "same save")
	eq(typeof(loaded.state.coins), TYPE_INT, "whole numbers stay whole")


func test_missing_fields_are_filled_in() -> void:
	var old := SaveGame.new_game(5)
	old.erase("garden")
	old.stats.erase("harvests")
	old.coins = 42
	SaveGame.save_game(old, PATH)
	var s: Dictionary = SaveGame.load_game(99, PATH).state
	eq(s.coins, 42, "coins kept")
	eq(s.garden.plots.size(), Economy.START_PLOTS, "garden added")
	eq(s.stats.harvests, 0, "stat added")


func test_unreadable_save_is_kept_aside() -> void:
	var file := FileAccess.open(PATH, FileAccess.WRITE)
	file.store_string("{broken")
	file.close()
	var loaded := SaveGame.load_game(1, PATH)
	eq(loaded.fresh, true, "fresh")
	eq(FileAccess.get_file_as_string(PATH + ".unreadable"), "{broken", "kept aside")
	DirAccess.remove_absolute(PATH)
	DirAccess.remove_absolute(PATH + ".unreadable")
