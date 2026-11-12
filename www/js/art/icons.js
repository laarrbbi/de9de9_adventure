// Line icons on a 24×24 grid. They take the colour of the text around them.
const PATHS = {
  hunger: '<path d="M12 7C9 5 5 6 5 11c0 5 3 9 5 9 1 0 1-.5 2-.5s1 .5 2 .5c2 0 5-4 5-9 0-5-4-6-7-4z"/><path d="M12 7c0-2 1-4 3-4"/>',
  energy: '<path d="M13 2L5 13h6l-1 9 9-12h-6z"/>',
  clean: '<path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12z"/>',
  fun: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 5.9L12 16.2l-5.4 3 1.3-5.9-4.5-4 6-.7z"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  garden: '<path d="M12 21V11"/><path d="M12 11C12 7 9 5 5 5c0 4 3 6 7 6z"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M6 21h12"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  shop: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  friends: '<ellipse cx="12" cy="14" rx="6" ry="7"/><circle cx="12" cy="5.5" r="2.5"/><path d="M12 8v13"/><path d="M6 11L3 9M6 15H3M18 11l3-2M18 15h3"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 4 0-3-.5-6 1-9z"/>',
};

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

export const icon = (name, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${STROKE} aria-hidden="true">${PATHS[name]}</svg>`;

// The same icon as a group to place inside another SVG drawing.
export const iconGroup = (name, x, y, size, color) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" ${STROKE.replace('currentColor', color)}>${PATHS[name]}</g>`;

export const coin = (size = 22) =>
  `<svg class="coin" width="${size}" height="${size}" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#ffc93c" stroke="#d99a00" stroke-width="2"/><circle cx="11" cy="11" r="5" fill="none" stroke="#d99a00" stroke-width="1.6"/></svg>`;
