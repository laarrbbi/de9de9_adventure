// The home screen: the scene, Nemla's mood, the four needs and the next
// home to save for. It only shows the save; every change goes through
// `onAct(name)` to main.js ('journey' opens the homes in the Shop).
import { homeScene, SPOTS } from '../art/home.js';
import { icon, coin } from '../art/icons.js';
import { itemArt } from '../art/items.js';
import { NEEDS, worstNeed, mood } from '../needs.js';
import { MEAL, NEED_LOW } from '../economy.js';
import { homeOf } from '../perks.js';
import { nextHome } from '../shop.js';
import { dayNumber, clockTime, isNight } from '../clock.js';
import { t, saying, num } from '../text.js';

// What tapping each need's button does. "bed" means sleep, or wake up if
// Nemla is already asleep.
const ACT = { hunger: 'eat', energy: 'bed', clean: 'wash', fun: 'play' };
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPEECH_MS = 2200;

const needButton = (need) => `
  <button class="need" data-need="${need}" data-act="${ACT[need]}">
    <span class="need-icon">${icon(need, 18)}</span>
    <span class="need-body">
      <span class="need-top"><span>${t(`need.${need}`)}</span><span class="need-act" data-ref="act"></span></span>
      <span class="bar"><i data-ref="bar"></i></span>
    </span>
  </button>`;

export function mountHome(root, { onAct }) {
  root.innerHTML = `
  <section class="home">
    <div class="title-row">
      <div>
        <h1>${t('home.title.1')}</h1>
        <p class="sub" data-ref="time"></p>
      </div>
      <span class="mood" data-ref="mood"></span>
    </div>
    <div class="scene">
      <div data-ref="art"></div>
      <p class="speech" data-ref="speech" hidden></p>
    </div>
    <div class="needs">${NEEDS.map(needButton).join('')}</div>
    <button class="goal" data-ref="goal">
      <span class="goal-icon" data-ref="goalIcon"></span>
      <span class="goal-body">
        <span class="goal-top"><b data-ref="goalTitle"></b><span class="goal-reward" data-ref="goalReward"></span></span>
        <span class="bar"><i data-ref="goalBar"></i></span>
        <span class="goal-note" data-ref="goalNote"></span>
      </span>
    </button>
  </section>`;

  const one = (sel) => root.querySelector(sel);
  const art = one('[data-ref="art"]');
  const titleEl = one('h1');
  let svg, fx, nemla, thought, drawnScene = '', drawnGoal = '';
  const timeEl = one('[data-ref="time"]');
  const moodEl = one('[data-ref="mood"]');
  const speech = one('[data-ref="speech"]');
  const goal = {
    button: one('[data-ref="goal"]'),
    icon: one('[data-ref="goalIcon"]'),
    title: one('[data-ref="goalTitle"]'),
    reward: one('[data-ref="goalReward"]'),
    bar: one('[data-ref="goalBar"]'),
    note: one('[data-ref="goalNote"]'),
  };
  const buttons = Object.fromEntries(NEEDS.map((n) => [n, one(`.need[data-need="${n}"]`)]));
  let current = null;
  let speechTimer = null;

  art.addEventListener('click', (e) => {
    const target = e.target.closest('.obj');
    if (target) onAct(target.dataset.act);
  });
  art.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('obj')) {
      e.preventDefault();
      onAct(e.target.dataset.act);
    }
  });
  one('.needs').addEventListener('click', (e) => {
    const button = e.target.closest('.need');
    if (button) onAct(button.dataset.act);
  });
  goal.button.addEventListener('click', () => onAct('journey'));

  // The scene is drawn again only when the home, its rooms or the outfit change.
  function drawScene(state) {
    const look = { level: state.home.level, rooms: state.home.rooms, outfit: state.nemla.outfit };
    const key = JSON.stringify(look);
    if (key === drawnScene) return;
    drawnScene = key;
    art.innerHTML = homeScene(look);
    svg = art.querySelector('.home-svg');
    fx = art.querySelector('.fx');
    nemla = art.querySelector('.nemla');
    thought = art.querySelector('.thought');
    titleEl.textContent = t(`home.title.${homeOf(state).id}`);
  }

  function update(state, now) {
    current = state;
    drawScene(state);
    const { needs, sleeping } = state.nemla;
    const worst = sleeping ? null : worstNeed(needs);
    const feeling = sleeping ? 'sleeping' : mood(needs);

    timeEl.textContent = t('home.time', { day: dayNumber(state.createdAt, now), time: clockTime(now) });
    moodEl.textContent = t(`mood.${feeling}`);
    moodEl.className = `mood ${feeling}`;
    svg.classList.toggle('night', isNight(now));
    svg.classList.toggle('asleep', sleeping);

    thought.classList.toggle('on', worst !== null);
    for (const g of thought.querySelectorAll('[data-need]')) g.style.display = g.dataset.need === worst ? '' : 'none';
    for (const b of svg.querySelectorAll('.badge')) b.classList.toggle('on', b.dataset.need === worst);

    for (const need of NEEDS) {
      const button = buttons[need];
      const value = Math.round(needs[need]);
      const action = actionLabel(need, sleeping);
      button.classList.toggle('low', value < NEED_LOW);
      button.querySelector('[data-ref="bar"]').style.width = `${value}%`;
      const act = button.querySelector('[data-ref="act"]');
      const html = need === 'hunger' ? `${action} ${coin(12)}${MEAL.cost}` : action;
      if (act.dataset.html !== html) {
        act.innerHTML = html;
        act.dataset.html = html;
      }
      button.setAttribute('aria-label', t('need.label', { need: t(`need.${need}`), value, action }));
    }

    updateGoal(state);
  }

  // The next home: how far the coins are from its price.
  function updateGoal(state) {
    const next = nextHome(state);
    const ready = next && state.coins >= next.price;
    const key = `${next?.id}|${ready}`;
    if (key !== drawnGoal) {
      drawnGoal = key;
      goal.icon.innerHTML = itemArt(next?.id ?? homeOf(state).id, 40);
      goal.button.classList.toggle('ready', !!ready);
      goal.title.textContent = next ? t(ready ? 'goal.ready' : 'goal.title', { home: t(`item.${next.id}`) }) : t('goal.top');
      goal.reward.innerHTML = next ? `${coin(15)}${num(next.price)}` : '';
    }
    const share = next ? Math.min(1, state.coins / next.price) : 1;
    goal.bar.style.width = `${Math.round(share * 100)}%`;
    goal.note.textContent = !next ? t('goal.topNote')
      : ready ? t('goal.readyNote')
      : t('goal.note', { coins: num(state.coins), price: num(next.price), left: num(next.price - state.coins) });
    goal.button.setAttribute('aria-label', `${goal.title.textContent}. ${goal.note.textContent}`);
  }

  // Shows what an action did, on top of the new state that update() draws.
  function react(act, gained = {}) {
    if (act === 'eat') {
      bite();
      floatText(`+${gained.hunger ?? MEAL.hunger}`, SPOTS.head);
      bounce();
    } else if (act === 'wash') {
      bubbles();
      bounce();
    } else if (act === 'play') {
      notes();
      bounce();
    } else if (act === 'talk') {
      say(saying(current && worstNeed(current.nemla.needs)));
      bounce();
    }
  }

  function say(text) {
    speech.textContent = text;
    speech.hidden = false;
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => (speech.hidden = true), SPEECH_MS);
  }

  function bounce() {
    nemla.classList.remove('bounce');
    void nemla.getBoundingClientRect(); // restart the animation
    nemla.classList.add('bounce');
  }

  function addFx(tag, attrs, lifeMs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text) el.textContent = text;
    fx.append(el);
    setTimeout(() => el.remove(), lifeMs);
    return el;
  }

  const floatText = (text, { x, y }) =>
    addFx('text', { x, y, 'text-anchor': 'middle', class: 'float' }, 1200, text);

  const bite = () => addFx('ellipse', { cx: SPOTS.mouth.x, cy: SPOTS.mouth.y, rx: 11, ry: 7, class: 'bite' }, 700);

  function bubbles() {
    for (let i = 0; i < 9; i++) {
      const bubble = addFx('circle', {
        cx: 146 + Math.random() * 68,
        cy: 220 + Math.random() * 110,
        r: 4 + Math.random() * 6,
        class: 'bubble',
      }, 1500);
      bubble.style.animationDelay = `${i * 70}ms`;
    }
  }

  function notes() {
    ['♪', '♫', '♪', '♫'].forEach((n, i) => {
      const note = addFx('text', { x: SPOTS.radio.x - 18 + i * 12, y: SPOTS.radio.y - 4, class: 'note' }, 2000, n);
      note.style.animationDelay = `${i * 220}ms`;
    });
  }

  return { update, react };
}

function actionLabel(need, sleeping) {
  if (need === 'energy') return t(sleeping ? 'act.wake' : 'act.sleep');
  return t(`act.${ACT[need]}`);
}
