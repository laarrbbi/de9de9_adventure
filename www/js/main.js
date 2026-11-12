// Starts the game: loads the save, catches up on the time away, draws the
// screens and keeps the clock running. Every change to the save goes
// through here, which redraws and saves.
import { load, save } from './state.js';
import { advance } from './clock.js';
import * as care from './care.js';
import { refreshBoard, fillBoard, postJob, runWorkshop, jobById, payRange, ticket, finishJob } from './jobs.js';
import * as garden from './garden.js';
import * as shop from './shop.js';
import { advanceGuide, closeGuide, firstJob } from './guide.js';
import { JOBS } from './economy.js';
import { mountHud } from './ui/hud.js';
import { mountHome } from './ui/home.js';
import { mountGarden } from './ui/garden.js';
import { mountWork } from './ui/work.js';
import { mountShop } from './ui/shop.js';
import { mountGuide } from './ui/guide.js';
import { mountTabs } from './ui/tabs.js';
import { openGame } from './ui/play.js';
import { toast } from './ui/toast.js';
import { sfx } from './audio.js';
import { t, num, duration, countdown } from './text.js';

const SAVE_DELAY = 300;
const SAVE_EVERY = 15e3;
const WELCOME_AFTER = 30 * 60e3;

// Care actions and the sound each one makes.
const CARE = { eat: 'eat', wash: 'wash', play: 'radio', sleep: 'sleep', wake: 'wake' };

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

const { state, fresh } = load(storage, Date.now());
const away = advance(state, Date.now()).ms;
advanceGuide(state, { pay: false });
newDay(Date.now());

const screenEl = document.getElementById('screen');
const NAMES = ['home', 'garden', 'work', 'shop'];
screenEl.innerHTML = NAMES.map((name, i) => `<div data-screen="${name}"${i ? ' hidden' : ''}></div>`).join('');
const place = (name) => screenEl.querySelector(`[data-screen="${name}"]`);
const screens = {
  home: mountHome(place('home'), { onAct: act }),
  garden: mountGarden(place('garden'), { onAct: gardenAct }),
  work: mountWork(place('work'), { onStart: startJob }),
  shop: mountShop(place('shop'), { onAct: shopAct }),
};
const hud = mountHud(document.getElementById('hud'));
const guide = mountGuide(document.getElementById('guide'), {
  onGo: show,
  onClose() {
    closeGuide(state);
    sfx.tap();
    changed();
  },
});
const tabs = mountTabs(document.getElementById('tabs'), {
  open: Object.keys(screens),
  onSelect: show,
  onLocked: (tab) => soon(t(`tab.${tab}`)),
});
let current = 'home';
let playing = false;

function show(name) {
  sfx.tap();
  current = name;
  for (const el of screenEl.children) el.hidden = el.dataset.screen !== name;
  tabs.setActive(name);
  screenEl.scrollTop = 0;
  render();
}

// A new day: a new job board, and the workshop's jobs if there is one.
// Returns whether anything changed.
function newDay(now) {
  const board = refreshBoard(state, now);
  firstJob(state);
  const helped = runWorkshop(state, now);
  if (helped) setTimeout(() => toast(t('toast.workshop', { n: helped.count, coins: num(helped.coins) }), 'gold'), 600);
  return board || !!helped;
}

function act(name) {
  if (name === 'talk') {
    sfx.giggle();
    screens.home.react('talk');
    return;
  }
  if (name === 'garden') return show('garden');
  if (name === 'journey') {
    screens.shop.open('home');
    return show('shop');
  }
  if (name === 'bed') name = state.nemla.sleeping ? 'wake' : 'sleep';
  if (!(name in CARE)) return;

  const result = care[name](state);
  if (refused(result)) return;
  sfx[CARE[name]]();
  screens.home.react(name, result.gained);
  celebrate(result.levels);
  changed();
}

// Garden actions, from the Garden screen.
function gardenAct(name, arg) {
  const now = Date.now();
  const g = state.garden;
  const cropName = (id) => t(`crop.${id}`);

  if (name === 'seed') {
    if (g.seed === arg) return;
    sfx.tap();
    g.seed = arg;
    return changed();
  }
  if (name === 'seedLocked') {
    sfx.no();
    return toast(t('why.level', garden.cropById(arg)));
  }
  if (name === 'plot') {
    const plot = g.plots[arg];
    if (!plot) return;
    if (!plot.crop) {
      if (refused(garden.plant(state, arg, g.seed, now))) return;
      sfx.plant();
      return changed();
    }
    if (!garden.isReady(plot, now)) {
      sfx.tap();
      return toast(t('toast.growing', { crop: cropName(plot.crop), time: countdown(plot.readyAt - now) }));
    }
    const result = garden.harvest(state, arg, now);
    if (refused(result)) return;
    sfx.harvest();
    changed();
    screens.garden.react('plot', arg, t('garden.harvested', { crop: cropName(result.crop) }));
    return celebrate(result.levels);
  }
  if (name === 'tractor') {
    const result = garden.tractor(state, now);
    if (refused(result)) return;
    sfx.harvest();
    changed();
    toast(t(result.short ? 'toast.tractorShort' : 'toast.tractor', { harvested: result.harvested, planted: result.planted }));
    return celebrate(result.levels);
  }
  if (name === 'harvestAll') {
    const result = garden.harvestAll(state, now);
    if (refused(result)) return;
    sfx.harvest();
    changed();
    toast(t('toast.harvested', { n: result.count }));
    return celebrate(result.levels);
  }
  if (name === 'buyPlot') {
    const result = garden.buyPlot(state);
    if (refused(result)) return;
    sfx.plant();
    changed();
    return toast(t('toast.plot'));
  }
  if (name === 'sell' || name === 'sellAll') {
    const result = name === 'sell' ? garden.sell(state, arg, now) : garden.sellAll(state, now);
    if (refused(result)) return;
    sfx.coins();
    changed();
    if (name === 'sell') screens.garden.react('crop', arg, `+${num(result.coins)}`);
    if (name === 'sellAll' || result.short) {
      toast(t(result.short ? 'toast.soldShort' : 'toast.sold', { n: result.count, coins: num(result.coins) }));
    }
  }
}

// Shop actions, from the Shop screen. 'check' answers whether an item can
// be bought, and says why not.
function shopAct(name, id) {
  if (name === 'check') {
    const can = shop.check(state, id);
    if (can.ok) sfx.tap();
    else refused({ ...can, why: `shop.${can.why}`, home: can.home && t(`item.${can.home}`), short: can.short && num(can.short) });
    return can.ok;
  }
  if (name === 'wear') {
    if (refused(shop.wear(state, id || null))) return;
    sfx.tap();
    return changed();
  }
  if (name !== 'buy') return;
  const result = shop.buy(state, id);
  if (refused(result)) return;
  const item = t(`item.${id}`);
  if (result.kind === 'home') {
    sfx.levelUp();
    fillBoard(state);
    changed();
    show('home');
    return toast(t('toast.moved', { home: item }), 'gold');
  }
  sfx.coins();
  toast(t('toast.bought', { item }), 'gold');
  // Whatever the item changes starts today, not tomorrow.
  if (fillBoard(state)) toast(t('toast.moreJobs'));
  for (const job of JOBS.filter((j) => j.needs === id)) {
    postJob(state, job.id);
    toast(t('toast.unlockedJob', { job: t(`job.${job.id}`) }));
  }
  const helped = runWorkshop(state, Date.now());
  if (helped) toast(t('toast.workshop', { n: helped.count, coins: num(helped.coins) }), 'gold');
  changed();
}

// Says why an action didn't happen. Returns whether it was refused.
function refused(result) {
  if (result.ok) return false;
  sfx.no();
  toast(t(`why.${result.why}`, result));
  return true;
}

// Tells the player when crops finish growing while the game is open.
let lastReady = garden.readyCount(state, Date.now());

function noticeReady(now) {
  const ready = garden.readyCount(state, now);
  if (ready > lastReady) {
    sfx.ready();
    toast(readyMessage(ready, now));
  }
  lastReady = ready;
}

function readyMessage(ready, now) {
  if (ready > 1) return t('toast.readyMany', { n: ready });
  const plot = state.garden.plots.find((p) => garden.isReady(p, now));
  return t('toast.readyOne', { crop: t(`crop.${plot.crop}`) });
}

function startJob(slot) {
  const entry = state.work.board[slot];
  if (!entry || entry.done) return;
  const job = jobById(entry.job);
  const pass = ticket(state, slot);
  let levels = [];
  sfx.tap();
  playing = true;
  openGame(job.game, {
    name: t(`job.${job.id}`),
    client: t('play.for', { client: t(`client.${entry.client}`) }),
    pay: payRange(job),
  }, {
    onEnd(score) {
      const result = finishJob(state, pass, score, Date.now());
      if (!result) return { coins: 0, rating: 'ok', bonus: 0, tired: false };
      levels = result.levels;
      changed();
      return result;
    },
    onLeave(finished) {
      playing = false;
      if (!finished) {
        render();
        return toast(t('play.stopped'));
      }
      sfx.coins();
      celebrate(levels);
      render();
    },
  });
}

function celebrate(levels) {
  for (const reached of levels) {
    setTimeout(sfx.levelUp, 400);
    toast(t('toast.level', reached), 'gold');
  }
}

function soon(name) {
  sfx.tap();
  toast(t('toast.soon', { name }));
}

function render() {
  const now = Date.now();
  if (!playing) guideProgress();
  hud.update(state);
  tabs.setBadge('garden', garden.readyCount(state, now));
  for (const screen of Object.values(screens)) screen.update(state, now);
  guide.update(state, now, current, place(current));
}

// Pays for each guide step the player just finished.
function guideProgress() {
  const done = advanceGuide(state);
  if (!done.steps) return;
  setTimeout(sfx.coins, 300);
  toast(t('toast.guideStep', { coins: done.coins }), 'gold');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, SAVE_DELAY);
}

let saveTimer = null;
let warned = false;

function changed() {
  render();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, SAVE_DELAY);
}

function persist() {
  clearTimeout(saveTimer);
  if (!save(storage, state) && !warned) {
    warned = true;
    toast(t('toast.noSave'));
  }
}

setInterval(() => {
  const now = Date.now();
  const { wokeUp } = advance(state, now);
  if (wokeUp) {
    sfx.wake();
    toast(t('toast.woke'));
  }
  if (newDay(now) || wokeUp) persist();
  noticeReady(now);
  render();
}, 1000);
setInterval(persist, SAVE_EVERY);

document.addEventListener('visibilitychange', () => {
  advance(state, Date.now());
  if (document.hidden) persist();
  else render();
});
window.addEventListener('pagehide', persist);

tabs.setActive('home');
render();
persist();
if (fresh) toast(t('toast.hello'));
else if (away >= WELCOME_AFTER) {
  toast(t('toast.back', { time: duration(away) }));
  if (lastReady) toast(readyMessage(lastReady, Date.now()));
}
