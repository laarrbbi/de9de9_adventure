// Starts the game: loads the save, catches up on the time away, draws the
// screens and keeps the clock running. Every change to the save goes
// through here, which redraws and saves.
import { load, save } from './state.js';
import { advance } from './clock.js';
import * as care from './care.js';
import { refreshBoard, jobById, payRange, ticket, finishJob } from './jobs.js';
import { mountHud } from './ui/hud.js';
import { mountHome } from './ui/home.js';
import { mountWork } from './ui/work.js';
import { mountTabs } from './ui/tabs.js';
import { openGame } from './ui/play.js';
import { toast } from './ui/toast.js';
import { sfx } from './audio.js';
import { t, duration } from './text.js';

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
screenEl.innerHTML = '<div data-screen="home"></div><div data-screen="work" hidden></div>';
const screens = {
  home: mountHome(screenEl.querySelector('[data-screen="home"]'), { onAct: act }),
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
  if (name === 'garden') return soon(t('tab.garden'));
  if (name === 'bed') name = state.nemla.sleeping ? 'wake' : 'sleep';
  if (!(name in CARE)) return;

  const result = care[name](state);
  if (!result.ok) {
    sfx.no();
    toast(t(`why.${result.why}`));
    return;
  }
  sfx[CARE[name]]();
  screens.home.react(name);
  celebrate(result.levels);
  changed();
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
else if (away >= WELCOME_AFTER) toast(t('toast.back', { time: duration(away) }));
