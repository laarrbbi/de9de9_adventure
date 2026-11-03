// From De9De9 Play, played here as a job.
// Nemla Tiles: tap every dark tile before it slides off. Touch a white one and it's over.
import { defineGame, H, TEAL, RED, INK } from './engine.js';
import { note } from '../audio.js';
import { drawLogo } from './logo.js';

const COLS = 4;
const TILE_H = 130;
const START_SPEED = 230;
const MAX_SPEED = 640;

// The tiles play a tune, one note per tile, looped. This one is original,
// written in a D Hijaz scale for a raï feel. Numbers are steps of the scale.
const SCALE = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
const TUNE = [
  1, 1, 3, 4, 5, 5, 4, 3, 4, 5, 6, 5, 4, 3, 2, 1,
  5, 5, 6, 7, 8, 8, 7, 6, 5, 6, 5, 4, 3, 2, 3, 1,
  1, 3, 4, 5, 6, 5, 4, 3, 2, 3, 4, 3, 2, 1, 2, 1,
  8, 7, 6, 5, 6, 5, 4, 3, 4, 3, 2, 1, 2, 3, 2, 1,
];

// n is the tile's place in the run, which picks its note.
const newRow = (y, n) => ({
  y,
  col: Math.floor(Math.random() * COLS),
  hit: false,
  note: SCALE[TUNE[n % TUNE.length] - 1],
});

export default defineGame({
  id: 'tiles',
  title: 'Nemla Tiles',
  hint: 'Tap the dark tile to start',

  init(g) {
    const s = (g.s = { rows: [], t: 0, miss: null });
    for (let y = H - 2 * TILE_H; y > -2 * TILE_H; y -= TILE_H) s.rows.push(newRow(y, s.rows.length));
    s.made = s.rows.length;
  },

  // A stray first tap on white would end the run instantly, so only the tile starts it.
  canStart(g, x, y) {
    const first = g.s.rows[0];
    return Math.floor(x / (g.W / COLS)) === first.col && y >= first.y && y < first.y + TILE_H;
  },

  onDown(g, x, y) {
    const s = g.s;
    const col = Math.min(COLS - 1, Math.floor(x / (g.W / COLS)));
    const row = s.rows.find((r) => y >= r.y && y < r.y + TILE_H);
    if (!row || (row.col === col && row.hit)) return;
    if (row.col !== col) {
      s.miss = { row, col };
      return g.gameOver();
    }
    row.hit = true;
    g.addScore();
    note(row.note);
  },

  update(g, dt) {
    const s = g.s;
    s.t += dt;
    const speed = Math.min(MAX_SPEED, START_SPEED + s.t * 9);
    for (const r of s.rows) r.y += speed * dt;
    const bottom = s.rows[0];
    if (bottom.y > H - 30 && !bottom.hit) {
      s.miss = { row: bottom, col: bottom.col };
      return g.gameOver();
    }
    if (bottom.y > H) s.rows.shift();
    const top = s.rows[s.rows.length - 1];
    if (top.y > -TILE_H) s.rows.push(newRow(top.y - TILE_H, s.made++));
  },

  draw(g) {
    const { ctx, W, s } = g;
    const cw = W / COLS;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    for (const r of s.rows) {
      ctx.fillStyle = r.hit ? 'rgba(101,203,196,0.45)' : INK;
      ctx.fillRect(r.col * cw, r.y, cw, TILE_H);
      if (!r.hit) drawLogo(ctx, r.col * cw + cw / 2, r.y + TILE_H / 2, cw * 0.66, TEAL, 0.9);
    }
    if (s.miss) {
      ctx.fillStyle = RED;
      ctx.fillRect(s.miss.col * cw, s.miss.row.y, cw, TILE_H);
    }
    ctx.fillStyle = TEAL;
    for (let c = 1; c < COLS; c++) ctx.fillRect(c * cw - 1, 0, 2, H);
    for (const r of s.rows) ctx.fillRect(0, r.y - 1, W, 2);
  },
});
