# Runs every test_*.gd in this folder, headless:
#   godot --headless --path godot -s res://tests/run_tests.gd
# Each test file extends TestCase; each method named test_* is one test.
extends SceneTree


func _init() -> void:
	var failed := 0
	var passed := 0
	var dir := DirAccess.open("res://tests")
	var files := Array(dir.get_files()).filter(func(f): return f.begins_with("test_") and f.ends_with(".gd"))
	files.sort()
	for file in files:
		var suite = load("res://tests/" + file).new()
		for method in suite.get_method_list():
			if not method.name.begins_with("test_"):
				continue
			suite.failures = []
			suite.call(method.name)
			if suite.failures.is_empty():
				passed += 1
			else:
				failed += 1
				print("FAIL %s %s" % [file, method.name])
				for failure in suite.failures:
					print("     " + failure)
	print("%d passed, %d failed" % [passed, failed])
	quit(1 if failed else 0)
