// The Garden screen: the seeds to choose from, the plots, and the market.
// It only shows the save; every change goes through `onAct(name, arg)` to
// main.js: 'seed' (crop id), 'plot' (plot index), 'buyPlot', 'harvestAll',
// 'tractor', 'sell' (crop id) and 'sellAll'.
import { CROPS } from '../economy.js';
import {
  cropById, canGrow, growTime, isReady, progress, readyCount, roomForPlots, nextPlotPrice, marketLeft, barnTotal,
  priceOf, hasTractor,
} from '../garden.js';
import { homeOf } from '../perks.js';
import { plotArt, cropIcon, stageFor } from '../art/crops.js';
import { coin, icon } from '../art/icons.js';
import { itemArt } from '../art/items.js';
import { msToMidnight } from '../clock.js';
import { t, num, duration, countdown } from '../text.js';

const cropName = (id) => t(`crop.${id}`);

export function mountGarden(root, { onAct }) {
  root.innerHTML = `
  <section class="garden">
    <div class="title-row">
      <div>
        <h1>${t('garden.title')}</h1>
        <p class="sub">${t('garden.sub')}</p>
      </div>
      <button class="harvest-all" data-act="harvestAll" data-ref="harvestAll" hidden></button>
    </div>
    <div class="seeds" data-ref="seeds" role="radiogroup" aria-label="${t('garden.seeds')}"></div>
    <div class="field" data-ref="plots"></div>
    <p class="field-note" data-ref="fieldNote" hidden></p>
    <div class="market">
      <div class="market-top">
        <h2>${t('market.title')}</h2>
        <span class="market-left" data-ref="marketLeft"></span>
      </div>
      <div class="barn" data-ref="barn"></div>
      <p class="market-note" data-ref="marketNote"></p>
    </div>
  </section>`;

  const ref = Object.fromEntries([...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]));
  const drawn = { seeds: '', plots: '', barn: '' };
  let growing = []; // the growing plots, whose time left changes every second

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const arg = el.dataset.arg;
    onAct(el.dataset.act, el.dataset.act === 'plot' ? Number(arg) : arg);
  });

  function update(state, now) {
    const { garden } = state;
    const ready = readyCount(state, now);
    // With the tractor, one button harvests and replants everything.
    const tractor = hasTractor(state);
    const empty = garden.plots.some((plot) => !plot.crop);
    ref.harvestAll.hidden = tractor ? !ready && !empty : ready < 2;
    ref.harvestAll.dataset.act = tractor ? 'tractor' : 'harvestAll';
    const label = tractor ? `${itemArt('tractor', 24)}${t('garden.tractor')}` : `${icon('garden', 18)}${t('garden.harvestAll', { n: ready })}`;
    if (ref.harvestAll.dataset.label !== label) {
      ref.harvestAll.innerHTML = label;
      ref.harvestAll.dataset.label = label;
    }

    drawSeeds(state);
    drawPlots(state, now);
    for (const { plot, el } of growing) {
      const left = countdown(plot.readyAt - now);
      el.querySelector('.plot-time').textContent = left;
      el.querySelector('.bar i').style.width = `${Math.round(progress(plot, now) * 100)}%`;
      el.setAttribute('aria-label', t('garden.growingLabel', { crop: cropName(plot.crop), time: left }));
    }

    const left = marketLeft(state, now);
    ref.marketLeft.textContent = left ? t('market.left', { n: left }) : t('market.closed');
    ref.marketLeft.classList.toggle('closed', !left);
    drawBarn(state, left);
    ref.marketNote.textContent = !left
      ? t('market.fullNote', { time: duration(msToMidnight(now)) })
      : barnTotal(state) ? '' : t('market.empty');
    ref.marketNote.hidden = !ref.marketNote.textContent;

    const full = garden.plots.length >= roomForPlots(state);
    ref.fieldNote.hidden = !full;
    if (full) ref.fieldNote.textContent = t('garden.noRoom', { home: t(`item.${homeOf(state).id}`), n: roomForPlots(state) });
  }

  function drawSeeds(state) {
    const { seed, planted } = state.garden;
    const key = `${seed}|${state.nemla.level}|${Object.values(planted).join()}|${CROPS.map((c) => growTime(state, c) + priceOf(state, c)).join()}`;
    if (key === drawn.seeds) return;
    drawn.seeds = key;
    ref.seeds.innerHTML = CROPS.map((crop) => {
      const name = cropName(crop.id);
      if (!canGrow(state, crop)) {
        return `
        <button class="seed locked" data-act="seedLocked" data-arg="${crop.id}" aria-label="${t('garden.seedLocked', { crop: name, level: crop.level })}">
          <span class="seed-icon">${cropIcon(crop.id, 30)}<span class="seed-lock">${icon('lock', 10)}</span></span>
          <span class="seed-text"><b>${name}</b><small>${t('work.needsLevel', { level: crop.level })}</small></span>
        </button>`;
      }
      const grow = duration(growTime(state, crop));
      const on = crop.id === seed;
      return `
        <button class="seed${on ? ' on' : ''}" role="radio" aria-checked="${on}" data-act="seed" data-arg="${crop.id}"
          aria-label="${t('garden.seedLabel', { crop: name, coins: crop.seed, grow, sell: priceOf(state, crop) })}">
          <span class="seed-icon">${cropIcon(crop.id, 30)}</span>
          <span class="seed-text">
            <b>${name}</b>
            <small>${coin(11)}${crop.seed} · ${grow}</small>
            <small class="seed-sell">${t('garden.sells', { coins: priceOf(state, crop) })}</small>
          </span>
        </button>`;
    }).join('');
  }

  function drawPlots(state, now) {
    const { plots, seed } = state.garden;
    const price = nextPlotPrice(state);
    const room = roomForPlots(state);
    const stages = plots.map((plot) => (plot.crop ? `${plot.crop}${stageFor(progress(plot, now), isReady(plot, now))}` : '-'));
    const key = `${seed}|${room}|${state.coins >= price}|${stages.join()}`;
    if (key === drawn.plots) return;
    drawn.plots = key;

    const seedCrop = cropById(seed);
    ref.plots.innerHTML = plots.map((plot, i) => {
      if (!plot.crop) {
        const name = cropName(seed);
        return `
        <button class="plot empty" data-act="plot" data-arg="${i}" aria-label="${t('garden.plantLabel', { crop: name, coins: seedCrop.seed })}">
          ${plotArt(null, 0)}
          <span class="plot-act">${t('garden.plant')} ${coin(12)}${seedCrop.seed}</span>
        </button>`;
      }
      const ready = isReady(plot, now);
      const stage = stageFor(progress(plot, now), ready);
      if (ready) {
        return `
        <button class="plot ready" data-act="plot" data-arg="${i}" aria-label="${t('garden.readyLabel', { crop: cropName(plot.crop) })}">
          ${plotArt(plot.crop, stage)}
          <span class="plot-act">${t('garden.harvest')}</span>
        </button>`;
      }
      return `
        <button class="plot growing" data-act="plot" data-arg="${i}">
          ${plotArt(plot.crop, stage)}
          <span class="plot-info"><b>${cropName(plot.crop)}</b><span class="plot-time"></span></span>
          <span class="bar"><i></i></span>
        </button>`;
    }).join('') + (plots.length < room ? `
        <button class="plot buy" data-act="buyPlot" aria-label="${t('garden.buyLabel', { coins: num(price) })}">
          <span class="plot-new">${icon('plus', 22)}</span>
          <span class="plot-act${state.coins >= price ? '' : ' short'}">${coin(12)}${num(price)}</span>
        </button>` : '') + '<span class="plot spare" aria-hidden="true"></span>'.repeat(Math.max(0, room - plots.length - 1));

    const buttons = ref.plots.querySelectorAll('[data-act="plot"]');
    growing = plots.map((plot, i) => ({ plot, el: buttons[i] })).filter(({ el }) => el.classList.contains('growing'));
  }

  function drawBarn(state, left) {
    const { barn } = state.garden;
    const key = `${left > 0}|${CROPS.map((crop) => `${barn[crop.id]}:${priceOf(state, crop)}`).join()}`;
    if (key === drawn.barn) return;
    drawn.barn = key;
    const have = CROPS.filter((crop) => barn[crop.id] > 0);
    const rows = have.map((crop) => {
      const count = barn[crop.id];
      const price = priceOf(state, crop);
      const name = cropName(crop.id);
      return `
      <div class="barn-row" data-crop="${crop.id}">
        <span class="barn-icon">${cropIcon(crop.id, 34)}</span>
        <span class="barn-text"><b>${t('market.count', { crop: name, n: count })}</b><small>${t('market.price', { coins: price })}</small></span>
        <button class="sell" data-act="sell" data-arg="${crop.id}" ${left ? '' : 'disabled'}
          aria-label="${t('market.sellLabel', { n: count, crop: name, coins: num(count * price) })}">
          ${t('market.sell')} ${coin(15)}+${num(count * price)}
        </button>
      </div>`;
    });
    if (have.length > 1) {
      const total = have.reduce((sum, crop) => sum + barn[crop.id] * priceOf(state, crop), 0);
      rows.push(`
      <button class="sell-all" data-act="sellAll" ${left ? '' : 'disabled'}>
        ${t('market.sellAll')} ${coin(16)}+${num(total)}
      </button>`);
    }
    ref.barn.innerHTML = rows.join('');
  }

  // Shows what an action did, on top of what update() draws: a number that
  // floats up from a plot ('plot', index) or a market row ('crop', id).
  function react(where, key, text) {
    const target = where === 'plot'
      ? ref.plots.querySelectorAll('[data-act="plot"]')[key]
      : ref.barn.querySelector(`.barn-row[data-crop="${key}"]`) ?? root.querySelector('.market');
    if (!target) return;
    const float = document.createElement('span');
    float.className = 'pop-text';
    float.textContent = text;
    target.append(float);
    setTimeout(() => float.remove(), 1200);
  }

  return { update, react };
}
