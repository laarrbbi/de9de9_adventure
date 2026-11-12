// Nemla's home: one SVG scene (360×380) that scales with the screen. Each of
// the 5 homes has its own outside, walls and decoration around the same
// room, so the furniture and Nemla stay in the same places; rooms bought in
// the Shop swap in better furniture. Things the player can tap are groups
// with class "obj" and a data-act naming what tapping does; their "hit"
// rect is the tap area and shows keyboard focus. What shows depends on
// classes on the <svg>: "night", "asleep".
import { standing, inBed } from './nemla.js';
import { iconGroup } from './icons.js';
import { NEEDS } from '../needs.js';
import { t } from '../text.js';

// Where effects appear (floating numbers, bubbles, notes), in scene units.
export const SPOTS = {
  head: { x: 180, y: 214 },
  mouth: { x: 180, y: 272 },
  radio: { x: 78, y: 204 },
  tub: { x: 256, y: 312 },
};

// The object that fills each need wears a bouncing "!" when that need is low.
const BADGES = { hunger: [310, 214], energy: [112, 288], clean: [256, 290], fun: [78, 178] };

const STARS = [[30, 16], [74, 34], [150, 12], [196, 40], [252, 18], [292, 52], [344, 62], [110, 58]];
const INK = '#2f3f47';

const obj = (act, label, hit, body) => `
  <g class="obj" data-act="${act}" role="button" tabindex="0" aria-label="${label}">
    <rect class="hit" x="${hit[0]}" y="${hit[1]}" width="${hit[2]}" height="${hit[3]}" rx="10"/>
    ${body}
  </g>`;

const roundRect = (x, y, w, h, r) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
  `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const sunAndMoon = `
  <g class="day-only">
    <circle cx="322" cy="30" r="14" fill="#ffd76a"/>
    <ellipse cx="150" cy="28" rx="24" ry="9" fill="#fff"/>
    <ellipse cx="168" cy="23" rx="14" ry="10" fill="#fff"/>
  </g>
  <g class="night-only">
    ${STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}
    <circle cx="322" cy="30" r="12" fill="#f4f1d0"/>
    <circle class="sky" cx="329" cy="25" r="11"/>
  </g>`;

const tufts = '<path d="M120 64l3-8 3 8M136 64l2-6 3 6M300 64l3-9 3 9M330 64l2-6 3 6" stroke="#4f9e4c" stroke-width="2" fill="none" stroke-linecap="round"/>';

const underground = `
  <rect class="sky" width="360" height="74"/>
  ${sunAndMoon}
  <rect y="64" width="360" height="12" fill="#7cc576"/>
  <rect y="74" width="360" height="306" fill="#a8714a"/>
  <g fill="#94603c">
    <circle cx="28" cy="96" r="4"/><circle cx="334" cy="92" r="3"/><circle cx="8" cy="250" r="5"/>
    <circle cx="352" cy="200" r="4"/><circle cx="350" cy="370" r="3"/><circle cx="10" cy="372" r="4"/>
  </g>
  ${tufts}`;

const bulb = (x) => `
  <line x1="${x}" y1="110" x2="${x}" y2="124" stroke="#8b5e3c" stroke-width="2"/>
  <circle class="lamp-glow" cx="${x}" cy="131" r="16" fill="#fff3a6" opacity="0.45"/>
  <circle cx="${x}" cy="131" r="6" fill="#fff3a6" stroke="#e5c34a" stroke-width="2"/>`;

const pendant = (x, top, color) => `
  <line x1="${x}" y1="${top}" x2="${x}" y2="124" stroke="${INK}" stroke-width="1.5"/>
  <circle class="lamp-glow" cx="${x}" cy="136" r="20" fill="#fff3a6" opacity="0.4"/>
  <path d="M${x - 14} 136L${x - 7} 124H${x + 7}L${x + 14} 136Z" fill="${color}" stroke="${INK}" stroke-width="1.5"/>
  <circle cx="${x}" cy="138" r="3.5" fill="#fff3a6"/>`;

const chandelier = `
  <line x1="180" y1="100" x2="180" y2="122" stroke="#d99a00" stroke-width="2"/>
  <circle class="lamp-glow" cx="180" cy="136" r="30" fill="#fff3a6" opacity="0.35"/>
  <path d="M150 132Q180 150 210 132" stroke="#d99a00" stroke-width="3" fill="none"/>
  <circle cx="180" cy="126" r="5" fill="#ffc93c" stroke="#d99a00" stroke-width="1.5"/>
  ${[150, 165, 195, 210].map((x, i) => `<rect x="${x - 2}" y="${i % 3 ? 128 : 122}" width="4" height="9" fill="#fff"/><circle cx="${x}" cy="${i % 3 ? 125 : 119}" r="2.5" fill="#ffb13c"/>`).join('')}`;

// A framed picture of the De9De9 mark.
const logoFrame = (x, y, w) => `
  <rect x="${x}" y="${y}" width="${w}" height="${w * 0.8}" rx="3" fill="#e7464e" stroke="#8b5e3c" stroke-width="3"/>
  <image href="assets/logo-mark.png" x="${x + w * 0.18}" y="${y + w * 0.1}" width="${w * 0.64}" height="${w * 0.57}"/>`;

const windowFrame = (x, y, w, h, arched = false) => {
  const glass = arched
    ? `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`
    : roundRect(x, y, w, h, 3);
  return `
  <path class="sky" d="${glass}" stroke="#fff" stroke-width="5"/>
  <path d="M${x + w / 2} ${y + (arched ? 2 : 0)}V${y + h}M${x} ${y + h * 0.55}H${x + w}" stroke="#fff" stroke-width="3"/>
  <path d="${glass}" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
};

const rug = (fill, edge) => `
  <ellipse cx="180" cy="350" rx="110" ry="8" fill="${fill}"/>
  <ellipse cx="180" cy="350" rx="96" ry="5" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="6 4"/>`;

// One zellige star tile, repeated along the palace's lower wall.
const ZELLIGE = `
  <pattern id="zellige" width="20" height="20" patternUnits="userSpaceOnUse">
    <rect width="20" height="20" fill="#fbf3e2"/>
    <rect x="4" y="4" width="12" height="12" fill="#16736c"/>
    <rect x="4" y="4" width="12" height="12" fill="#65cbc4" transform="rotate(45 10 10)"/>
    <circle cx="10" cy="10" r="2.5" fill="#ffc93c"/>
  </pattern>`;

// Each home: what is behind and around the room, the room's outline, its
// light, and the decoration on its walls.
const HOMES = [
  { // the little hole
    room: roundRect(16, 110, 328, 250, 44),
    back: `${underground}
      <path d="M200 76Q240 44 280 76Z" fill="#c98f5a"/>
      <ellipse cx="240" cy="70" rx="12" ry="7" fill="#5b3a22"/>
      <rect x="230" y="72" width="20" height="48" fill="#e6c49a"/>`,
    wall: '#f3dcb8',
    light: bulb(150),
    decor: '<ellipse cx="180" cy="350" rx="118" ry="7" fill="#9fdcd6" opacity="0.7"/>',
  },
  { // the anthill
    room: roundRect(16, 110, 328, 250, 44),
    back: `${underground}
      <path d="M150 77Q250 -16 350 77Z" fill="#c98f5a" stroke="#a8714a" stroke-width="2"/>
      <g fill="#b07a4a"><circle cx="210" cy="56" r="3"/><circle cx="292" cy="44" r="3.5"/><circle cx="318" cy="64" r="2.5"/><circle cx="246" cy="36" r="2.5"/></g>
      <path d="M238 76V58a12 12 0 0 1 24 0V76Z" fill="#5b3a22"/>
      <rect x="240" y="74" width="20" height="44" fill="#e6c49a"/>
      <path d="M40 76q4 14-2 24M96 76q-3 10 3 18M318 76q-4 12 2 22" stroke="#7a4f2e" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    wall: '#f6e0bb',
    light: bulb(150),
    decor: `${logoFrame(44, 126, 50)}
      <rect x="272" y="160" width="56" height="5" rx="2" fill="#8b5e3c"/>
      <path d="M284 160h12l-2-12h-8Z" fill="#c98f5a"/><path d="M290 148q-6-10 0-16q6 6 0 16M290 148q8-6 12-2" stroke="#4f9e4c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="314" cy="154" r="6" fill="#ffc93c" stroke="#d99a00" stroke-width="1.5"/>
      ${rug('#e7464e', '#ffc93c')}`,
  },
  { // the big house
    room: roundRect(16, 110, 328, 250, 14),
    back: `
      <rect class="sky" width="360" height="380"/>
      ${sunAndMoon}
      <rect x="4" y="96" width="352" height="284" fill="#f7efe0" stroke="#d9c9ab" stroke-width="2"/>
      <path d="M0 104L180 30L360 104Z" fill="#e7464e" stroke="#b42f38" stroke-width="3" stroke-linejoin="round"/>
      <path d="M60 80H300M110 60H250" stroke="#c8343c" stroke-width="2"/>
      <rect x="262" y="40" width="22" height="34" fill="#c98f5a" stroke="#8b5e3c" stroke-width="2"/>`,
    wall: '#e3f3f0',
    stripes: '#d3ebe7',
    floor: '#d4a373',
    light: pendant(150, 110, '#ff8515'),
    decor: `${logoFrame(44, 126, 50)}${windowFrame(262, 122, 60, 54)}${rug('#65cbc4', '#fff')}`,
  },
  { // the villa
    room: roundRect(16, 110, 328, 250, 14),
    back: `
      <rect class="sky" width="360" height="380"/>
      ${sunAndMoon}
      <path d="M222 104V40" stroke="#a8714a" stroke-width="5"/>
      <path d="M222 40q-16-6-22 4M222 40q14-8 24 2M222 40q-6-12-18-12M222 40q8-12 20-10" stroke="#4f9e4c" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="4" y="96" width="352" height="284" fill="#fdfbf6" stroke="#e3ddd0" stroke-width="2"/>
      <rect x="0" y="86" width="360" height="14" rx="2" fill="#e08a4a" stroke="#b9682f" stroke-width="2"/>
      <path d="M0 93H360" stroke="#c97a3e" stroke-width="1.5" stroke-dasharray="10 6"/>`,
    wall: '#fbf8f2',
    tiles: '#cfe9f3',
    floor: '#e9e1d2',
    light: pendant(150, 110, '#65cbc4'),
    decor: `${windowFrame(254, 120, 70, 66, true)}${logoFrame(186, 124, 44)}
      <path d="M100 110V126" stroke="${INK}" stroke-width="1.5"/>
      <path d="M90 126h20l-3 12h-14Z" fill="#c98f5a" stroke="#8b5e3c" stroke-width="1.5"/>
      <path d="M93 136q-8 14-4 30M100 138q0 16 4 26M107 136q8 10 6 22" stroke="#4f9e4c" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${rug('#3d6fb6', '#fff')}`,
  },
  { // the palace
    room: 'M16 360V176C16 124 96 98 180 98C264 98 344 124 344 176V360Z',
    back: `
      <defs>${ZELLIGE}</defs>
      <rect class="sky" width="360" height="380"/>
      ${sunAndMoon}
      <path d="M118 96A62 62 0 0 1 242 96Z" fill="#65cbc4" stroke="#16736c" stroke-width="2"/>
      <path d="M180 34V22" stroke="#d99a00" stroke-width="3"/><circle cx="180" cy="19" r="4" fill="#ffc93c"/>
      <rect x="4" y="88" width="352" height="292" fill="#f2d9a6" stroke="#d9b97a" stroke-width="2"/>
      <path d="M4 88h352" stroke="#e7464e" stroke-width="4"/>
      <rect x="0" y="40" width="26" height="340" fill="#f2d9a6" stroke="#d9b97a" stroke-width="2"/>
      <rect x="334" y="40" width="26" height="340" fill="#f2d9a6" stroke="#d9b97a" stroke-width="2"/>
      <path d="M0 40L13 18L26 40ZM334 40L347 18L360 40Z" fill="#65cbc4" stroke="#16736c" stroke-width="2"/>`,
    wall: '#fbf3e2',
    zellige: true,
    light: chandelier,
    decor: `${windowFrame(266, 124, 50, 60, true)}${windowFrame(44, 124, 50, 60, true)}${rug('#b42f38', '#ffc93c')}`,
  },
];

// The room's walls: plain, striped wallpaper, a tiled lower wall or zellige,
// and a wooden or stone floor, all clipped to the room's outline.
function walls(home) {
  const extras = [
    home.stripes && Array.from({ length: 21 }, (_, i) => `<rect x="${16 + i * 16}" y="96" width="7" height="270" fill="${home.stripes}"/>`).join(''),
    home.tiles && `<rect x="16" y="296" width="328" height="64" fill="${home.tiles}"/><path d="${Array.from({ length: 21 }, (_, i) => `M${16 + i * 16} 296V360`).join('')}M16 312H344M16 328H344M16 344H344" stroke="#fff" stroke-width="1.5"/>`,
    home.zellige && '<rect x="16" y="300" width="328" height="60" fill="url(#zellige)"/><path d="M16 300H344" stroke="#d99a00" stroke-width="3"/>',
    home.floor && `<rect x="16" y="336" width="328" height="24" fill="${home.floor}"/><path d="M16 336H344M60 336v24M130 336v24M210 336v24M290 336v24" stroke="#00000022" stroke-width="1.5"/>`,
  ].filter(Boolean).join('');
  return `
  <clipPath id="room-clip"><path d="${home.room}"/></clipPath>
  <path d="${home.room}" fill="${home.wall}"/>
  <g clip-path="url(#room-clip)">${extras}</g>`;
}

// Furniture: the basic piece, or the better one once its room is bought.
const radio = () => `
  <rect x="40" y="236" width="76" height="6" rx="2" fill="#8b5e3c"/>
  <path d="M98 206L110 188" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="110" cy="188" r="2.5" fill="${INK}"/>
  <rect x="52" y="206" width="52" height="30" rx="6" fill="#ff8515" stroke="${INK}" stroke-width="2"/>
  <circle cx="68" cy="221" r="8" fill="#ffd9b0" stroke="${INK}" stroke-width="1.5"/>
  <rect x="82" y="214" width="14" height="4" rx="2" fill="${INK}"/>
  <circle cx="89" cy="227" r="3" fill="${INK}"/>`;

const stereo = () => `
  <rect x="38" y="238" width="80" height="6" rx="2" fill="#8b5e3c"/>
  ${[40, 98].map((x) => `
  <rect x="${x}" y="192" width="18" height="46" rx="3" fill="${INK}"/>
  <circle cx="${x + 9}" cy="205" r="5" fill="#8b9da2"/><circle cx="${x + 9}" cy="224" r="7" fill="#8b9da2"/><circle cx="${x + 9}" cy="224" r="2.5" fill="${INK}"/>`).join('')}
  <rect x="61" y="212" width="34" height="26" rx="4" fill="#ff8515" stroke="${INK}" stroke-width="2"/>
  <rect x="66" y="217" width="24" height="7" rx="2" fill="#dff4f1"/>
  <circle cx="72" cy="231" r="3" fill="${INK}"/><circle cx="84" cy="231" r="3" fill="${INK}"/>`;

const bed = () => `
  <rect x="34" y="286" width="9" height="62" rx="4" fill="#8b5e3c"/>
  <rect x="44" y="340" width="6" height="8" fill="#8b5e3c"/>
  <rect x="118" y="340" width="6" height="8" fill="#8b5e3c"/>
  <rect x="38" y="318" width="92" height="24" rx="8" fill="#b07a4a"/>
  <rect x="46" y="294" width="28" height="14" rx="6" fill="#fff" stroke="#e0c9a6" stroke-width="1.5"/>
  ${inBed({ x: 39, y: 255, width: 46 })}
  <rect x="42" y="306" width="86" height="20" rx="8" fill="#e7464e"/>
  <path d="M44 313H126" stroke="#c8343c" stroke-width="2"/>`;

const bigBed = () => `
  <path d="M30 348V272q0-12 12-12h4q8 0 8 10v8" fill="#a8714a" stroke="#7a4f2e" stroke-width="2"/>
  <circle cx="42" cy="270" r="3" fill="#ffc93c"/>
  <rect x="124" y="304" width="9" height="44" rx="4" fill="#a8714a" stroke="#7a4f2e" stroke-width="2"/>
  <rect x="36" y="318" width="96" height="24" rx="8" fill="#b07a4a"/>
  <rect x="44" y="292" width="30" height="15" rx="6" fill="#fff" stroke="#e0c9a6" stroke-width="1.5"/>
  ${inBed({ x: 39, y: 255, width: 46 })}
  <rect x="40" y="304" width="90" height="24" rx="8" fill="#65cbc4"/>
  <path d="M44 312H126M44 320H126" stroke="#16736c" stroke-width="1.5" stroke-dasharray="4 4"/>`;

const tub = () => `
  <path d="M222 318H290L284 346Q256 352 228 346Z" fill="#c98f5a" stroke="#8b5e3c" stroke-width="2" stroke-linejoin="round"/>
  <path d="M225 331H287" stroke="#8b5e3c" stroke-width="2"/>
  <ellipse cx="256" cy="318" rx="34" ry="6" fill="#9fd9ea" stroke="#8b5e3c" stroke-width="2"/>
  <circle cx="240" cy="313" r="4" fill="#fff"/>
  <circle cx="249" cy="310" r="3" fill="#fff"/>
  <circle cx="270" cy="313" r="5" fill="#ffc93c"/>
  <circle cx="275" cy="307" r="3.5" fill="#ffc93c"/>
  <path d="M278 306l4 1.5-4 1.5z" fill="#ff8515"/>`;

const bathtub = () => `
  <path d="M280 316V280H268" stroke="#8b9da2" stroke-width="3" fill="none"/>
  <path d="M262 280h12l-2 5h-8Z" fill="#8b9da2"/>
  <path d="M265 290l-2 6M269 290v6M273 290l2 6" stroke="#9fd9ea" stroke-width="2" stroke-linecap="round"/>
  <path d="M216 316H286L282 340Q251 350 220 340Z" fill="#f7fbfa" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M224 342l-4 8M278 342l4 8" stroke="#d99a00" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="251" cy="316" rx="35" ry="6" fill="#9fd9ea" stroke="${INK}" stroke-width="2"/>
  <circle cx="233" cy="311" r="4.5" fill="#fff"/><circle cx="243" cy="308" r="3" fill="#fff"/><circle cx="257" cy="310" r="3.5" fill="#fff"/>
  <circle cx="267" cy="311" r="5" fill="#ffc93c"/><circle cx="272" cy="305" r="3.5" fill="#ffc93c"/><path d="M275 304l4 1.5-4 1.5z" fill="#ff8515"/>`;

const pantry = () => `
  <rect x="290" y="228" width="40" height="120" rx="4" fill="#b07a4a"/>
  <rect x="294" y="232" width="32" height="112" rx="2" fill="#7a4f2e"/>
  <rect x="294" y="262" width="32" height="4" fill="#d39a62"/>
  <rect x="294" y="298" width="32" height="4" fill="#d39a62"/>
  <ellipse cx="310" cy="255" rx="12" ry="7" fill="#e0a458" stroke="#8b5e3c" stroke-width="1.5"/>
  <path d="M304 251l2 6M310 250l1 7M316 251l-1 6" stroke="#b07a4a" stroke-width="1.5" stroke-linecap="round"/>
  <rect x="297" y="276" width="11" height="22" rx="3" fill="#7cc576"/>
  <rect x="297" y="273" width="11" height="4" rx="1" fill="#8b5e3c"/>
  <rect x="312" y="281" width="11" height="17" rx="3" fill="#e7464e"/>
  <rect x="312" y="278" width="11" height="4" rx="1" fill="#8b5e3c"/>
  <circle cx="309" cy="327" r="6" fill="#7cc576"/>
  <circle cx="302" cy="337" r="6" fill="#e7464e"/>
  <circle cx="317" cy="337" r="6" fill="#ff8515"/>`;

const fridge = () => `
  <path d="M296 224q14-8 28 0Z" fill="#c98f5a"/>
  <circle cx="302" cy="220" r="5" fill="#ff8515"/><circle cx="311" cy="217" r="5" fill="#e7464e"/><circle cx="319" cy="220" r="5" fill="#7cc576"/>
  <rect x="288" y="226" width="44" height="122" rx="6" fill="#f7fbfa" stroke="${INK}" stroke-width="2"/>
  <path d="M288 270H332" stroke="${INK}" stroke-width="2"/>
  <path d="M324 238v20M324 282v30" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="300" cy="244" r="4" fill="#e7464e"/><rect x="296" y="286" width="12" height="9" rx="1.5" fill="#ffc93c"/>`;

export function homeScene({ level = 1, rooms = [], outfit = null } = {}) {
  const home = HOMES[Math.min(Math.max(level, 1), HOMES.length) - 1];
  const has = (room) => rooms.includes(room);
  return `
<svg class="home-svg" viewBox="0 0 360 380" role="group" aria-label="${t('home.scene')}">
  ${home.back}
  ${walls(home)}
  ${home.decor}
  ${home.light}

  ${obj('garden', t('obj.sign'), [28, 36, 70, 40], `
    <rect x="56" y="48" width="4" height="26" fill="#8b5e3c"/>
    <path d="M34 44H78L86 52L78 60H34Z" fill="#f3dcb8" stroke="#8b5e3c" stroke-width="2"/>
    <text class="sign-text" x="57" y="55.5" text-anchor="middle">GARDEN</text>`)}

  ${obj('play', t('obj.radio'), [36, 182, 84, 64], has('musicRoom') ? stereo() : radio())}
  ${obj('bed', t('obj.bed'), [28, 250, 108, 100], has('bedroom') ? bigBed() : bed())}
  ${obj('wash', t('obj.tub'), [218, 280, 76, 72], has('bathroom') ? bathtub() : tub())}
  ${obj('eat', t('obj.pantry'), [284, 210, 52, 140], has('kitchen') ? fridge() : pantry())}
  ${obj('talk', t('obj.nemla'), [134, 188, 92, 162], standing({ x: 180, feet: 348, width: 84, outfit }))}

  ${NEEDS.map((need) => `
  <g class="badge" data-need="${need}" transform="translate(${BADGES[need][0]} ${BADGES[need][1]})">
    <g class="badge-in"><circle r="10" fill="#e7464e" stroke="#fff" stroke-width="2"/><text class="badge-text" y="4.5" text-anchor="middle">!</text></g>
  </g>`).join('')}

  <g class="thought">
    <circle cx="226" cy="212" r="4" fill="#fff" stroke="#d6e3e1" stroke-width="1.5"/>
    <circle cx="236" cy="198" r="6" fill="#fff" stroke="#d6e3e1" stroke-width="1.5"/>
    <circle cx="258" cy="174" r="24" fill="#fff" stroke="#d6e3e1" stroke-width="2"/>
    ${NEEDS.map((need) => `<g data-need="${need}">${iconGroup(need, 244, 160, 28, '#c8343c')}</g>`).join('')}
  </g>

  <path class="sleep-shade" d="${home.room}" fill="#14213d"/>
  <g class="zzz">
    <text x="96" y="262">z</text><text x="108" y="248">z</text><text x="121" y="232">Z</text>
  </g>
  <g class="fx"></g>
</svg>`;
}

// The scene's parts, for tools that draw the home in layers (the Godot
// game's art is exported from here, so both games share one drawing).
export const PARTS = { HOMES, walls, sunAndMoon, radio, stereo, bed, bigBed, tub, bathtub, pantry, fridge, BADGES };
