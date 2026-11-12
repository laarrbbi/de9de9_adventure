// The shell every job mini-game runs in, adapted from De9De9 Play's engine:
// canvas sizing, the frame loop, input, and the ready / playing / done flow.
// Instead of paying into a wallet, a finished run asks the job what it pays
// (`job.onEnd(score)`) and shows that; the next tap hands back (`job.onClose`).
import { beep } from '../audio.js';
import { t, num } from '../text.js';

export const TEAL = '#65cbc4';
export const RED = '#e7464e';
export const RED_DARK = '#b3323a';
export const ORANGE = '#ff8515';
export const SLATE = '#455a64';
export const INK = '#2f3f47';
export const GOLD = '#ffc93c';
export const FONT = '"Plus Jakarta Sans", -apple-system, "Segoe UI", Roboto, sans-serif';

// World units: the playfield is always H tall, width (g.W) follows the screen.
export const H = 640;

const CLOSE_DELAY = 0.8;
const SWIPE = 22;
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

export function hitsRect(cx, cy, r, x, y, w, h) {
  const dx = cx - Math.max(x, Math.min(cx, x + w));
  const dy = cy - Math.max(y, Math.min(cy, y + h));
  return dx * dx + dy * dy < r * r;
}

// Titles are shown logo-style in two colours: split at the space, or in half.
function splitTitle(title) {
  const cut = title.includes(' ') ? title.indexOf(' ') + 1 : Math.ceil(title.length / 2);
  return [title.slice(0, cut), title.slice(cut)];
}

// A game is a spec: { id, title, hint, init, update, draw } plus optional
// idle (ready-screen animation), firstTapPlays (the tap that starts the run
// is also a move), after (animation once the run is over),
// canStart (veto the press that starts a run) and the input hooks
// onDown / onMove / onUp / onTap / onSwipe.
// Per-run state lives on g.s.
//
// `job` is { name, client, pay: [min, max], onEnd(score) → result, onClose() }.
export function defineGame(spec) {
  return { ...spec, create: (canvas, job) => run(canvas, spec, job) };
}

function run(canvas, spec, job) {
  const ctx = canvas.getContext('2d');
  let raf, last = 0, down = null;

  const g = {
    ctx,
    H,
    W: 360,
    state: 'ready',
    score: 0,
    time: 0,
    doneFor: 0,
    result: null,
    pointer: { x: 180, y: H / 2, down: false },
    s: null,
    beep,

    addScore(n = 1) {
      g.score += n;
    },

    gameOver() {
      if (g.state !== 'playing') return;
      g.state = 'done';
      g.doneFor = 0;
      beep(140, 0.3, 'sawtooth', 0.1);
      g.result = job.onEnd(g.score);
      describe();
    },

    // Plain label; pass a stroke colour for text that sits on the playfield.
    text(str, x, y, size, fill, { stroke, align = 'center', weight = 800 } = {}) {
      ctx.font = `${weight} ${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      if (stroke) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = size / 5;
        ctx.strokeStyle = stroke;
        ctx.strokeText(str, x, y);
      }
      ctx.fillStyle = fill;
      ctx.fillText(str, x, y);
    },

    card(x, y, w, h, radius, fill) {
      ctx.save();
      ctx.shadowColor = 'rgba(47, 63, 71, 0.25)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      ctx.restore();
    },

    box(x, y, w, h, radius, fill, stroke) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },

    sky(top = '#7fd4ce', bottom = '#eefaf9') {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, g.W, H);
    },

    coin(x, y, r) {
      ctx.fillStyle = GOLD;
      ctx.strokeStyle = '#e09a00';
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    },

    heart(x, y, size, full) {
      const k = size / 20;
      ctx.fillStyle = full ? RED : 'rgba(47, 63, 71, 0.2)';
      ctx.beginPath();
      ctx.moveTo(x, y + 7 * k);
      ctx.bezierCurveTo(x - 12 * k, y - 1 * k, x - 7 * k, y - 11 * k, x, y - 5 * k);
      ctx.bezierCurveTo(x + 7 * k, y - 11 * k, x + 12 * k, y - 1 * k, x, y + 7 * k);
      ctx.fill();
    },
  };

  // Largest font size (up to `size`) at which str fits in maxW.
  function fit(str, weight, size, maxW) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const w = ctx.measureText(str).width;
    return w > maxW ? Math.floor((size * maxW) / w) : size;
  }

  // The canvas says what is happening, for screen readers (and the smoke test).
  function describe() {
    canvas.dataset.state = g.state;
    canvas.setAttribute('aria-label', g.state === 'done'
      ? t('play.doneLabel', { coins: num(g.result.coins) })
      : `${spec.title}. ${spec.hint}`);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const scale = canvas.clientHeight / H;
    g.W = canvas.clientWidth / scale;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  }

  // The game's wordmark, the job, what it pays, and how to play.
  function drawReady() {
    const [a, b] = splitTitle(spec.title);
    const size = fit(spec.title, 800, 44, g.W - 84);
    ctx.font = `800 ${size}px ${FONT}`;
    const wa = ctx.measureText(a).width, total = ctx.measureText(spec.title).width;
    const x = (g.W - total) / 2;
    g.card(x - 26, 96, total + 52, 74, 37, '#fff');
    g.text(a, x, 133 + size * 0.35, size, RED, { align: 'left' });
    g.text(b, x + wa, 133 + size * 0.35, size, TEAL, { align: 'left' });

    const pw = Math.min(300, g.W - 40), px = (g.W - pw) / 2, py = 200;
    g.card(px, py, pw, 96, 20, '#fff');
    g.text(job.name, g.W / 2, py + 36, fit(job.name, 800, 20, pw - 32), INK);
    g.text(job.client, g.W / 2, py + 58, 14, SLATE, { weight: 600 });
    // the coin and the pay, centred together
    const pay = t('play.pay', { min: num(job.pay[0]), max: num(job.pay[1]) });
    ctx.font = `800 15px ${FONT}`;
    const left = g.W / 2 - (ctx.measureText(pay).width + 22) / 2;
    g.coin(left + 8, py + 76, 8);
    g.text(pay, left + 22, py + 82, 15, '#b06f00', { align: 'left' });

    g.text(spec.hint, g.W / 2, H * 0.62, fit(spec.hint, 800, 24, g.W - 32), '#fff', { stroke: INK });
    // a game that needs a particular first tap says so in its hint, and in
    // one whose first tap already plays (firstTapPlays) the hint is enough
    if (!spec.canStart && !spec.firstTapPlays) g.text(t('play.start'), g.W / 2, H * 0.62 + 40, 16, '#fff', { stroke: INK, weight: 700 });
  }

  function drawDone() {
    const r = g.result;
    const notes = [r.bonus > 0 && t('play.streak', { pct: Math.round(r.bonus * 100) }), r.tired && t('play.tired')].filter(Boolean);
    const pw = Math.min(280, g.W - 40), ph = 222 + notes.length * 20, x = (g.W - pw) / 2, y = 150;
    g.card(x, y, pw, ph, 24, '#fff');
    g.text(t('play.done'), g.W / 2, y + 46, 30, TEAL);
    g.text(t(`rating.${r.rating}`), g.W / 2, y + 74, 16, SLATE, { weight: 700 });
    g.text(t('play.score'), x + 28, y + 118, 18, SLATE, { align: 'left', weight: 600 });
    g.text(String(g.score), x + pw - 28, y + 118, 24, SLATE, { align: 'right' });
    g.text(t('play.coins'), x + 28, y + 164, 18, SLATE, { align: 'left', weight: 600 });
    g.coin(x + pw - 38, y + 157, 11);
    g.text(`+${num(r.coins)}`, x + pw - 56, y + 166, 30, '#d98200', { align: 'right' });
    notes.forEach((note, i) => g.text(note, g.W / 2, y + 204 + i * 20, 13, SLATE, { weight: 600 }));

    if (g.doneFor > CLOSE_DELAY) {
      const bw = 200, bx = (g.W - bw) / 2, by = y + ph + 22;
      const grad = ctx.createLinearGradient(bx, 0, bx + bw * 1.45, 0);
      grad.addColorStop(0, RED);
      grad.addColorStop(1, ORANGE);
      g.card(bx, by, bw, 54, 27, grad);
      g.text(t('play.collect'), g.W / 2, by + 35, 20, '#fff', { weight: 700 });
    }
  }

  function frame(time) {
    const dt = Math.max(0, Math.min((time - last) / 1000, 1 / 30));
    last = time;
    g.time += dt;
    if (g.state === 'ready') spec.idle?.(g, dt);
    else if (g.state === 'playing') spec.update(g, dt);
    else {
      g.doneFor += dt;
      spec.after?.(g, dt);
    }
    spec.draw(g);
    if (g.state === 'ready') drawReady();
    else if (g.state === 'playing') g.text(String(g.score), g.W / 2, 110, 60, '#fff', { stroke: INK });
    else drawDone();
    raf = requestAnimationFrame(frame);
  }

  // A press starts the run from the ready screen, and collects the pay once
  // the run is done. Returns whether the game itself should handle it.
  function press() {
    if (g.state === 'done') {
      if (g.doneFor > CLOSE_DELAY) job.onClose();
      return false;
    }
    if (g.state === 'ready') {
      g.state = 'playing';
      describe();
    }
    return true;
  }

  function at(e) {
    const r = canvas.getBoundingClientRect();
    const k = H / r.height;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  }

  const onPointerDown = (e) => {
    e.preventDefault();
    const p = at(e);
    g.pointer = { ...p, down: true };
    if (g.state === 'ready' && spec.canStart && !spec.canStart(g, p.x, p.y)) return;
    if (!press()) return;
    down = { ...p, swiped: false };
    spec.onDown?.(g, p.x, p.y);
  };

  const onPointerMove = (e) => {
    const p = at(e);
    g.pointer.x = p.x;
    g.pointer.y = p.y;
    if (g.state !== 'playing') return;
    spec.onMove?.(g, p.x, p.y);
    if (!down || !spec.onSwipe) return;
    const dx = p.x - down.x, dy = p.y - down.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) return;
    // re-anchor so one long drag can chain several swipes
    down = { ...p, swiped: true };
    spec.onSwipe(g, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };

  const onPointerUp = (e) => {
    g.pointer.down = false;
    if (down && !down.swiped && e.type === 'pointerup' && g.state === 'playing') spec.onTap?.(g, down.x, down.y);
    down = null;
    spec.onUp?.(g);
  };

  const onKey = (e) => {
    const dir = KEYS[e.code];
    if (!dir && e.code !== 'Space' && e.code !== 'Enter') return;
    e.preventDefault();
    if (!press()) return;
    if (dir && spec.onSwipe) return spec.onSwipe(g, dir);
    spec.onDown?.(g, g.W / 2, H / 2);
    spec.onTap?.(g, g.W / 2, H / 2);
    spec.onUp?.(g);
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  resize();
  spec.init(g);
  describe();
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
    },
  };
}
