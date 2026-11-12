# De9De9 Adventure: the plan

A new phone game starring Nemla. You raise your own Nemla, work jobs, grow a
garden, make bug friends, and get richer and richer: more land, a bigger
house, nicer cars, better equipment.

- Game study: https://claude.ai/artifact/Q9Mn93PB2YBiN6GgFGFD8J
- Screen designs: https://claude.ai/artifact/CJ7oBPCKqwxcpadas9KVqA

Both links are private to the owner until shared.

---

## Part 1: the game

### The main rule

**The game is about rewards.** Players get richer and richer, and they leave
with one feeling: *with De9De9, life gets better.*

Every other rule supports that one:

1. **Every visit pays.** Coins, crops, a gift or a new friend, every time.
2. **Numbers only go up.** You never lose what you bought. Nothing dies,
   crops wait for you, and low needs only lower your pay a little.
3. **Short visits.** 2 to 5 minutes, a few times a day. Things grow while
   the app is closed.
4. **Every De9De9 service shows up.** Each of the 9 services is a bug friend,
   a job, and a problem at home that the right friend fixes.
5. **No paywalls.** No gems, no paid timers, no ads in the way.
6. **Honest about real rewards.** In the game, Nemla gets rich. In real life,
   players win De9De9 points: 1000 points = 1 free service, slowly, with a
   daily cap. We never promise players real money. "Earn money with De9De9"
   is only said about pros, where it is true.

### What the player does

| Screen | What happens | Like |
|---|---|---|
| Home | Nemla's anthill. Needs (hunger, energy, clean, fun), rooms to decorate, problems to fix | Pou, The Sims |
| Garden | Plant, wait, harvest, sell at the market, buy more plots | Hay Day |
| Work | Jobs for clients. Each job is a mini-game from De9De9 Play and pays coins by score | De9De9 Play |
| Shop | Houses, cars, equipment, clothes. Each buy helps Nemla earn more | |
| Friends | 9 bug friends, one per De9De9 service, plus rare bugs | Pokémon |
| Map | New places to unlock with coins and level. Each has new land, crops, bugs and jobs | Stardew |

Plus two overviews, **Nemla's journey** (5 homes, from a little hole to a
palace) and **Rewards** (daily gift, level-up chest, trophies, weekly contest,
wealth titles).

### The money loop

Work a job → earn coins → buy equipment → take bigger jobs → buy the dream
(land, house, car) → unlock new places → and again, bigger each time.

### The first 5 minutes

1. Nemla wakes up in a little hole, hungry. Tap the food. (Teaches needs.)
2. A snail needs a leak fixed. Play Nemla Fix. +150 coins. (Teaches jobs.)
3. Plant mint. The first one grows in 2 minutes. Harvest and sell it.
4. Plant wheat in the second plot, and save up for a third plot (500).
5. A snail visits the garden. Give it a gift and it becomes your first friend.
6. A goal appears: "Save 2,000 coins to move into the Anthill."

### Bug friends and De9De9 services

| Service | Friend | Fixes at home | Perk |
|---|---|---|---|
| Maison | Snail | Messy rooms | Cleans: fills "clean" |
| Travaux | Scarab beetle | Leaks, broken walls | Digs new rooms faster |
| Auto | Ladybug | The car breaks down | Car trips cost less time |
| Beauté | Butterfly | Bad hair day | Outfits give a mood bonus |
| Santé | Bee | Nemla is sick | Heals; crops grow 20% faster |
| Sport | Grasshopper | Low energy | Training fills "energy" |
| Cours | Praying mantis | Nemla can't do a job yet | Teaches skills: higher job pay |
| Événement | Cricket | A boring evening | Festivals pay extra |
| Multimédia | Firefly | Broken phone or TV | Unlocks evenings at home |

You befriend a bug by giving it gifts. There is no catching and no throwing
anything at creatures: Nintendo sued Palworld's studio over patents in 2024,
so we keep our own way of making friends. Each
friend has a level and 5 friendship hearts. You can call each friend once a
day for free. Home problems come with a small "In real life? Open De9De9" link.

---

## Part 2: how we build it

### Technology

Same tools as De9De9 Play, so the same people can work on both:

- **Plain JavaScript modules, no build step.** `npm start` serves `www/`.
- **Screens in HTML and CSS, scenes drawn in SVG.** The screen designs are
  already HTML and SVG, so they turn into code almost directly.
- **Mini-games on canvas,** using a copy of De9De9 Play's `engine.js` that
  reports the score to the job instead of the wallet.
- **Capacitor** for the Android and iOS apps. Android first: most phones in
  Algeria run Android.
- **Saved on the phone** (localStorage) first. Accounts and a server come
  before real rewards are paid out.
- **Tests with Node's built-in runner** for all game rules, plus one
  Playwright smoke test that opens every screen.

Game rules live in plain modules with no DOM, so they can be tested without a
browser. Screens only read the state and call those rules.

### Folders

```
de9de9_adventure/
  README.md
  package.json              npm start, npm test, npm run smoke, ios, android
  capacitor.config.json     appId com.avalonlbs.de9adventure, "De9De9 Adventure"
  docs/PLAN.md              this file
  www/
    index.html
    css/style.css
    assets/                 Nemla, service icons, fonts (copied from De9De9 Play)
    js/
      main.js               start-up, screen switching, tab bar, back button
      state.js              the save: defaults, load, save, version upgrades
      clock.js              real time, catching up after the app was closed
      economy.js            every price, timer and payout in one table
      wallet.js             coins and De9De9 points (De9De9 Play's rules)
      needs.js              hunger, energy, clean, fun
      garden.js             plots, crops, growth, market
      jobs.js               job board, pay by score, daily slots, streak
      shop.js               houses, cars, equipment, clothes, and their perks
      friends.js            bugs, gifts, hearts, calls, visitors
      events.js             problems at home and which friend fixes them
      map.js                places, unlock rules
      rewards.js            daily gift, levels, trophies, wealth titles
      ui/                   one file per screen + shared parts (HUD, tab bar, sheet, toast)
      art/                  SVG drawings: nemla, bugs, crops, cars, homes, places
      minigames/            engine.js + the games used as jobs
  test/                     node --test files, one per rule module
  server/                   later: accounts and the points ledger
```

### The save

One JSON object in localStorage under `de9adventure.save`, with a version
number so old saves can be upgraded:

```js
{
  version: 1,
  lastSeen: 1761900000000,
  nemla: { level: 4, xp: 120, needs: { hunger: 26, energy: 80, clean: 64, fun: 55 }, outfit: 'basic' },
  coins: 1250, totalEarned: 6400,
  points: { balance: 640, day: '2026-10-31', today: 3 },
  home: { level: 2, rooms: ['bedroom', 'kitchen'] },
  garden: {
    plots: [{ crop: 'mint', plantedAt: 0, readyAt: 0 }, { crop: null, plantedAt: 0, readyAt: 0 }],
    seed: 'mint',                       // the seed picked on the Garden screen
    barn: { mint: 8, wheat: 12, tomato: 0 },
    planted: { mint: 3, wheat: 5, tomato: 0 },
    market: { day: '2026-10-31', sold: 12 },
  },
  owned: { cars: ['leafCart', 'scooter'], car: 'scooter', equipment: ['wateringCan'], clothes: [] },
  places: ['home'],
  friends: { beetle: { level: 3, hearts: 3, calledOn: '2026-10-31' } },
  visitors: [{ bug: 'butterfly', until: 0 }],
  jobs: { day: '2026-10-31', board: [], done: 5, streak: 4 },
  events: [{ kind: 'leak', room: 'kitchen', since: 0 }],
  rewards: { giftStreak: 3, lastGiftDay: '2026-10-30', trophies: [], title: 'worker' }
}
```

Saved after every change and when the app goes to the background. On start,
`clock.js` works out what happened while the app was closed: crops that
finished, needs that went down, visitors that came and went.

### Milestones

Each milestone ends with something you can play on a phone. "Done" means:
tests pass, it works at phone size (390×844), no errors in the console, and
the save survives closing the app.

**Phase 1: the core**

- [x] **M0. Setup.** Repo skeleton, Capacitor, assets copied from De9De9
  Play, the save system, test runner, smoke test.
  *Try it:* the app opens and Nemla is there.
- [x] **M1. Nemla at home.** The anthill scene, the HUD, the tab bar, the
  4 needs going down over real time, food, bed, bath, and fun.
  *Try it:* close the app tonight; tomorrow Nemla is hungry.
- [x] **M2. Work.** The job board, the mini-game engine, and the first
  3 jobs: Nemla Fix, Nemla Tiles, Nemla Run. Pay by score, 5 jobs a day,
  work streak. *Try it:* play a job and watch the coins go up.
- [x] **M3. Garden and market.** Plots, 3 crops (mint, wheat, tomato), real
  growth time, harvest, the market, buying plots.
  *Try it:* plant before bed, sell in the morning.

**Phase 2: getting richer**

- [ ] **M4. Shop and homes.** The 5 homes (the scene changes with each),
  digging rooms, cars, equipment with real perks, clothes, the Journey
  screen, and the first-5-minutes tutorial.
  *Try it:* save up, move into the Anthill, buy a scooter, unlock deliveries.
- [ ] **M5. Bug friends.** The 9 friends, garden visitors, gifts and
  hearts, home problems fixed by the right friend, perks, the bug book,
  the "Open De9De9" links. *Try it:* a leak appears and you call Beetle.

**Phase 3: adventure and rewards**

- [ ] **M6. World map.** The 6 places, unlocked with coins and level. Each
  one adds plots, a crop, bugs and jobs. More mini-games become jobs.
- [ ] **M7. Rewards.** The daily gift calendar, level-up chests, trophies,
  wealth titles, De9De9 points with De9De9 Play's rules, and a weekly
  contest using De9De9 Play's leaderboard server.
- [ ] **M8. Release.** Sounds, small animations, a balance pass, app icon
  and splash, the Android build, then iOS, and the store text.

**After the first release**

- Accounts and a server-side points ledger shared with De9De9 Play. **This
  is required before points can pay for a real service.** Until then, points
  live on the phone and can be cheated.
- Arabic and French, including right-to-left layouts.
- Art by a designer to replace the drawn-in-code art.
- Visiting friends' farms, and a market between players.

---

## Part 3: numbers to start with

These are starting points to tune with real players. All of them live in
`economy.js`.

### Jobs

| Job | Service | Mini-game | Pays (base) | Needs |
|---|---|---|---|---|
| Fix a leaking pipe | Travaux | Nemla Fix | 150 | |
| Play music at a wedding | Événement | Nemla Tiles | 300 | Level 2 |
| Deliver oranges | Auto | Nemla Run | 120 | (by leaf cart) |
| Express delivery | Auto | Nemla Run | 250 | Scooter |
| Repair a phone | Multimédia | De9a Match | 200 | Level 3 |
| Give a haircut | Beauté | Nemla Chop | 180 | Level 4 |
| Coach a jump class | Sport | De9a Jump | 160 | Olive Hills |
| Drive a client across town | Auto | Nemla Cross | 400 | Little car |
| Build a new room | Travaux | De9a Stack | 1,200 | Toolbox |
| Film a wedding with a drone | Multimédia | De9De9 | 600 | Sea Coast |

- **Pay:** from 50% (bad score) to 150% (great score) of the base pay.
  Each game has its own "great score".
- **Low needs:** if the needs average under 30%, jobs pay 20% less, and
  Nemla looks tired. That's the only penalty.
- **Jobs per day:** 5, +2 with the little car, +1 for each home above the
  little hole.

### Crops

| Crop | Seed | Grows in | Sells for | Where |
|---|---|---|---|---|
| Mint | 10 | 30 min (2 min the first time) | 25 | Start |
| Wheat | 15 | 1 hour | 40 | Start |
| Tomato | 25 | 3 hours | 80 | Level 3 |
| Olive | 60 | 1 day | 300 | Olive Hills |
| Fig | 70 | 18 hours | 320 | Fig Mountains |
| Orange | 80 | 1 day | 380 | Orange Groves |
| Dates | 120 | 2 days | 800 | Date Oasis |

Short crops earn more per hour if you come back often. Long crops are for
nights and busy days. The market buys up to 30 crops a day, 90 with the
pickup truck. Each harvest gives XP: mint 2, wheat 3, tomato 5. A ripe crop
never goes bad; it waits in its plot.

### Things to buy

| | Start | Step 2 | Step 3 | Step 4 | Step 5 |
|---|---|---|---|---|---|
| **Homes** | Little hole | Anthill 2,000 | Big house 10,000 | Villa 50,000 | Palace 250,000 |
| **Cars** | Leaf cart | Scooter 3,000 | Little car 15,000 | Pickup truck 40,000 | Sports car 120,000 |
| **Equipment** | Watering can | Sprinkler 1,500 | Toolbox 4,000 | Tractor 25,000 | Workshop 80,000 |

| Perk | What it does |
|---|---|
| Scooter | Unlocks express deliveries |
| Little car | +2 jobs a day |
| Pickup truck | The market buys 3× more |
| Sports car | +10% pay on every job |
| Sprinkler | Crops grow 25% faster |
| Toolbox | Unlocks building jobs |
| Tractor | Harvest and replant every plot in one tap |
| Workshop | Bug friends do 2 jobs a day for you |
| Each new home | More rooms, more plots, +1 job a day |

- **Plots:** a new game has 2. The third costs 500, and each one after it
  100 more. Each home has room for more: 6 at the little hole, then 9, 12,
  16 and 20.
- **Places:** Olive Hills 2,000 (Level 5), Fig Mountains 8,000 (Level 10),
  Sea Coast 20,000 (Level 15), Orange Groves 45,000 (Level 20), Date Oasis
  90,000 (Level 25).
- **Wealth titles** (by total coins earned): Beginner, Worker 5,000, Boss
  50,000, Rich 250,000, Millionaire 1,000,000.

### Pace (playing about 15 minutes a day)

| When | Goal reached |
|---|---|
| Day 2 | Anthill |
| Day 3 | Scooter |
| Week 1 | Toolbox |
| Weeks 2 to 3 | Big house, little car |
| Month 2 | Villa |
| Months 5 to 6 | Palace |
| About a year | Millionaire |

Daily income should about double every two weeks early on. That's what makes
"richer and richer" feel real.

### De9De9 points (real rewards)

Same rules as De9De9 Play: 1000 points = 1 free service, at most 20 points a
day.

| Where points come from | Points |
|---|---|
| Daily gift, days 1 to 7 | 1, 1, 2, 2, 3, 3, 5 |
| Each new level | 5 |
| Each trophy | 5 |
| Weekly contest, top 10 | 20 |

---

## Part 4: risks and open questions

- **Art.** We only have Nemla's head. The first version draws everything in
  code, like the screen designs. A designer can replace it later without
  changing the game rules.
- **Cheating.** Changing the phone's clock speeds up crops. That's fine for
  coins, but not for points worth a real service. Hence the server before
  real payouts.
- **Too much at once.** Each milestone must be fun before the next starts.
  If time runs short, M6 and M7 can ship after the first release.
- **Separate app or inside De9De9 Play?** This plan builds a separate app
  that shares De9De9 Play's point rules. A shared balance needs accounts.
- **Languages.** English first, then Arabic and French. Keeping all text in
  one place from M0 makes that easier later.
