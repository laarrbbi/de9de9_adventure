// From De9De9 Play, played here as a job.
// Nemla Fix: leaks spring up on the pipes. Tap each one before it floods the
// house, but keep your fingers off the sparks. Three mistakes and it's over.
import { defineGame, H, RED, ORANGE, SLATE, INK, GOLD } from './engine.js';
import { drawLogo } from './logo.js';

const COLS = 3;
const ROWS = 4;
const TOP = 200;
const BOTTOM = H - 100;
const MARGIN = 48;
const REACH = 40; // how close a tap must be to a joint
const WATER = '#4aa8e0';

const spot = (g, i) => ({
  x: MARGIN + ((i % COLS) * (g.W - 2 * MARGIN)) / (COLS - 1),
  y: TOP + (Math.floor(i / COLS) * (BOTTOM - TOP)) / (ROWS - 1),
});

function spring(g) {
  const s = g.s;
  const free = [...Array(COLS * ROWS).keys()].filter((i) => !s.active.some((a) => a.i === i));
  if (!free.length) return;
  const spark = Math.random() < Math.min(0.25, 0.08 + s.t / 200);
  const life = Math.max(0.75, 1.7 - s.t * 0.02);
  s.active.push({ i: free[Math.floor(Math.random() * free.length)], spark, life, max: life });
}

function mistake(g) {
  g.s.lives--;
  g.beep(200, 0.15, 'square', 0.08);
  if (g.s.lives <= 0) g.gameOver();
}

function drop(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.45);
  ctx.bezierCurveTo(x + r * 1.25, y - r * 0.1, x + r, y + r, x, y + r);
  ctx.bezierCurveTo(x - r, y + r, x - r * 1.25, y - r * 0.1, x, y - r * 1.45);
  ctx.fill();
  ctx.stroke();
}

function bolt(ctx, x, y, k) {
  const pts = [[4, -16], [-9, 2], [-1, 2], [-4, 16], [9, -3], [1, -3]];
  ctx.beginPath();
  pts.forEach(([px, py], n) => (n ? ctx.lineTo(x + px * k, y + py * k) : ctx.moveTo(x + px * k, y + py * k)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export default defineGame({
  id: 'fix',
  title: 'Nemla Fix',
  hint: 'Tap the leaks, not the sparks',

  init(g) {
    g.s = { active: [], puffs: [], wait: 0.4, t: 0, lives: 3 };
  },

  onDown(g, x, y) {
    const s = g.s;
    const hit = s.active.find((a) => Math.hypot(spot(g, a.i).x - x, spot(g, a.i).y - y) < REACH);
    if (!hit) return;
    s.active.splice(s.active.indexOf(hit), 1);
    if (hit.spark) return mistake(g);
    s.puffs.push({ ...spot(g, hit.i), life: 0.25 });
    g.addScore();
    g.beep(640 + Math.random() * 200, 0.05, 'sine', 0.1);
  },

  update(g, dt) {
    const s = g.s;
    s.t += dt;
    s.wait -= dt;
    if (s.wait <= 0) {
      spring(g);
      s.wait = Math.max(0.38, 1 - s.t * 0.012);
    }
    for (const p of s.puffs) p.life -= dt;
    s.puffs = s.puffs.filter((p) => p.life > 0);
    for (const a of s.active) a.life -= dt;
    const gone = s.active.filter((a) => a.life <= 0);
    s.active = s.active.filter((a) => a.life > 0);
    // a spark just fizzles out; a leak left alone is a mistake
    for (const a of gone) {
      if (!a.spark && g.state === 'playing') mistake(g);
    }
  },

  draw(g) {
    const { ctx, W, s } = g;
    g.sky();
    drawLogo(ctx, W / 2, (TOP + BOTTOM) / 2, W * 0.6, '#fff', 0.4);

    // the pipe grid: dark outline first, then the pipe colour on top
    ctx.lineCap = 'round';
    for (const [width, color] of [[18, INK], [12, '#8ea1ab']]) {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let r = 0; r < ROWS; r++) {
        ctx.moveTo(spot(g, r * COLS).x, spot(g, r * COLS).y);
        ctx.lineTo(spot(g, r * COLS + COLS - 1).x, spot(g, r * COLS).y);
      }
      for (let c = 0; c < COLS; c++) {
        ctx.moveTo(spot(g, c).x, spot(g, c).y);
        ctx.lineTo(spot(g, c).x, spot(g, (ROWS - 1) * COLS + c).y);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    for (let i = 0; i < COLS * ROWS; i++) {
      const { x, y } = spot(g, i);
      ctx.fillStyle = SLATE;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const a of s.active) {
      const { x, y } = spot(g, a.i);
      const pulse = 1 + Math.sin(g.time * 14) * 0.06;
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      if (a.spark) {
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(x, y, 24 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = GOLD;
        bolt(ctx, x, y, 1.05);
      } else {
        ctx.fillStyle = WATER;
        drop(ctx, x, y + 3, 19 * pulse);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(x - 7, y + 6, 4, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // ring that runs down as the leak (or spark) is about to go
      ctx.lineWidth = 4;
      ctx.strokeStyle = a.spark ? RED : '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 33, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * a.life) / a.max);
      ctx.stroke();
    }

    for (const p of s.puffs) {
      ctx.globalAlpha = p.life / 0.25;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20 + (1 - p.life / 0.25) * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < 3; i++) g.heart(W - 26 - i * 28, 96, 22, i < s.lives);
  },
});
