// The tab bar. Open tabs switch screens; the others show a lock and say they
// are coming, so players can see what the game will become.
import { icon } from '../art/icons.js';
import { t } from '../text.js';

const TABS = ['home', 'garden', 'work', 'shop', 'friends', 'map'];

export function mountTabs(root, { open, onSelect, onLocked }) {
  root.innerHTML = TABS.map((id) => {
    const name = t(`tab.${id}`);
    if (open.includes(id)) {
      return `<button class="tab" data-tab="${id}"><span class="tab-icon">${icon(id)}</span>${name}</button>`;
    }
    return `<button class="tab" data-tab="${id}" aria-label="${t('tab.locked', { name })}">
      <span class="tab-icon">${icon(id)}<span class="tab-lock">${icon('lock', 10)}</span></span>${name}</button>`;
  }).join('');

  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]')?.dataset.tab;
    if (!tab) return;
    if (open.includes(tab)) onSelect(tab);
    else onLocked(tab);
  });

  return {
    setActive(tab) {
      for (const button of root.querySelectorAll('.tab')) {
        const on = button.dataset.tab === tab;
        button.classList.toggle('on', on);
        if (on) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      }
    },
  };
}
