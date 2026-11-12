// From De9De9 Play, played here as a job.
// De9a Stack: tap to drop the sliding block. Whatever overhangs is cut off.
import { defineGame, H, INK } from './engine.js';

const BH = 28;
const BASE_Y = H - 120;
const PERFECT = 5;
const GRAVITY = 1600;

const color = (i) => `hsl(${(176 + i * 12) % 360} 58% 60%)`;

function spawn(g) {
  const s = g.s, top = s.blocks[s.blocks.length - 1];
  const fromLeft = s.blocks.length % 2 === 0;
  s.cur = { x: fromLeft ? -top.w : g.W, w: top.w, dir: fromLeft ? 1 : -1 };
}

function slide(g, dt) {
  const s = g.s, cur = s.cur;
  const speed = Math.min(430, 150 + s.blocks.length * 7);
  cur.x += cur.dir * speed * dt;
  if (cur.x < -cur.w * 0.6) cur.dir = 1;
  if (cur.x > g.W - cur.w * 0.4) cur.dir = -1;
}

// Camera follow and falling scraps; keeps running after a game over.
function settle(g, dt) {
  const s = g.s;
  s.cam += (Math.max(0, s.blocks.length * BH - 220) - s.cam) * Math.min(1, dt * 6);
  for (const p of s.scraps) {
    p.vy += GRAVITY * dt;
    p.y += p.vy * dt;
  }
  s.scraps = s.scraps.filter((p) => p.y + s.cam < H + 40);
}

export default defineGame({
  id: 'stack',
  title: 'De9a Stack',
  hint: 'Tap to drop',

  init(g) {
    g.s = { blocks: [{ x: g.W / 2 - 80, w: 160 }], scraps: [], cam: 0, cur: null };
    spawn(g);
  },

  onDown(g) {
    const s = g.s, cur = s.cur, top = s.blocks[s.blocks.length - 1];
    const y = BASE_Y - s.blocks.length * BH;
    const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w);
    if (right - left <= 0) {
      s.scraps.push({ x: cur.x, y, w: cur.w, vy: 0, i: s.blocks.length });
      s.cur = null;
      return g.gameOver();
    }
    if (Math.abs(cur.x - top.x) < PERFECT) {
      s.blocks.push({ x: top.x, w: top.w });
      g.beep(980, 0.08, 'sine', 0.1);
    } else {
      // the part hanging over the edge falls away
      const cutX = cur.x < top.x ? cur.x : right;
      s.scraps.push({ x: cutX, y, w: cur.w - (right - left), vy: 0, i: s.blocks.length });
      s.blocks.push({ x: left, w: right - left });
      g.beep(440, 0.06, 'square', 0.07);
    }
    g.addScore();
    spawn(g);
  },

  // The block already slides on the ready screen, so the first tap is a real drop.
  idle: slide,
  firstTapPlays: true,

  update(g, dt) {
    slide(g, dt);
    settle(g, dt);
  },

  after: settle,

  draw(g) {
    const { s } = g;
    g.sky();
    s.blocks.forEach((b, i) => g.box(b.x, BASE_Y - i * BH + s.cam, b.w, BH, 5, color(i), INK));
    for (const p of s.scraps) g.box(p.x, p.y + s.cam, p.w, BH, 5, color(p.i), INK);
    if (s.cur) g.box(s.cur.x, BASE_Y - s.blocks.length * BH + s.cam, s.cur.w, BH, 5, color(s.blocks.length), INK);
  },
});
