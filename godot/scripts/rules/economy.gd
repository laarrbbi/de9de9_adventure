# Every number that sets the pace of the game. Tune them here: nothing else
# hard-codes a rate, a price or a reward. The same numbers as the web
# version's www/js/economy.js; keep the two in step.
class_name Economy

# Nemla's needs run from 0 to 100 and drop this much per hour of real time.
const NEED_DROP_PER_HOUR := {"hunger": 6.0, "energy": 4.0, "clean": 3.0, "fun": 5.0}

# Sleeping refills energy this much per hour: empty to full in 20 minutes.
const SLEEP_GAIN_PER_HOUR := 300.0

# A need under this shows in Nemla's thought bubble.
const NEED_LOW := 40

# A need at or above this is "full": the action that fills it says no.
const NEED_FULL := 95

# Care actions. A meal costs coins; washing, playing and sleeping are free.
const MEAL := {"cost": 5, "hunger": 25}
const PLAY_FUN := 20
const CARE_XP := 2

# A new game: some coins, and a Nemla that is already a bit hungry so the
# first thing to do is obvious.
const START := {"coins": 200, "needs": {"hunger": 45, "energy": 70, "clean": 80, "fun": 60}}


# XP needed to go from `level` to the next one, and the coins paid on arrival.
static func xp_to_next(level: int) -> int:
	return 40 + level * 20


static func level_up_coins(level: int) -> int:
	return 50 * level


# Jobs. Each is a mini-game from De9De9 Play. A run pays from PAY_MIN to
# PAY_MAX times `pay`, depending on the score against `great`. A job with
# `needs` waits for that item from the Shop; `perDay` caps how many of it a
# day's board can have.
const JOBS := [
	{"id": "fixPipe", "service": "travaux", "game": "fix", "pay": 150, "great": 30, "level": 1},
	{"id": "deliver", "service": "auto", "game": "run", "pay": 120, "great": 30, "level": 1},
	{"id": "wedding", "service": "evenement", "game": "tiles", "pay": 300, "great": 80, "level": 2},
	{"id": "express", "service": "auto", "game": "run", "pay": 250, "great": 30, "level": 1, "needs": "scooter"},
	{"id": "buildRoom", "service": "travaux", "game": "stack", "pay": 1200, "great": 20, "level": 1, "needs": "toolbox", "perDay": 1},
]
const PAY_MIN := 0.5
const PAY_MAX := 1.5
const JOBS_PER_DAY := 5

# Each day in a row with at least one job adds to the pay, up to a limit.
const STREAK_BONUS := 0.05
const STREAK_BONUS_MAX := 0.25

# While the needs average under NEEDS_TIRED, jobs pay this much of the usual.
const NEEDS_TIRED := 30
const TIRED_PAY := 0.8

# What a job does to Nemla: tiring, but fun.
const JOB_XP := 10
const JOB_EFFECT := {"energy": -10, "fun": 10}

# Who posts the jobs: the bug friends Nemla will meet.
const CLIENTS := ["snail", "ladybug", "bee", "beetle", "butterfly", "cricket"]

# Crops. `grow` is in minutes of real time; `first`, if set, is how long the
# very first one takes, so a new player sees a harvest right away. `xp` is
# paid on harvest, `sell` by the market for each one.
const CROPS := [
	{"id": "mint", "seed": 10, "grow": 30, "first": 2, "sell": 25, "xp": 2, "level": 1},
	{"id": "wheat", "seed": 15, "grow": 60, "sell": 40, "xp": 3, "level": 1},
	{"id": "tomato", "seed": 25, "grow": 180, "sell": 80, "xp": 5, "level": 3},
]

# Plots. A new game has START_PLOTS; each home has room for a few more. The
# first plot bought costs 500 and each one after it 100 more.
const START_PLOTS := 2
const PLOTS_BY_HOME := [6, 9, 12, 16, 20]


static func plot_price(owned: int) -> int:
	return 500 + 100 * maxi(0, owned - START_PLOTS)


# The market buys this many crops a day, whatever the crop.
const MARKET_PER_DAY := 30

# The Shop. Each item may carry perks, added up in perks.gd:
#   jobs: more jobs a day       pay: share added to job pay
#   market: market size ×       grow: grow time ×
#   sells: share added to crop prices
#   drop: need drops ×, by need  sleep: how fast sleep refills energy ×
#   meal: hunger a meal fills   washFun: fun a bath adds   playFun: fun the radio adds
#   helpers: jobs a day done for you
# Cars, equipment and rooms work as long as they are owned; clothes only
# while Nemla wears them. Jobs that need an item name it in JOBS `needs`.

# Homes, in the order Nemla moves through them. A home's place in this list
# is `home.level` - 1.
const HOMES := [
	{"id": "hole", "price": 0},
	{"id": "anthill", "price": 2000},
	{"id": "house", "price": 10000},
	{"id": "villa", "price": 50000},
	{"id": "palace", "price": 250000},
]
const JOBS_PER_HOME := 1

# Rooms to dig (or build) at home. `home` is the home level they need.
const ROOMS := [
	{"id": "kitchen", "price": 800, "home": 2, "meal": 40},
	{"id": "bathroom", "price": 600, "home": 2, "washFun": 15},
	{"id": "bedroom", "price": 1500, "home": 3, "sleep": 2.0},
	{"id": "musicRoom", "price": 1200, "home": 3, "playFun": 35},
]

const CARS := [
	{"id": "leafCart", "price": 0},
	{"id": "scooter", "price": 3000},
	{"id": "littleCar", "price": 15000, "jobs": 2},
	{"id": "pickup", "price": 40000, "market": 3},
	{"id": "sportsCar", "price": 120000, "pay": 0.1},
]

const EQUIPMENT := [
	{"id": "wateringCan", "price": 0},
	{"id": "sprinkler", "price": 1500, "grow": 0.75},
	{"id": "toolbox", "price": 4000},
	{"id": "tractor", "price": 25000},
	{"id": "workshop", "price": 80000, "helpers": 2},
]

# One outfit at a time.
const CLOTHES := [
	{"id": "redCap", "price": 500, "drop": {"fun": 0.75}},
	{"id": "strawHat", "price": 1200, "sells": 0.1},
	{"id": "overalls", "price": 2500, "pay": 0.05},
	{"id": "sunglasses", "price": 6000, "drop": {"hunger": 0.85, "energy": 0.85, "clean": 0.85, "fun": 0.85}},
]

# The first 5 minutes: each step of the guide pays this much.
const GUIDE_STEP_COINS := 20

# The longest absence the game catches up on, so a phone whose clock jumps
# ahead can't fast-forward months.
const MAX_CATCH_UP_HOURS := 24 * 7

# De9De9 points: the same rule as De9De9 Play, 1000 points for a free service.
const SERVICE_COST := 1000
