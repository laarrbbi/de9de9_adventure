// The Shop screen: homes (shown as Nemla's journey), rooms, cars, equipment
// and clothes. It only shows the save; actions go through `onAct(name, id)`
// to main.js: 'check' (returns whether it can be bought; says why not),
// 'buy', and 'wear' (an outfit id, or '' to take it off).
// Buying takes two taps, so a big price is never paid by accident.
import { HOMES, PLOTS_BY_HOME, JOBS_PER_DAY, JOBS_PER_HOME } from '../economy.js';
import { KINDS, owns, homeOf } from '../perks.js';
import { nextHome } from '../shop.js';
import { itemArt } from '../art/items.js';
import { coin, icon } from '../art/icons.js';
import { t, num } from '../text.js';

const SECTIONS = ['home', 'room', 'car', 'tool', 'clothes'];
const ARM_MS = 4000;

export function mountShop(root, { onAct }) {
  root.innerHTML = `
  <section class="shop">
    <div class="title-row">
      <div>
        <h1>${t('shop.title')}</h1>
        <p class="sub">${t('shop.sub')}</p>
      </div>
    </div>
    <div class="shop-tabs" role="tablist" aria-label="${t('shop.title')}">
      ${SECTIONS.map((s) => `<button class="shop-tab" role="tab" data-section="${s}">${t(`shop.${s}`)}</button>`).join('')}
    </div>
    <p class="shop-intro" data-ref="intro"></p>
    <div class="shop-list" data-ref="list" role="tabpanel"></div>
  </section>`;

  const ref = Object.fromEntries([...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]));
  const tabs = [...root.querySelectorAll('.shop-tab')];
  let section = 'home';
  let armed = null;
  let armTimer = null;
  let drawn = '';
  let last = null;

  root.querySelector('.shop-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-section]');
    if (tab) open(tab.dataset.section);
  });

  ref.list.addEventListener('click', (e) => {
    const button = e.target.closest('[data-act]');
    if (!button) return;
    const { act, id } = button.dataset;
    if (act === 'wear') return onAct('wear', id);
    if (armed === id) {
      disarm();
      return onAct('buy', id);
    }
    if (onAct('check', id)) arm(id);
  });

  function arm(id) {
    armed = id;
    clearTimeout(armTimer);
    armTimer = setTimeout(disarm, ARM_MS);
    redraw();
  }

  function disarm() {
    armed = null;
    clearTimeout(armTimer);
    redraw();
  }

  function redraw() {
    drawn = '';
    if (last) update(last);
  }

  // Shows a section, e.g. the homes from the goal card at home.
  function open(name) {
    section = name;
    armed = null;
    redraw();
  }

  function update(state) {
    last = state;
    const items = KINDS[section];
    const key = [section, armed, state.home.level, state.home.rooms, state.nemla.outfit,
      JSON.stringify(state.owned), items.map((item) => state.coins >= item.price)].join('|');
    if (key === drawn) return;
    drawn = key;
    for (const tab of tabs) tab.setAttribute('aria-selected', String(tab.dataset.section === section));
    ref.intro.textContent = t(`shop.${section}Intro`);
    ref.list.classList.toggle('journey', section === 'home');
    ref.list.innerHTML = items.map((item) => card(state, section, item, armed)).join('');
  }

  return { update, open };
}

function card(state, kind, item, armed) {
  const name = t(`item.${item.id}`);
  const perk = kind === 'home' ? homePerk(item) : t(`perk.${item.id}`);
  const status = action(state, kind, item, armed, name);
  const here = kind === 'home' && homeOf(state) === item;
  return `
    <div class="item${here ? ' here' : ''}${status.locked ? ' locked' : ''}">
      <span class="item-pic">${itemArt(item.id, 52)}</span>
      <span class="item-text"><b>${name}</b><small>${perk}</small>${status.note ? `<small class="item-note">${status.note}</small>` : ''}</span>
      ${status.html}
    </div>`;
}

function homePerk(home) {
  const level = HOMES.indexOf(home) + 1;
  return t('perk.home', { plots: PLOTS_BY_HOME[level - 1], jobs: JOBS_PER_DAY + JOBS_PER_HOME * (level - 1) });
}

const priceButton = (item, name, armed, short) => armed === item.id
  ? `<button class="buy armed" data-act="buy" data-id="${item.id}" aria-label="${t('shop.confirmLabel', { item: name, coins: num(item.price) })}">${t('shop.confirm')}</button>`
  : `<button class="buy${short ? ' short' : ''}" data-act="buy" data-id="${item.id}" aria-label="${t('shop.buyLabel', { item: name, coins: num(item.price) })}">${coin(15)}${num(item.price)}</button>`;

// The right side of a card: what the player can do with this item now.
function action(state, kind, item, armed, name) {
  const short = state.coins < item.price;
  const chip = (text, cls = '') => `<span class="item-chip ${cls}">${text}</span>`;
  if (kind === 'home') {
    const index = HOMES.indexOf(item);
    if (homeOf(state) === item) return { html: chip(t('shop.here'), 'on') };
    if (index < state.home.level) return { html: chip(`${icon('check', 14)}${t('shop.livedHere')}`) };
    if (item === nextHome(state)) {
      return {
        html: priceButton(item, name, armed, short),
        note: short ? t('shop.saveMore', { coins: num(item.price - state.coins) }) : t('shop.canMove'),
      };
    }
    return { html: chip(`${coin(13)}${num(item.price)}`, 'muted'), locked: true, note: t('shop.after', { home: t(`item.${HOMES[index - 1].id}`) }) };
  }
  if (kind === 'clothes' && owns(state, item.id)) {
    const on = state.nemla.outfit === item.id;
    return {
      html: `<button class="wear${on ? ' on' : ''}" data-act="wear" data-id="${on ? '' : item.id}" aria-pressed="${on}">${on ? t('shop.wearing') : t('shop.wear')}</button>`,
      note: on ? t('shop.takeOff') : '',
    };
  }
  if (owns(state, item.id)) return { html: chip(`${icon('check', 14)}${t('shop.owned')}`, 'on') };
  if (kind === 'room' && state.home.level < item.home) {
    return { html: chip(`${coin(13)}${num(item.price)}`, 'muted'), locked: true, note: t('shop.needsHome', { home: t(`item.${HOMES[item.home - 1].id}`) }) };
  }
  return { html: priceButton(item, name, armed, short) };
}
