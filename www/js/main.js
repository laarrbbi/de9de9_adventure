// Starts the game: loads the save, catches up on the time away, draws the
// screens and keeps the clock running. Every change to the save goes
// through act(), which redraws and saves.
import { load, save } from './state.js';
import { advance } from './clock.js';
import * as care from './care.js';
import { mountHud } from './ui/hud.js';
import { mountHome } from './ui/home.js';
import { mountTabs } from './ui/tabs.js';
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

const hud = mountHud(document.getElementById('hud'));
const home = mountHome(document.getElementById('screen'), { onAct: act });
mountTabs(document.getElementById('tabs'), { onLocked: (tab) => soon(t(`tab.${tab}`)) });

function act(name) {
  if (name === 'talk') {
    sfx.giggle();
    home.react('talk');
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
  home.react(name);
  for (const reached of result.levels) {
    setTimeout(sfx.levelUp, 400);
    toast(t('toast.level', reached), 'gold');
  }
  changed();
}

function soon(name) {
  sfx.tap();
  toast(t('toast.soon', { name }));
}

function render() {
  hud.update(state);
  home.update(state, Date.now());
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
  if (advance(state, Date.now()).wokeUp) {
    sfx.wake();
    toast(t('toast.woke'));
    persist();
  }
  render();
}, 1000);
setInterval(persist, SAVE_EVERY);

document.addEventListener('visibilitychange', () => {
  advance(state, Date.now());
  if (document.hidden) persist();
  else render();
});
window.addEventListener('pagehide', persist);

render();
persist();
if (fresh) toast(t('toast.hello'));
else if (away >= WELCOME_AFTER) toast(t('toast.back', { time: duration(away) }));
