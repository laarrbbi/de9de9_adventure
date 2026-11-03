# De9De9 Adventure

A phone game starring Nemla, the De9De9 mascot. Raise your Nemla, work jobs,
grow a garden, make bug friends, and get richer: more land, a bigger house,
nicer cars, better equipment. One web codebase (`www/`), wrapped for Android
and iOS with Capacitor, like De9De9 Play.

The plan, with the milestones, is in [docs/PLAN.md](docs/PLAN.md).

## Run it

```bash
npm start          # the game, at http://localhost:5174
npm test           # the game rules
npm run smoke      # opens the game at phone size, taps through it, saves smoke.png
```

`npm test` needs only Node 20 or newer. `npm run smoke` also needs Playwright
with Chromium (`npm i -D playwright && npx playwright install chromium` if it
isn't installed globally).

## Where things are

| Path | What |
|---|---|
| `www/js/main.js` | Start-up: loads the save, catches up on time away, runs the clock |
| `www/js/economy.js` | Every rate, price and reward. Tune the game here |
| `www/js/needs.js`, `care.js`, `level.js`, `wallet.js`, `clock.js` | Game rules, no DOM, tested in `test/` |
| `www/js/state.js` | The save in localStorage, and upgrades for old saves |
| `www/js/text.js` | Every word the player reads, ready for translation |
| `www/js/art/` | The drawings: Nemla's body, the home scene, icons |
| `www/js/ui/` | The screens: top bar, home, tab bar, messages |

## Native apps

The Android and iOS projects aren't created yet. When the game is ready to go
on a phone:

```bash
npm install
npx cap add android   # once
npm run android       # syncs www/ and opens Android Studio
```

## Done so far

- **M0 Setup:** project, assets, save system, tests, smoke test.
- **M1 Nemla at home:** the little hole, four needs that drop in real time
  (also while the app is closed), eating, washing, playing the radio,
  sleeping in bed, day and night, levels that pay coins.
