// The bar at the top of every screen: Nemla's level, coins, De9De9 points.
import { coin } from '../art/icons.js';
import { levelProgress } from '../level.js';
import { SERVICE_COST } from '../economy.js';
import { t, num } from '../text.js';

export function mountHud(root) {
  root.innerHTML = `
    <div class="who">
      <span class="avatar"><img src="assets/nemla-head.png" alt=""></span>
      <span class="who-text">
        <b>Nemla</b>
        <span class="lvl"><span data-ref="level"></span><span class="xp"><i data-ref="xp"></i></span></span>
      </span>
    </div>
    <div class="purse">
      <span class="pill coins" role="img" data-ref="coinsPill">${coin(22)}<b data-ref="coins"></b></span>
      <span class="pill points" role="img" data-ref="pointsPill"><small>De9De9</small><b data-ref="points"></b></span>
    </div>`;
  const ref = Object.fromEntries([...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]));
  let lastCoins = null;

  return {
    update(state) {
      ref.level.textContent = t('hud.level', { level: state.nemla.level });
      ref.xp.style.width = `${Math.round(levelProgress(state.nemla) * 100)}%`;
      ref.coins.textContent = num(state.coins);
      ref.coinsPill.setAttribute('aria-label', t('hud.coins', { coins: num(state.coins) }));
      ref.points.textContent = `${num(state.points.balance)}/${num(SERVICE_COST)}`;
      ref.pointsPill.setAttribute('aria-label', t('hud.points', { points: num(state.points.balance), goal: num(SERVICE_COST) }));
      if (lastCoins !== null && state.coins !== lastCoins) {
        const pill = ref.coinsPill;
        pill.classList.remove('up', 'down');
        void pill.offsetWidth; // restart the animation
        pill.classList.add(state.coins > lastCoins ? 'up' : 'down');
      }
      lastCoins = state.coins;
    },
  };
}
