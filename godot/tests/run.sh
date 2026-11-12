#!/bin/sh
# Runs the game-rule tests headless. Fails if a test fails or any script
# has an error (a crashed test would otherwise look like a pass).
# GODOT can point at the Godot 4.7 binary; by default `godot` on the PATH.
cd "$(dirname "$0")/.." || exit 1
GODOT="${GODOT:-godot}"
"$GODOT" --headless --path . --import > /dev/null 2>&1
out=$("$GODOT" --headless --path . -s res://tests/run_tests.gd 2>&1)
status=$?
echo "$out" | grep -E "^(FAIL|     )|passed|SCRIPT ERROR|Parse Error" 
if echo "$out" | grep -q "SCRIPT ERROR\|Parse Error"; then
  echo "Script errors above."
  exit 1
fi
exit $status
