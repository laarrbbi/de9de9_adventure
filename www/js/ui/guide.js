// The guide's banner, between the top bar and the screen: what to do next,
// a Go button that opens the right tab, and a ring on the thing to tap.
// `onGo(tab)` switches tabs; `onClose()` closes the last step.
import { STEPS, guideStep, waiting } from '../guide.js';
import { nextHome } from '../shop.js';
import { t, num } from '../text.js';

export function mountGuide(root, { onGo, onClose }) {
  root.innerHTML = `
    <img class="guide-face" src="assets/nemla-head.png" alt="">
    <span class="guide-text"><small data-ref="count"></small><b data-ref="say"></b></span>
    <button class="guide-go" data-ref="go"></button>`;
  const ref = Object.fromEntries([...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]));
  let hinted = null;
  let step = null;
  let here = false;

  // Go opens the step's tab; on the goal step, once there, it closes the guide.
  ref.go.addEventListener('click', () => {
    if (!step) return;
    if (here) onClose();
    else onGo(step.tab);
  });

  // `screen` is the element of the screen being shown, `tab` its name.
  function update(state, now, tab, screen) {
    step = guideStep(state);
    root.hidden = !step;
    if (!step) return hint(null);
    const index = STEPS.indexOf(step);
    const home = nextHome(state);
    const wait = waiting(state, now);
    ref.count.textContent = t('guide.count', { n: index + 1, total: STEPS.length });
    ref.say.textContent = wait ? t('guide.growing')
      : t(`guide.${step.id}`, { coins: num(home?.price ?? 0), home: t(`item.${home?.id ?? 'anthill'}`) });
    here = tab === step.tab;
    ref.go.hidden = here && step.id !== 'goal';
    ref.go.textContent = here ? t('guide.ok') : t('guide.go', { tab: t(`tab.${step.tab}`) });
    ref.go.dataset.tab = step.tab;
    hint(here && !wait ? screen.querySelector(step.target) : null);
  }

  function hint(el) {
    if (hinted === el) return;
    hinted?.classList.remove('hint');
    hinted = el;
    el?.classList.add('hint');
  }

  return { update };
}
