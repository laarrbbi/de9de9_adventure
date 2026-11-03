// Every word the player reads, in one place, so the game can be translated
// into Arabic and French later. `{name}` marks a value filled in by t().
const en = {
  'home.title.1': 'Your little hole',
  'home.time': 'Day {day} · {time}',
  'home.scene': "Nemla's home",

  'hud.level': 'Lv {level}',
  'hud.coins': '{coins} coins',
  'hud.points': '{points} of {goal} De9De9 points',

  'mood.happy': 'Happy',
  'mood.ok': 'OK',
  'mood.low': 'Not great',
  'mood.sleeping': 'Sleeping',

  'need.hunger': 'Hunger',
  'need.energy': 'Energy',
  'need.clean': 'Clean',
  'need.fun': 'Fun',
  'need.label': '{need} {value}%. {action}',

  'goal.title': 'Next: Level {level}',
  'goal.reward': '+{coins} coins',
  'goal.note': '{xp} of {need} XP. Each time you care for Nemla: +{each} XP',

  'act.eat': 'Eat',
  'act.sleep': 'Sleep',
  'act.wake': 'Wake up',
  'act.wash': 'Wash',
  'act.play': 'Play',

  'obj.bed': 'Bed',
  'obj.pantry': 'Pantry',
  'obj.tub': 'Bath',
  'obj.radio': 'Radio',
  'obj.sign': 'Garden',
  'obj.nemla': 'Nemla',

  'why.sleeping': 'Nemla is sleeping. Tap the bed to wake Nemla up.',
  'why.full': 'Nemla is full.',
  'why.coins': 'Not enough coins.',
  'why.clean': 'Nemla is already clean.',
  'why.fun': 'Nemla is already having fun.',
  'why.rested': 'Nemla is not tired.',

  'toast.hello': 'Salam! This is Nemla, and Nemla is hungry. Tap Eat.',
  'toast.back': 'Welcome back! You were away {time}.',
  'toast.woke': 'Nemla woke up full of energy.',
  'toast.level': 'Level {level}! +{coins} coins',
  'toast.noSave': "This browser can't save the game.",
  'toast.soon': '{name} is coming in the next update.',

  'work.title': 'Work',
  'work.sub': 'Do jobs like a De9De9 pro. Play well and they pay more.',
  'work.earned': 'Earned today',
  'work.left': 'Jobs left',
  'work.leftValue': '{left} of {total}',
  'work.streak': 'Work streak',
  'work.streakValue': '{days} days',
  'work.streakOne': '1 day',
  'work.streakBonus': '+{pct}% pay',
  'work.for': 'For {client} · {service} · {game}',
  'work.start': 'Start: {job}, about {coins} coins',
  'work.paid': 'Done · +{coins}',
  'work.allDone': 'All jobs done for today. New jobs in {time}.',
  'work.newJobs': 'New jobs in {time}.',
  'work.lockedTitle': 'More jobs to unlock',
  'work.needsLevel': 'Level {level}',
  'work.needsItem': 'Needs a {item} from the Shop',
  'work.realTitle': 'In real life too',
  'work.realText': 'Pros find clients and earn money on De9De9.',
  'work.realLink': 'Open De9De9',

  'job.fixPipe': 'Fix a leaking pipe',
  'job.deliver': 'Deliver 20 oranges',
  'job.wedding': 'Play music at a wedding',
  'job.buildRoom': 'Build a new room',

  'game.fix': 'Nemla Fix',
  'game.run': 'Nemla Run',
  'game.tiles': 'Nemla Tiles',
  'game.stack': 'De9a Stack',

  'item.toolbox': 'toolbox',

  'service.travaux': 'Travaux',
  'service.auto': 'Auto',
  'service.evenement': 'Événement',

  'client.snail': 'Snail',
  'client.ladybug': 'Ladybug',
  'client.bee': 'Bee',
  'client.beetle': 'Beetle',
  'client.butterfly': 'Butterfly',
  'client.cricket': 'Cricket',

  'play.close': 'Stop the job',
  'play.for': 'For {client}',
  'play.pay': '{min} to {max} coins',
  'play.start': 'Tap to start',
  'play.done': 'Job done!',
  'play.score': 'Score',
  'play.coins': 'Coins',
  'play.collect': 'Collect',
  'play.streak': 'Includes +{pct}% streak bonus',
  'play.tired': 'Nemla was tired: 20% less pay',
  'play.doneLabel': 'Job done. You earned {coins} coins. Tap to collect.',
  'play.stopped': 'Job stopped. It is still on the board.',

  'rating.ok': 'Good try',
  'rating.good': 'Nice work',
  'rating.great': 'Great job',
  'rating.perfect': 'Excellent!',

  'tab.home': 'Home',
  'tab.garden': 'Garden',
  'tab.work': 'Work',
  'tab.shop': 'Shop',
  'tab.friends': 'Friends',
  'tab.map': 'Map',
  'tab.locked': '{name}, coming soon',

  'time.min': '{n} min',
  'time.hours': '{n} h',
  'time.days': '{n} days',
};

// Things Nemla says when tapped, by what is on Nemla's mind.
const sayings = {
  happy: ['Salam!', 'Life is good!', "Let's get rich!", 'I love my home.'],
  hunger: ["I'm hungry…", 'Is there any bread?'],
  energy: ['So sleepy…', 'I need a nap.'],
  clean: ['I need a bath!', 'Bath time?'],
  fun: ["I'm bored. Let's play!", 'Put some music on!'],
};

export function t(key, vars = {}) {
  return (en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function saying(topic) {
  const list = sayings[topic] ?? sayings.happy;
  return list[Math.floor(Math.random() * list.length)];
}

export const num = (n) => Math.floor(n).toLocaleString('en-US');

export function duration(ms) {
  const min = Math.round(ms / 60e3);
  if (min < 60) return t('time.min', { n: min });
  const hours = Math.round(min / 60);
  if (hours < 48) return t('time.hours', { n: hours });
  return t('time.days', { n: Math.round(hours / 24) });
}
