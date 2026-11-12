// Starts the game: loads the save, catches up on the time away, draws the
// screens and keeps the clock running. Every change to the save goes
// through here, which redraws and saves.
import { load, save } from './state.js';
import { advance } from './clock.js';
import * as care from './care.js';
import { refreshBoard, jobById, payRange, ticket, finishJob } from './jobs.js';
import * as garden from './garden.js';
import { mountHud } from './ui/hud.js';
import { mountHome } from './ui/home.js';
import { mountGarden } from './ui/garden.js';
import { mountWork } from './ui/work.js';
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
refreshBoard(state, Date.now());

const screenEl = document.getElementById('screen');
screenEl.innerHTML = ['home', 'garden', 'work'].map((name, i) => `<div data-screen="${name}"${i ? ' hidden' : ''}></div>`).join('');
const screens = {
  home: mountHome(screenEl.querySelector('[data-screen="home"]'), { onAct: act }),
  garden: mountGarden(screenEl.querySelector('[data-screen="garden"]'), { onAct: gardenAct }),
  work: mountWork(screenEl.querySelector('[data-screen="work"]'), { onStart: startJob }),
};
const hud = mountHud(document.getElementById('hud'));
const tabs = mountTabs(document.getElementById('tabs'), {
  open: Object.keys(screens),
  onSelect: show,
  onLocked: (tab) => soon(t(`tab.${tab}`)),
});

function show(name) {
  sfx.tap();
  for (const el of screenEl.children) el.hidden = el.dataset.screen !== name;
  tabs.setActive(name);
  screenEl.scrollTop = 0;
}

function act(name) {
  if (name === 'talk') {
    sfx.giggle();
    screens.home.react('talk');
    return;
  }
  if (name === 'garden') return show('garden');
  if (name === 'bed') name = state.nemla.sleeping ? 'wake' : 'sleep';
  if (!(name in CARE)) return;

  const result = care[name](state);
  if (refused(result)) return;
  sfx[CARE[name]]();
  screens.home.react(name);
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
      if (!finished) return toast(t('play.stopped'));
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
  hud.update(state);
  tabs.setBadge('garden', garden.readyCount(state, now));
  for (const screen of Object.values(screens)) screen.update(state, now);
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
  if (wokeUp || refreshBoard(state, now)) persist();
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
