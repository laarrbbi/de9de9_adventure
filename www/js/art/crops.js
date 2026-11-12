// Crops, drawn in code like the rest of the game. A plot is a patch of soil
// (100×64) with three plants on it. A plant's `stage` goes from 0 (seeds
// just planted) to 3 (ready to harvest); each plant is drawn from its base.
const leaf = (cx, cy, rx, ry, deg, fill = '#5cbf63', stroke = '#3a8f46') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${deg} ${cx} ${cy})" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;

const stem = (x, y, height, color = '#3a8f46', width = 2) =>
  `<path d="M${x} ${y}V${y - height}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;

const seeds = (x, y) => `
  <ellipse cx="${x}" cy="${y}" rx="7" ry="3" fill="#6e4528"/>
  <circle cx="${x - 2}" cy="${y - 1}" r="1.4" fill="#e6c49a"/><circle cx="${x + 2.5}" cy="${y - 0.5}" r="1.2" fill="#e6c49a"/>`;

const sprout = (x, y) => `${stem(x, y, 6)}${leaf(x - 3.5, y - 6, 4, 2.2, -30)}${leaf(x + 3.5, y - 6, 4, 2.2, 30)}`;

function mint(x, y, stage) {
  if (stage === 1) return sprout(x, y);
  const pairs = stage === 2 ? [[5, 6], [12, 5]] : [[6, 7.5], [13, 7], [20, 6], [26, 4.5]];
  const top = pairs[pairs.length - 1][0];
  return stem(x, y, top + 2) + pairs.map(([up, size], i) =>
    i === pairs.length - 1 && stage === 3
      ? leaf(x, y - up - 2, size * 0.55, size * 0.9, 0)
      : leaf(x - size * 0.8, y - up, size, size * 0.5, -25) + leaf(x + size * 0.8, y - up, size, size * 0.5, 25),
  ).join('');
}

function wheat(x, y, stage) {
  if (stage === 1) {
    return `<path d="M${x} ${y}q-2-5-5-8M${x} ${y}q0-6 0-10M${x} ${y}q2-5 5-8" stroke="#4f9e4c" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  const ripe = stage === 3;
  const height = ripe ? 30 : 20;
  const stalk = ripe ? '#c99a2e' : '#4f9e4c';
  const grain = ripe ? '#f0c24b' : '#8fd17f';
  return [-5, 0, 5].map((dx) => {
    const tip = { x: x + dx * 1.2, y: y - height - (dx ? 0 : 3) };
    const ears = ripe ? [0, 4, 8] : [0, 4];
    return `<path d="M${x + dx * 0.3} ${y}L${tip.x} ${tip.y}" stroke="${stalk}" stroke-width="1.8" stroke-linecap="round"/>` +
      ears.map((down) =>
        leaf(tip.x - 2, tip.y + down, 1.8, 3.3, -25, grain, stalk) + leaf(tip.x + 2, tip.y + down, 1.8, 3.3, 25, grain, stalk),
      ).join('') + leaf(tip.x, tip.y - 2, 1.6, 3, 0, grain, stalk);
  }).join('');
}

function tomato(x, y, stage) {
  if (stage === 1) return sprout(x, y);
  const bush = `
    <path d="M${x + 7} ${y}V${y - 27}" stroke="#a8714a" stroke-width="2" stroke-linecap="round"/>
    ${stem(x, y, 20)}
    <circle cx="${x - 5}" cy="${y - 10}" r="6" fill="#4f9e4c"/><circle cx="${x + 5}" cy="${y - 12}" r="6.5" fill="#5cbf63"/>
    <circle cx="${x}" cy="${y - 19}" r="6.5" fill="#4f9e4c"/>`;
  if (stage === 2) {
    return bush + `<circle cx="${x - 3}" cy="${y - 13}" r="1.8" fill="#ffd76a"/><circle cx="${x + 4}" cy="${y - 19}" r="1.8" fill="#ffd76a"/>`;
  }
  return bush + [[-5, -8], [5, -10], [0, -18]].map(([dx, dy]) => `
    <circle cx="${x + dx}" cy="${y + dy}" r="4.6" fill="#e7464e" stroke="#b42f38" stroke-width="1"/>
    <circle cx="${x + dx - 1.4}" cy="${y + dy - 1.5}" r="1.2" fill="#fff" opacity="0.7"/>
    <path d="M${x + dx - 2} ${y + dy - 4.2}h4M${x + dx} ${y + dy - 5.5}v2.5" stroke="#3a8f46" stroke-width="1.3" stroke-linecap="round"/>`).join('');
}

const PLANTS = { mint, wheat, tomato };

export function plantArt(crop, stage, x, y) {
  return stage === 0 ? seeds(x, y) : PLANTS[crop](x, y, stage);
}

// The stage to draw for a crop that is `share` of the way grown.
export const stageFor = (share, ready) => (ready ? 3 : share < 0.25 ? 0 : share < 0.6 ? 1 : 2);

const SPARKLE = 'M0-5L1.2-1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2-1.2Z';

// A whole plot: soil with three plants, or bare soil.
export function plotArt(crop, stage) {
  const plants = crop ? [22, 50, 78].map((x, i) => plantArt(crop, stage, x, 42 + (i === 1 ? 2 : 0))).join('') : '';
  const sparkles = stage === 3 ? `
    <g class="sparkle" fill="#fff6c8" stroke="#f0a500" stroke-width="0.8">
      <path transform="translate(10 12)" d="${SPARKLE}"/><path transform="translate(90 18)" d="${SPARKLE}"/><path transform="translate(64 6) scale(0.7)" d="${SPARKLE}"/>
    </g>` : '';
  return `
  <svg class="plot-art" viewBox="0 0 100 64" aria-hidden="true">
    <rect x="3" y="30" width="94" height="32" rx="12" fill="#7a4f2e"/>
    <rect x="3" y="27" width="94" height="29" rx="12" fill="#a8714a"/>
    <path d="M14 37H86M14 46H86" stroke="#94603c" stroke-width="3" stroke-linecap="round"/>
    ${plants}${sparkles}
  </svg>`;
}

// A ripe plant on its own, for the seed list and the market.
export const cropIcon = (crop, size = 32) =>
  `<svg class="crop-icon" width="${size}" height="${size}" viewBox="-4 -9 40 40" aria-hidden="true">${plantArt(crop, 3, 16, 29)}</svg>`;
