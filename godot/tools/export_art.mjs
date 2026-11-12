// Exports the game's drawings from the web version's art code (www/js/art)
// as SVG files for Godot, so both versions share one set of drawings.
// Writes godot/assets/art/**.svg and godot/scripts/art_layout.gd (where each
// piece goes in the home scene). Run it again after changing a drawing:
//
//   node godot/tools/export_art.mjs
//
// Godot rasterizes an SVG at its width/height, so each file is written at
// SCALE times its design size to stay sharp on phone screens.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, SPOTS } from '../../www/js/art/home.js';
import { NEMLA_PARTS } from '../../www/js/art/nemla.js';
import { plotArt, cropIcon } from '../../www/js/art/crops.js';
import { itemArt } from '../../www/js/art/items.js';
import { PATHS, coin } from '../../www/js/art/icons.js';
import { CROPS, HOMES, ROOMS, CARS, EQUIPMENT, CLOTHES } from '../../www/js/economy.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'art');
const SCALE = 3;
const SKY = { day: '#c9eef2', night: '#22335c' };

rmSync(OUT, { recursive: true, force: true });
const files = [];
function svg(path, [x, y, w, h], body, scale = SCALE) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" viewBox="${x} ${y} ${w} ${h}">${body}</svg>\n`;
  writeFileSync(file, markup);
  files.push(path);
}

// Strips the inner <svg> wrapper the web art functions return.
const inner = (markup) => markup.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Pulls out <image> elements (Godot draws those pictures itself) and
// returns the markup without them plus where each one was.
function takeImages(markup) {
  const images = [];
  const rest = markup.replace(/<image href="([^"]+)" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"\/>/g,
    (_, href, x, y, w, h) => {
      images.push({ href, x: +x, y: +y, w: +w, h: +h });
      return '';
    });
  return { rest, images };
}

const forTime = (markup, time) => markup
  .replace(new RegExp(`<g class="${time === 'day' ? 'night' : 'day'}-only">[\\s\\S]*?</g>`, 'g'), '')
  .replace(/class="sky"/g, `fill="${SKY[time]}"`);

// The palace's zellige pattern, drawn as tiles (Godot's SVG reader has no
// <pattern>).
function zelligeTiles() {
  let out = '';
  for (let x = 16; x < 344; x += 20) {
    for (let y = 300; y < 360; y += 20) {
      out += `<rect x="${x}" y="${y}" width="20" height="20" fill="#fbf3e2"/><rect x="${x + 4}" y="${y + 4}" width="12" height="12" fill="#16736c"/>` +
        `<rect x="${x + 4}" y="${y + 4}" width="12" height="12" fill="#65cbc4" transform="rotate(45 ${x + 10} ${y + 10})"/><circle cx="${x + 10}" cy="${y + 10}" r="2.5" fill="#ffc93c"/>`;
    }
  }
  return out;
}

// Homes: a background per home and time of day, and the room's outline for
// the sleep shade.
const SCENE = [0, 0, 360, 380];
const logos = [];
PARTS.HOMES.forEach((home, i) => {
  const level = i + 1;
  let walls = PARTS.walls(home).replace('<rect x="16" y="300" width="328" height="60" fill="url(#zellige)"/>', zelligeTiles());
  const { rest, images } = takeImages(`${home.back}${walls}${home.decor}${home.light}`);
  logos.push(images.filter((img) => img.href.includes('logo-mark')));
  const body = rest.replace(/<defs>[\s\S]*?<\/defs>/, '');
  for (const time of ['day', 'night']) svg(`home/back_${level}_${time}.svg`, SCENE, forTime(body, time));
  svg(`home/shade_${level}.svg`, SCENE, `<path d="${home.room}" fill="#14213d"/>`);
});

// Furniture, each cropped to its own box (with a margin) so it is light to
// load. A bed is split around Nemla's head, which goes between its two parts.
const PAD = 6;
const BOXES = {
  sign: [28, 36, 70, 40],
  play: [36, 182, 84, 64],
  bed: [28, 250, 108, 100],
  wash: [218, 280, 76, 72],
  eat: [284, 210, 52, 140],
};
const padded = ([x, y, w, h]) => [x - PAD, y - PAD, w + 2 * PAD, h + 2 * PAD];
const piece = (name, box, markup) => svg(`home/${name}.svg`, padded(box), markup);
const splitBed = (markup) => {
  const at = markup.indexOf('<g class="nemla-in-bed">');
  const end = markup.indexOf('</g>', markup.indexOf('</g>', at) + 4) + 4;
  return [markup.slice(0, at), markup.slice(end)];
};
piece('sign', BOXES.sign, `
  <rect x="56" y="48" width="4" height="26" fill="#8b5e3c"/>
  <path d="M34 44H78L86 52L78 60H34Z" fill="#f3dcb8" stroke="#8b5e3c" stroke-width="2"/>`);
piece('radio', BOXES.play, PARTS.radio());
piece('stereo', BOXES.play, PARTS.stereo());
const [bedBack, bedFront] = splitBed(PARTS.bed());
const [bigBack, bigFront] = splitBed(PARTS.bigBed());
piece('bed_back', BOXES.bed, bedBack);
piece('bed_front', BOXES.bed, bedFront);
piece('bigbed_back', BOXES.bed, bigBack);
piece('bigbed_front', BOXES.bed, bigFront);
piece('tub', BOXES.wash, PARTS.tub());
piece('bathtub', BOXES.wash, PARTS.bathtub());
piece('pantry', BOXES.eat, PARTS.pantry());
piece('fridge', BOXES.eat, PARTS.fridge());

// The "!" badge and the thought bubble with each need's icon.
svg('home/badge.svg', [-12, -12, 24, 24], '<circle r="10" fill="#e7464e" stroke="#fff" stroke-width="2"/><path d="M0-5.5V1.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cy="5" r="1.7" fill="#fff"/>');
const THOUGHT = [216, 146, 70, 74];
const STROKE = 'fill="none" stroke="#c8343c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
for (const need of ['hunger', 'energy', 'clean', 'fun']) {
  svg(`home/thought_${need}.svg`, THOUGHT, `
    <circle cx="226" cy="212" r="4" fill="#fff" stroke="#d6e3e1" stroke-width="1.5"/>
    <circle cx="236" cy="198" r="6" fill="#fff" stroke="#d6e3e1" stroke-width="1.5"/>
    <circle cx="258" cy="174" r="24" fill="#fff" stroke="#d6e3e1" stroke-width="2"/>
    <g transform="translate(244 160) scale(${28 / 24})" ${STROKE}>${PATHS[need]}</g>`);
}

// Nemla: the body (46×38 grid), the eyelids (on the head image, 350 wide),
// and what can be worn on the head (head image grid, 300×343).
const { BODY, EYELIDS, ON_HEAD, ON_BODY, HEAD_RATIO } = NEMLA_PARTS;
svg('nemla/body.svg', [0, 0, 46, 38], BODY, 6);
svg('nemla/body_overalls.svg', [0, 0, 46, 38], BODY + ON_BODY.overalls, 6);
svg('nemla/eyelids.svg', [0, 0, 350, 350 * HEAD_RATIO], EYELIDS, 0.8);
for (const [outfit, markup] of Object.entries(ON_HEAD)) svg(`nemla/${outfit}.svg`, [0, 0, 300, 343], markup, 1);

// Garden: bare soil, each crop at each stage, and each crop's icon.
svg('crops/plot_empty.svg', [0, 0, 100, 64], inner(plotArt(null, 0)));
for (const crop of CROPS) {
  for (let stage = 0; stage < 4; stage++) svg(`crops/${crop.id}_${stage}.svg`, [0, 0, 100, 64], inner(plotArt(crop.id, stage)));
  svg(`crops/icon_${crop.id}.svg`, [-4, -9, 40, 40], inner(cropIcon(crop.id)), 4);
}

// Shop items, line icons (white, tinted in Godot) and the coin.
for (const item of [...HOMES, ...ROOMS, ...CARS, ...EQUIPMENT, ...CLOTHES]) svg(`items/${item.id}.svg`, [0, 0, 64, 64], inner(itemArt(item.id)));
for (const [name, path] of Object.entries(PATHS)) {
  svg(`icons/${name}.svg`, [0, 0, 24, 24], `<g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</g>`, 4);
}
svg('icons/coin.svg', [0, 0, 22, 22], inner(coin()), 4);
svg('fx/note.svg', [0, 0, 16, 20], '<path d="M5 15V3l9-2v12" fill="none" stroke="#2f3f47" stroke-width="2"/><ellipse cx="3.5" cy="15.5" rx="3.5" ry="2.8" fill="#2f3f47"/><ellipse cx="12.5" cy="13.5" rx="3.5" ry="2.8" fill="#2f3f47"/>', 4);
svg('fx/bubble.svg', [0, 0, 20, 20], '<circle cx="10" cy="10" r="8.5" fill="#fff" fill-opacity="0.85" stroke="#9fd9ea" stroke-width="1.5"/>', 4);
svg('fx/bite.svg', [0, 0, 24, 16], '<ellipse cx="12" cy="8" rx="11" ry="7" fill="#e0a458" stroke="#8b5e3c" stroke-width="1.5"/>', 4);

// Where things go in the home scene, for scripts/art_layout.gd.
const gd = (value) => JSON.stringify(value).replace(/"(\w+)":/g, '"$1": ');
const layout = `# Generated by tools/export_art.mjs from the web version's art: where each
# piece of the home scene goes, in scene units (the scene is 360×380).
# Do not edit by hand; change the drawing and run the tool again.
class_name ArtLayout

const SCENE := Vector2(360, 380)
const PAD := ${PAD}
# Tap areas: x, y, width, height. Each piece's picture is its box grown by PAD.
const BOXES := ${gd(BOXES)}
# Where effects appear.
const SPOTS := ${gd(SPOTS)}
# The "!" badge on the object that fills each need.
const BADGES := ${gd(PARTS.BADGES)}
const THOUGHT := ${gd(THOUGHT)}
# The framed De9De9 logo on the wall, per home (none in the little hole).
const LOGOS := ${gd(logos.map((list) => list.map(({ x, y, w, h }) => ({ x, y, w, h }))))}
# Nemla standing: centred on x, feet on y, head this wide. In bed: the head.
const NEMLA := { "x": 180, "feet": 348, "width": 84 }
const IN_BED := { "x": 39, "y": 255, "width": 46 }
const HEAD_RATIO := ${HEAD_RATIO}
`;
writeFileSync(join(ROOT, 'scripts', 'art_layout.gd'), layout);
console.log(`Wrote ${files.length} drawings and scripts/art_layout.gd`);
