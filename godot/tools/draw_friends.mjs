// Draws the bug friends, the problems at home, hearts and the gift box as
// SVG files for the Godot game (godot/assets/art/bugs, problems, icons).
// These drawings are new in the Godot game, so they live here rather than in
// the web version. Run it again after changing a drawing:
//
//   node godot/tools/draw_friends.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'art');
const INK = '#2f3f47';
const line = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const SCALE = 3;

function svg(path, size, body, scale = SCALE) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `<svg xmlns="http://www.w3.org/2000/svg" width="${size * scale}" height="${size * scale}" viewBox="0 0 ${size} ${size}">${body}</svg>\n`);
}

// Two friendly eyes and a smile, centred on (x, y).
const face = (x, y, k = 1, gap = 7) => `
  <circle cx="${x - gap * k}" cy="${y}" r="${4.6 * k}" fill="#fff" ${line}/>
  <circle cx="${x + gap * k}" cy="${y}" r="${4.6 * k}" fill="#fff" ${line}/>
  <circle cx="${x - gap * k + 0.8 * k}" cy="${y + 0.6 * k}" r="${2.3 * k}" fill="${INK}"/>
  <circle cx="${x + gap * k + 0.8 * k}" cy="${y + 0.6 * k}" r="${2.3 * k}" fill="${INK}"/>
  <circle cx="${x - gap * k + 1.6 * k}" cy="${y - 0.4 * k}" r="${0.8 * k}" fill="#fff"/>
  <circle cx="${x + gap * k + 1.6 * k}" cy="${y - 0.4 * k}" r="${0.8 * k}" fill="#fff"/>
  <path d="M${x - 4 * k} ${y + 7 * k}Q${x} ${y + 10.5 * k} ${x + 4 * k} ${y + 7 * k}" fill="none" ${line}/>
  <circle cx="${x - 11 * k}" cy="${y + 6 * k}" r="${2 * k}" fill="#ff9aa2" opacity="0.8"/>
  <circle cx="${x + 11 * k}" cy="${y + 6 * k}" r="${2 * k}" fill="#ff9aa2" opacity="0.8"/>`;

const antennae = (x, y, spread = 8, height = 12, color = INK) => `
  <path d="M${x - 3} ${y}Q${x - spread} ${y - height * 0.6} ${x - spread - 2} ${y - height}M${x + 3} ${y}Q${x + spread} ${y - height * 0.6} ${x + spread + 2} ${y - height}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="${x - spread - 2}" cy="${y - height}" r="2.4" fill="${color}"/><circle cx="${x + spread + 2}" cy="${y - height}" r="2.4" fill="${color}"/>`;

const BUGS = {
  snail: `
    <path d="M6 54Q4 44 12 42L14 30Q14 22 20 22Q26 22 26 30V46H52Q60 46 60 54Z" fill="#cfe8b0" ${line}/>
    <circle cx="40" cy="34" r="17" fill="#f2a65a" ${line}/>
    <path d="M40 34m0-3a3 3 0 1 1-3 3a6 6 0 0 1 6-6a9 9 0 0 1 9 9a12 12 0 0 1-12 12" fill="none" stroke="#c9742c" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M16 23L12 12M22 22L24 11" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="11" r="4" fill="#fff" ${line}/><circle cx="24" cy="10" r="4" fill="#fff" ${line}/>
    <circle cx="12.6" cy="11.5" r="2" fill="${INK}"/><circle cx="24.6" cy="10.5" r="2" fill="${INK}"/>
    <path d="M15 34Q19 37 23 34" fill="none" ${line}/><circle cx="13" cy="31" r="1.6" fill="#ff9aa2"/>`,
  beetle: `
    <path d="M14 34l-8 -4M14 44l-9 2M14 52l-6 6M50 34l8-4M50 44l9 2M50 52l6 6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="32" cy="43" rx="19" ry="17" fill="#2b8a80" ${line}/>
    <path d="M32 27V60" stroke="${INK}" stroke-width="2"/>
    <path d="M21 34Q24 30 28 31" stroke="#9fe0d7" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="22" r="12" fill="#3d4f57" ${line}/>
    ${face(32, 22, 0.75, 6)}
    <path d="M19 15Q32 0 45 15Z" fill="#ffc93c" ${line}/><path d="M17 15H47" ${line}/><path d="M32 4V8" stroke="${INK}" stroke-width="2"/>`,
  ladybug: `
    ${antennae(32, 14, 7, 10)}
    <circle cx="32" cy="40" r="20" fill="#e7464e" ${line}/>
    <path d="M32 20V60" stroke="${INK}" stroke-width="2"/>
    <circle cx="22" cy="34" r="4" fill="${INK}"/><circle cx="42" cy="34" r="4" fill="${INK}"/>
    <circle cx="20" cy="47" r="3.5" fill="${INK}"/><circle cx="44" cy="47" r="3.5" fill="${INK}"/><circle cx="32" cy="54" r="2.5" fill="${INK}"/>
    <circle cx="32" cy="22" r="11" fill="${INK}"/>
    ${face(32, 21, 0.7, 5.5)}`,
  bee: `
    ${antennae(32, 16, 7, 11)}
    <ellipse cx="14" cy="30" rx="10" ry="7" fill="#e8f6fb" opacity="0.95" ${line} transform="rotate(-25 14 30)"/>
    <ellipse cx="50" cy="30" rx="10" ry="7" fill="#e8f6fb" opacity="0.95" ${line} transform="rotate(25 50 30)"/>
    <ellipse cx="32" cy="38" rx="18" ry="20" fill="#ffc93c" ${line}/>
    <path d="M15 44Q32 50 49 44M17 52Q32 58 47 52" stroke="${INK}" stroke-width="4.5" fill="none"/>
    <path d="M32 58l-2 5h4z" fill="${INK}"/>
    ${face(32, 31, 0.8, 6)}`,
  firefly: `
    <circle cx="32" cy="50" r="14" fill="#fff3a6" opacity="0.6"/>
    ${antennae(32, 14, 7, 11)}
    <ellipse cx="18" cy="34" rx="9" ry="14" fill="#cfe1f0" opacity="0.9" ${line} transform="rotate(-20 18 34)"/>
    <ellipse cx="46" cy="34" rx="9" ry="14" fill="#cfe1f0" opacity="0.9" ${line} transform="rotate(20 46 34)"/>
    <ellipse cx="32" cy="34" rx="12" ry="16" fill="#34446b" ${line}/>
    <circle cx="32" cy="49" r="9" fill="#ffe14d" ${line}/>
    <circle cx="29" cy="47" r="2.5" fill="#fff"/>
    ${face(32, 28, 0.7, 5)}`,
  butterfly: `
    ${antennae(32, 18, 6, 12)}
    <ellipse cx="17" cy="26" rx="13" ry="11" fill="#ff8fb1" ${line}/><ellipse cx="47" cy="26" rx="13" ry="11" fill="#ff8fb1" ${line}/>
    <ellipse cx="19" cy="46" rx="10" ry="9" fill="#b98cff" ${line}/><ellipse cx="45" cy="46" rx="10" ry="9" fill="#b98cff" ${line}/>
    <circle cx="15" cy="25" r="4" fill="#fff" opacity="0.8"/><circle cx="49" cy="25" r="4" fill="#fff" opacity="0.8"/>
    <ellipse cx="32" cy="40" rx="6" ry="17" fill="#5b3a6b" ${line}/>
    <circle cx="32" cy="24" r="9" fill="#5b3a6b" ${line}/>
    ${face(32, 24, 0.55, 4)}`,
  cricket: `
    ${antennae(30, 18, 12, 16)}
    <path d="M42 40L56 28L58 56" fill="none" stroke="#4f9e4c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 44L10 58M26 48L22 60" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="32" cy="42" rx="16" ry="14" fill="#7cc576" ${line}/>
    <circle cx="28" cy="28" r="12" fill="#7cc576" ${line}/>
    ${face(28, 27, 0.7, 5)}
    <path d="M22 41l6 3-6 3zM34 41l-6 3 6 3z" fill="#e7464e" ${line}/><circle cx="28" cy="44" r="2" fill="#e7464e" ${line}/>`,
  grasshopper: `
    ${antennae(32, 16, 10, 14)}
    <path d="M18 44L8 34L6 58M46 44L56 34L58 58" fill="none" stroke="#5cbf63" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="32" cy="44" rx="14" ry="15" fill="#a8e07a" ${line}/>
    <circle cx="32" cy="27" r="12" fill="#a8e07a" ${line}/>
    <path d="M20 22Q32 16 44 22" stroke="#e7464e" stroke-width="5" fill="none"/>
    ${face(32, 28, 0.7, 5)}`,
  mantis: `
    <path d="M24 14L18 4M40 14L46 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="32" cy="48" rx="9" ry="14" fill="#7cc576" ${line}/>
    <path d="M24 38Q14 34 18 26M40 38Q50 34 46 26" fill="none" stroke="#5cbf63" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 14L46 14L32 34Z" fill="#7cc576" ${line}/>
    <circle cx="25" cy="19" r="5" fill="#fff" ${line}/><circle cx="39" cy="19" r="5" fill="#fff" ${line}/>
    <circle cx="25.8" cy="19.6" r="2.4" fill="${INK}"/><circle cx="39.8" cy="19.6" r="2.4" fill="${INK}"/>
    <path d="M30 19H34" ${line}/><circle cx="25" cy="19" r="6.5" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="39" cy="19" r="6.5" fill="none" stroke="${INK}" stroke-width="1.6"/>
    <path d="M29 28Q32 30 35 28" fill="none" ${line}/>`,
};
for (const [id, body] of Object.entries(BUGS)) svg(`bugs/${id}.svg`, 64, body);

const PROBLEMS = {
  leak: `<rect x="6" y="14" width="52" height="12" rx="3" fill="#8ea1ab" ${line}/><rect x="26" y="10" width="12" height="20" rx="2" fill="#6f8590" ${line}/>
    <path d="M32 34C27 42 26 46 26 48a6 6 0 0 0 12 0c0-2-1-6-6-14z" fill="#4aa8e0" ${line}/><circle cx="20" cy="52" r="3" fill="#4aa8e0"/><circle cx="46" cy="50" r="2.5" fill="#4aa8e0"/>`,
  brokenRadio: `<rect x="8" y="20" width="48" height="30" rx="6" fill="#ff8515" ${line}/><circle cx="23" cy="35" r="8" fill="#ffd9b0" ${line}/>
    <path d="M40 10L48 20" ${line}/><path d="M34 24L40 32L35 38L42 46" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 56H52" stroke="#e7464e" stroke-width="3" stroke-dasharray="4 4"/>`,
  mess: `<path d="M8 50Q16 40 24 48L30 40L38 50" fill="#e6c49a" ${line}/><rect x="34" y="34" width="20" height="16" rx="2" fill="#fff" ${line} transform="rotate(12 44 42)"/>
    <path d="M14 22h10v16q0 6-6 6h-6q-4 0-4-4t4-4h2z" fill="#e7464e" ${line}/><circle cx="48" cy="18" r="5" fill="#c3cfcd"/><circle cx="54" cy="24" r="3" fill="#c3cfcd"/>`,
  flatTire: `<path d="M8 46Q8 18 32 18Q56 18 56 46Q56 54 32 54Q8 54 8 46Z" fill="${INK}"/><ellipse cx="32" cy="40" rx="11" ry="9" fill="#8ea1ab" ${line}/>
    <path d="M6 56H58" stroke="#7cc576" stroke-width="4" stroke-linecap="round"/><path d="M52 8v10M52 23v1" stroke="#e7464e" stroke-width="4" stroke-linecap="round"/>`,
  sick: `<rect x="27" y="6" width="10" height="38" rx="5" fill="#fff" ${line}/><rect x="30" y="20" width="4" height="24" fill="#e7464e"/>
    <circle cx="32" cy="48" r="9" fill="#e7464e" ${line}/><path d="M42 14h6M42 22h4M42 30h6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
};
for (const [id, body] of Object.entries(PROBLEMS)) svg(`problems/${id}.svg`, 64, body);

const HEART = 'M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-1.5A5 5 0 0 1 22 8c0 3.5-3 7-10 13z';
svg('icons/heart_full.svg', 24, `<path d="${HEART}" fill="#e7464e" stroke="#b42f38" stroke-width="1.4" stroke-linejoin="round"/>`, 4);
svg('icons/heart_empty.svg', 24, `<path d="${HEART}" fill="#e9efee" stroke="#c3cfcd" stroke-width="1.6" stroke-linejoin="round"/>`, 4);
svg('icons/gift.svg', 64, `<rect x="8" y="24" width="48" height="12" rx="3" fill="#e7464e" ${line}/><rect x="12" y="36" width="40" height="22" rx="3" fill="#e7464e" ${line}/>
  <path d="M32 24V58" stroke="#ffc93c" stroke-width="6"/><path d="M32 24Q20 8 14 16Q12 24 32 24Q52 24 50 16Q44 8 32 24Z" fill="#ffc93c" ${line}/>`);
svg('icons/phone.svg', 24, '<g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></g>', 4);
console.log('Drew the bugs, the problems, hearts and the gift box.');
