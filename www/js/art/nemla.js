// Nemla: the real head (assets/nemla-head.png, 300×343, antennae included)
// on a drawn body. Everything is in the units of the SVG it is placed in.
const HEAD = 'assets/nemla-head.png';
const HEAD_RATIO = 343 / 300;

// The body, drawn for a head 56 wide on a 46×38 grid.
const BODY = `
  <path d="M15 28L11 35M31 28L35 35" stroke="#2f3f47" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="10" cy="35.5" rx="4" ry="2.2" fill="#2f3f47"/>
  <ellipse cx="36" cy="35.5" rx="4" ry="2.2" fill="#2f3f47"/>
  <path d="M8 12Q1 15 3 21M38 12Q45 15 43 21" stroke="#2f3f47" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="23" cy="17" rx="16" ry="14" fill="#8fcfc2" stroke="#2f3f47" stroke-width="2.5"/>
  <ellipse cx="23" cy="20" rx="8" ry="6.5" fill="#c3ebe4"/>`;

// Closed eyes, drawn over the open ones. Measured on the head image at
// 350 px wide, so they are scaled by the head's width / 350.
const EYELIDS = `
  <ellipse cx="104" cy="250" rx="42" ry="46" fill="#8dcbbd"/>
  <ellipse cx="240" cy="248" rx="42" ry="46" fill="#8dcbbd"/>
  <path d="M64 256Q104 290 144 256M200 254Q240 288 280 254" stroke="#2f3f47" stroke-width="7" fill="none" stroke-linecap="round"/>`;

const eyelids = (x, y, width, cls) =>
  `<g class="${cls}" transform="translate(${x} ${y}) scale(${width / 350})">${EYELIDS}</g>`;

// Outfits from the Shop. Hats and glasses are drawn on the head image's own
// 300×343 grid (the dome starts at y 99, the eyes are at 89 and 206, y 214);
// overalls on the body's 46×38 grid.
const INK = '#2f3f47';
const ON_HEAD = {
  redCap: `
    <path d="M62 146Q60 84 150 80Q240 84 238 146Z" fill="#e7464e" stroke="${INK}" stroke-width="7"/>
    <path d="M50 146Q150 186 250 146Q150 160 50 146Z" fill="#b42f38" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M112 118H188" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
    <circle cx="150" cy="82" r="9" fill="#fff" stroke="${INK}" stroke-width="5"/>`,
  strawHat: `
    <ellipse cx="150" cy="134" rx="148" ry="26" fill="#f0c96a" stroke="${INK}" stroke-width="7"/>
    <path d="M84 134Q82 62 150 60Q218 62 216 134Z" fill="#f0c96a" stroke="${INK}" stroke-width="7"/>
    <path d="M86 116Q150 132 214 116" stroke="#e7464e" stroke-width="16"/>`,
  sunglasses: `
    <path d="M30 196H270" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <rect x="44" y="180" width="92" height="66" rx="28" fill="${INK}"/>
    <rect x="162" y="180" width="92" height="66" rx="28" fill="${INK}"/>
    <path d="M62 198l28-4M180 198l28-4" stroke="#8b9da2" stroke-width="8" stroke-linecap="round"/>`,
};
const ON_BODY = {
  overalls: `
    <path d="M8 18H38Q38 31 23 31Q8 31 8 18Z" fill="#3d6fb6" stroke="${INK}" stroke-width="2"/>
    <rect x="16" y="11" width="14" height="9" rx="1.5" fill="#3d6fb6" stroke="${INK}" stroke-width="1.6"/>
    <path d="M16 12L11 5M30 12l5-7" stroke="#3d6fb6" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="18.5" cy="13.5" r="1.2" fill="#ffc93c"/><circle cx="27.5" cy="13.5" r="1.2" fill="#ffc93c"/>`,
};

// Nemla standing, centred on `x` with the feet on `feet`, wearing `outfit`
// if any. The outer group is for one-off moves (a bounce when tapped), the
// inner one for the idle bob.
export function standing({ x, feet, width, outfit = null }) {
  const s = width / 56;
  const bodyY = feet - 38 * s;
  const headH = width * HEAD_RATIO;
  const headX = x - width / 2;
  const headY = bodyY + 9 * s - headH;
  return `
  <g class="nemla">
    <g class="nemla-bob">
      <g transform="translate(${x - 23 * s} ${bodyY}) scale(${s})">${BODY}${ON_BODY[outfit] ?? ''}</g>
      <image href="${HEAD}" x="${headX}" y="${headY}" width="${width}" height="${headH}"/>
      ${eyelids(headX, headY, width, 'eyelids')}
      ${ON_HEAD[outfit] ? `<g transform="translate(${headX} ${headY}) scale(${width / 300})">${ON_HEAD[outfit]}</g>` : ''}
    </g>
  </g>`;
}

// Just the head, eyes closed: Nemla asleep with the blanket pulled up.
export function inBed({ x, y, width }) {
  return `
  <g class="nemla-in-bed">
    <image href="${HEAD}" x="${x}" y="${y}" width="${width}" height="${width * HEAD_RATIO}"/>
    ${eyelids(x, y, width, 'eyelids-closed')}
  </g>`;
}
