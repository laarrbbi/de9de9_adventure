# De9De9 Adventure

A phone game starring Nemla, the De9De9 mascot. Raise your Nemla, work jobs,
grow a garden, make bug friends, and get richer: more land, a bigger house,
nicer cars, better equipment.

**The game is native, built with Godot 4.7: see [godot/README.md](godot/README.md).**
It runs on Android (APK) and will run on iOS. The web version in `www/` came
first; it stays as the prototype and the source of the drawings and words,
which tools copy into the Godot game.

The plan, with the milestones, is in [docs/PLAN.md](docs/PLAN.md).

## The web prototype

Plain JavaScript, wrapped with Capacitor like De9De9 Play.

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
| `www/js/needs.js`, `care.js`, `jobs.js`, `garden.js`, `shop.js`, `guide.js`, `level.js`, `wallet.js`, `clock.js` | Game rules, no DOM, tested in `test/` |
| `www/js/perks.js` | What Nemla's home, rooms, cars, equipment and outfit add up to. Every rule asks here |
| `www/js/state.js` | The save in localStorage, and upgrades for old saves |
| `www/js/text.js` | Every word the player reads, ready for translation |
| `www/js/art/` | The drawings: Nemla and her outfits, the 5 homes, crops, shop items, icons |
| `www/js/ui/` | The screens: top bar, guide, home, garden, work, shop, the game layer, tab bar, messages |
| `www/js/minigames/` | De9De9 Play's engine and games, adapted to be played as jobs |

## Native apps

The Android and iOS projects aren't created yet. When the game is ready to go
on a phone:

```bash
npm install
npx cap add android   # once
npm run android       # syncs www/ and opens Android Studio
```

## Done so far

Steps M0 to M4 are in both versions; from M5 on, only in the Godot game.


- **M0 Setup:** project, assets, save system, tests, smoke test.
- **M1 Nemla at home:** the little hole, four needs that drop in real time
  (also while the app is closed), eating, washing, playing the radio,
  sleeping in bed, day and night, levels that pay coins.
- **M2 Work:** 5 jobs a day from the bug clients, each one a De9De9 Play
  mini-game (Nemla Fix, Nemla Run, Nemla Tiles from level 2). Pay goes from
  half to one and a half of the job's price by score, plus a work streak
  bonus; a tired Nemla earns less. Jobs tire Nemla and are fun.
- **M3 Garden and market:** 2 plots to start, room for 6 at the little
  hole. Mint, wheat and tomatoes (from level 3) grow in real time, also
  while the app is closed, and wait until you harvest them. The barn keeps
  the harvest; the market buys 30 crops a day. A badge on the Garden tab
  and a message say when crops are ready.
- **M4 Shop and homes:** the Shop sells 5 homes (moved into in order, each
  with its own scene), 4 rooms, 5 cars, 5 tools and 4 outfits, each with a
  perk: more jobs, better pay, faster crops, a bigger market, better care.
  The scooter unlocks express deliveries and the toolbox building jobs (De9a
  Stack); the tractor harvests and replants in one tap; the workshop does 2
  jobs a day for you. The Homes section is Nemla's journey, and the card at
  home shows the next home to save for. A guide leads the first 5 minutes.
- **M5 Bug friends** (Godot): 9 bugs, one per De9De9 service, visit the
  garden; gifts make them friends and grow their hearts; each friend helps
  once a day when called and all the time with a perk. Problems at home (a
  leak, a broken radio, a mess, a flat tire, sickness) are fixed by the
  right friend, with "In real life? Open De9De9" links. The Friends tab is
  the bug book.

To add a job: add it to `JOBS` in `economy.js` and its name to `text.js`. A
new mini-game goes in `www/js/minigames/` and in `minigames/index.js`.

To add a Shop item: add it to its list in `economy.js` (`HOMES`, `ROOMS`,
`CARS`, `EQUIPMENT` or `CLOTHES`) with its perks, its name and perk text to
`text.js` (`item.<id>`, `perk.<id>`), and its drawing to `www/js/art/items.js`.

To add a crop: add it to `CROPS` in `economy.js`, its name to `text.js`
(`crop.<id>`), and its drawing to `PLANTS` in `www/js/art/crops.js`. Old
saves get a barn slot for it by themselves.
