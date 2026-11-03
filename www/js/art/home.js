// Home level 1, the little hole: the garden surface on top, one room below.
// The scene is one SVG (360×380) that scales with the screen. Things the
// player can tap are groups with class "obj" and a data-act naming what
// tapping does; their "hit" rect is the tap area and shows keyboard focus.
// What shows depends on classes on the <svg>: "night", "asleep".
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

const obj = (act, label, hit, body) => `
  <g class="obj" data-act="${act}" role="button" tabindex="0" aria-label="${label}">
    <rect class="hit" x="${hit[0]}" y="${hit[1]}" width="${hit[2]}" height="${hit[3]}" rx="10"/>
    ${body}
  </g>`;

export function homeScene() {
  return `
<svg class="home-svg" viewBox="0 0 360 380" role="group" aria-label="${t('home.scene')}">
  <rect class="sky" width="360" height="74"/>
  <g class="day-only">
    <circle cx="322" cy="30" r="14" fill="#ffd76a"/>
    <ellipse cx="150" cy="28" rx="24" ry="9" fill="#fff"/>
    <ellipse cx="168" cy="23" rx="14" ry="10" fill="#fff"/>
  </g>
  <g class="night-only">
    ${STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}
    <circle cx="322" cy="30" r="12" fill="#f4f1d0"/>
    <circle class="sky" cx="329" cy="25" r="11"/>
  </g>
  <rect y="64" width="360" height="12" fill="#7cc576"/>
  <rect y="74" width="360" height="306" fill="#a8714a"/>
  <g fill="#94603c">
    <circle cx="28" cy="96" r="4"/><circle cx="334" cy="92" r="3"/><circle cx="8" cy="250" r="5"/>
    <circle cx="352" cy="200" r="4"/><circle cx="350" cy="370" r="3"/><circle cx="10" cy="372" r="4"/>
  </g>
  <path d="M120 64l3-8 3 8M136 64l2-6 3 6M300 64l3-9 3 9M330 64l2-6 3 6" stroke="#4f9e4c" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M200 76Q240 44 280 76Z" fill="#c98f5a"/>
  <ellipse cx="240" cy="70" rx="12" ry="7" fill="#5b3a22"/>
  <rect x="230" y="72" width="20" height="48" fill="#e6c49a"/>
  <rect x="16" y="110" width="328" height="250" rx="44" fill="#f3dcb8"/>
  <ellipse cx="180" cy="350" rx="118" ry="7" fill="#9fdcd6" opacity="0.7"/>
  <line x1="150" y1="110" x2="150" y2="124" stroke="#8b5e3c" stroke-width="2"/>
  <circle class="lamp-glow" cx="150" cy="131" r="16" fill="#fff3a6" opacity="0.45"/>
  <circle cx="150" cy="131" r="6" fill="#fff3a6" stroke="#e5c34a" stroke-width="2"/>

  ${obj('garden', t('obj.sign'), [28, 36, 70, 40], `
    <rect x="56" y="48" width="4" height="26" fill="#8b5e3c"/>
    <path d="M34 44H78L86 52L78 60H34Z" fill="#f3dcb8" stroke="#8b5e3c" stroke-width="2"/>
    <text class="sign-text" x="57" y="55.5" text-anchor="middle">GARDEN</text>`)}

  ${obj('play', t('obj.radio'), [38, 182, 80, 64], `
    <rect x="40" y="236" width="76" height="6" rx="2" fill="#8b5e3c"/>
    <path d="M98 206L110 188" stroke="#2f3f47" stroke-width="2" stroke-linecap="round"/>
    <circle cx="110" cy="188" r="2.5" fill="#2f3f47"/>
    <rect x="52" y="206" width="52" height="30" rx="6" fill="#ff8515" stroke="#2f3f47" stroke-width="2"/>
    <circle cx="68" cy="221" r="8" fill="#ffd9b0" stroke="#2f3f47" stroke-width="1.5"/>
    <rect x="82" y="214" width="14" height="4" rx="2" fill="#2f3f47"/>
    <circle cx="89" cy="227" r="3" fill="#2f3f47"/>`)}

  ${obj('bed', t('obj.bed'), [28, 250, 108, 100], `
    <rect x="34" y="286" width="9" height="62" rx="4" fill="#8b5e3c"/>
    <rect x="44" y="340" width="6" height="8" fill="#8b5e3c"/>
    <rect x="118" y="340" width="6" height="8" fill="#8b5e3c"/>
    <rect x="38" y="318" width="92" height="24" rx="8" fill="#b07a4a"/>
    <rect x="46" y="294" width="28" height="14" rx="6" fill="#fff" stroke="#e0c9a6" stroke-width="1.5"/>
    ${inBed({ x: 39, y: 255, width: 46 })}
    <rect x="42" y="306" width="86" height="20" rx="8" fill="#e7464e"/>
    <path d="M44 313H126" stroke="#c8343c" stroke-width="2"/>`)}

  ${obj('wash', t('obj.tub'), [218, 290, 76, 62], `
    <path d="M222 318H290L284 346Q256 352 228 346Z" fill="#c98f5a" stroke="#8b5e3c" stroke-width="2" stroke-linejoin="round"/>
    <path d="M225 331H287" stroke="#8b5e3c" stroke-width="2"/>
    <ellipse cx="256" cy="318" rx="34" ry="6" fill="#9fd9ea" stroke="#8b5e3c" stroke-width="2"/>
    <circle cx="240" cy="313" r="4" fill="#fff"/>
    <circle cx="249" cy="310" r="3" fill="#fff"/>
    <circle cx="270" cy="313" r="5" fill="#ffc93c"/>
    <circle cx="275" cy="307" r="3.5" fill="#ffc93c"/>
    <path d="M278 306l4 1.5-4 1.5z" fill="#ff8515"/>`)}

  ${obj('eat', t('obj.pantry'), [284, 216, 50, 134], `
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
    <circle cx="317" cy="337" r="6" fill="#ff8515"/>`)}

  ${obj('talk', t('obj.nemla'), [134, 188, 92, 162], standing({ x: 180, feet: 348, width: 84 }))}

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

  <rect class="sleep-shade" x="16" y="110" width="328" height="250" rx="44" fill="#14213d"/>
  <g class="zzz">
    <text x="96" y="262">z</text><text x="108" y="248">z</text><text x="121" y="232">Z</text>
  </g>
  <g class="fx"></g>
</svg>`;
}
