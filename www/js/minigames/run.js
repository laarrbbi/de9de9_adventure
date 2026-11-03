// From De9De9 Play, played here as a job.
// Nemla Run: three-lane endless runner. Swipe or tap a side to change lane.
import { defineGame, H, TEAL, RED, RED_DARK, SLATE } from './engine.js';
import { drawFace } from './face.js';

const PLAYER_Y = H - 150;
const R = 22;
const START_SPEED = 260;
const MAX_SPEED = 560;

const laneW = (g) => Math.min(96, (g.W - 24) / 3);
const laneX = (g, i) => g.W / 2 + (i - 1) * laneW(g);

function move(g, dir) {
  const s = g.s;
  const lane = Math.max(0, Math.min(2, s.lane + dir));
  if (lane !== s.lane) g.beep(600, 0.04, 'sine', 0.06);
  s.lane = lane;
}

export default defineGame({
  id: 'run',
  title: 'Nemla Run',
  hint: 'Swipe to change lane',

  init(g) {
    g.s = { lane: 1, x: laneX(g, 1), rows: [], speed: START_SPEED, scroll: 0, t: 0, safe: 1 };
  },

  onSwipe(g, dir) {
    if (dir === 'left') move(g, -1);
    if (dir === 'right') move(g, 1);
  },

  onTap(g, x) {
    move(g, x < g.W / 2 ? -1 : 1);
  },

  update(g, dt) {
    const s = g.s;
    s.t += dt;
    s.speed = Math.min(MAX_SPEED, START_SPEED + s.t * 5);
    s.scroll += s.speed * dt;
    s.x += (laneX(g, s.lane) - s.x) * Math.min(1, dt * 18);

    for (const row of s.rows) row.y += s.speed * dt;
    if (s.rows.length && s.rows[0].y > H + 60) s.rows.shift();

    // Always leave a free lane next to the previous free one, so every row is reachable.
    const lastRow = s.rows[s.rows.length - 1];
    if (!lastRow || lastRow.y > Math.max(240, s.speed * 0.55)) {
      s.safe = Math.max(0, Math.min(2, s.safe + Math.floor(Math.random() * 3) - 1));
      const blocked = [0, 1, 2].map((i) => i !== s.safe && Math.random() < 0.65);
      if (!blocked.includes(true)) blocked[(s.safe + 1) % 3] = true;
      s.rows.push({ y: -40, blocked, passed: false });
    }

    for (const row of s.rows) {
      if (!row.passed && row.y > PLAYER_Y + 44) {
        row.passed = true;
        g.addScore();
      }
      if (Math.abs(row.y - PLAYER_Y) > 34) continue;
      if (row.blocked.some((b, i) => b && Math.abs(laneX(g, i) - s.x) < 32)) return g.gameOver();
    }
  },

  draw(g) {
    const { ctx, W, s } = g;
    const lw = laneW(g), left = W / 2 - lw * 1.5;
    ctx.fillStyle = '#bfeae6';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = SLATE;
    ctx.fillRect(left, 0, lw * 3, H);
    ctx.fillStyle = TEAL;
    ctx.fillRect(left - 6, 0, 6, H);
    ctx.fillRect(left + lw * 3, 0, 6, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 1; i < 3; i++) {
      for (let y = (s.scroll % 56) - 56; y < H; y += 56) ctx.fillRect(left + lw * i - 2, y, 4, 28);
    }

    for (const row of s.rows) {
      row.blocked.forEach((b, i) => {
        if (!b) return;
        const x = laneX(g, i) - 28, y = row.y - 20;
        g.box(x, y, 56, 40, 8, RED, RED_DARK);
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 6, y + 14, 44, 10);
      });
    }

    ctx.fillStyle = 'rgba(47,63,71,0.3)';
    ctx.beginPath();
    ctx.ellipse(s.x, PLAYER_Y + R + 6, R, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(s.x, PLAYER_Y + Math.sin(g.time * 14) * 2);
    ctx.rotate((laneX(g, s.lane) - s.x) * 0.006);
    drawFace(ctx, R);
    ctx.restore();
  },
});
