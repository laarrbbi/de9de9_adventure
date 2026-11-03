// The tab bar. Only Home is open for now; the other tabs show a lock and say
// they are coming, so players can see what the game will become.
import { icon } from '../art/icons.js';
import { t } from '../text.js';

const TABS = ['home', 'garden', 'work', 'shop', 'friends', 'map'];
const OPEN = new Set(['home']);

export function mountTabs(root, { onLocked }) {
  root.innerHTML = TABS.map((id) => {
    const name = t(`tab.${id}`);
    if (OPEN.has(id)) {
      return `<button class="tab on" data-tab="${id}" aria-current="page"><span class="tab-icon">${icon(id)}</span>${name}</button>`;
    }
    return `<button class="tab" data-tab="${id}" aria-label="${t('tab.locked', { name })}">
      <span class="tab-icon">${icon(id)}<span class="tab-lock">${icon('lock', 10)}</span></span>${name}</button>`;
  }).join('');

  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]')?.dataset.tab;
    if (tab && !OPEN.has(tab)) onLocked(tab);
  });
}
