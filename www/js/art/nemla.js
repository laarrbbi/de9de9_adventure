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

// Nemla standing, centred on `x` with the feet on `feet`. The outer group is
// for one-off moves (a bounce when tapped), the inner one for the idle bob.
export function standing({ x, feet, width }) {
  const s = width / 56;
  const bodyY = feet - 38 * s;
  const headH = width * HEAD_RATIO;
  const headX = x - width / 2;
  const headY = bodyY + 9 * s - headH;
  return `
  <g class="nemla">
    <g class="nemla-bob">
      <g transform="translate(${x - 23 * s} ${bodyY}) scale(${s})">${BODY}</g>
      <image href="${HEAD}" x="${headX}" y="${headY}" width="${width}" height="${headH}"/>
      ${eyelids(headX, headY, width, 'eyelids')}
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
