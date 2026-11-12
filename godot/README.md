# De9De9 Adventure, native (Godot 4.7)

The game as a native app, built with [Godot 4.7](https://godotengine.org).
Same game as the web prototype in `../www`: Nemla at home, the garden and
market, De9De9 jobs played as mini-games, the Shop with 5 homes, and the
first-5-minutes guide.

## Open it

1. Install Godot 4.7 (the standard version, not .NET).
2. Open `godot/project.godot`. Press F5 to play. The window is phone-sized.

## Build the Android app

Once, in Godot: **Editor > Manage Export Templates > Download** (4.7), and
in **Editor Settings > Export > Android** set the Java SDK (JDK 17 or newer)
and the Android SDK paths. Then **Project > Export > Android > Export
Project**. Or from a terminal:

```bash
godot --headless --path godot --export-release "Android" build/de9de9-adventure.apk
```

A release needs your signing key: set it in the Android preset (Keystore >
Release), or with the `GODOT_ANDROID_KEYSTORE_RELEASE_PATH`, `_USER` and
`_PASSWORD` environment variables. Keep that key safe: every Play Store
update must be signed with it. For the Play Store, export an AAB (Gradle
build) instead of an APK.

## Test it

```bash
GODOT=/path/to/godot godot/tests/run.sh
```

runs every game-rule test headless and fails on any script error.

```bash
xvfb-run godot --path godot --resolution 780x1688 -s res://tests/shots.gd -- /tmp/shots
```

opens the game, plays through a new game (the guide, a job, the garden)
and a saved-up one (the villa, the shop), checks a few things, and saves a
screenshot of each screen. It never touches the player's save.

## Where things are

| Path | What |
|---|---|
| `scripts/rules/` | The game rules: `economy.gd` (every number), needs, care, jobs, garden, shop, perks, guide, clock, the save |
| `scripts/game.gd` | The game (autoload `Game`): loads, saves, runs the clock, carries out what the player does |
| `scripts/ui/` | The screens, built in code from `ui.gd` (colours, fonts, cards) |
| `scripts/ui/home_scene.gd` | Nemla's home, drawn in layers |
| `scripts/minigames/` | `mini_game.gd` (the shared shell) and the four job games |
| `scripts/sfx.gd` | The sounds, made in code (autoload `Sfx`) |
| `scripts/words.gd`, `words_en.gd` | Every word; `words_en.gd` is generated |
| `scripts/art_layout.gd`, `assets/art/` | Where the home's pieces go, and the drawings; generated |
| `tools/` | The tools that generate the drawings and words from the web version |
| `tests/` | Rule tests (`run.sh`) and the screenshot run (`shots.gd`) |

## Change the art or the words

The drawings and words come from the web version, so both stay the same:

```bash
node godot/tools/export_art.mjs    # www/js/art → godot/assets/art and art_layout.gd
node godot/tools/export_text.mjs   # www/js/text.js → godot/scripts/words_en.gd
```

Then open Godot once so it imports the new files.
