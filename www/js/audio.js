// Tiny synth so the app ships without sound files. beep() and note() are
// De9De9 Play's; the game's sound effects are at the end.
let ctx, bus;

function audio() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Short blip for game effects.
export function beep(freq, duration = 0.08, type = 'square', volume = 0.08) {
  try {
    const ac = audio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  } catch {}
}

// Melody notes share a soft echo, so they ring into each other like in a room.
function melodyBus() {
  if (bus) return bus;
  const ac = audio();
  bus = ac.createGain();
  const delay = ac.createDelay(0.5);
  const feedback = ac.createGain();
  const wet = ac.createGain();
  delay.delayTime.value = 0.17;
  feedback.gain.value = 0.28;
  wet.gain.value = 0.22;
  bus.connect(ac.destination);
  bus.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(ac.destination);
  return bus;
}

// [wave, pitch ratio, detune in cents, level]: one reed in tune, two slightly
// off either side so the note shimmers, and a quiet one an octave down, like
// an accordion. The in-tune reed keeps the pitch solid while the others beat.
const REEDS = [
  ['sawtooth', 1, 0, 0.5],
  ['sawtooth', 1, -8, 0.28],
  ['sawtooth', 1, 8, 0.28],
  ['square', 0.5, 0, 0.12],
];
const RELEASE = 0.18;

// A sung, reedy lead note in the style of a raï keyboard or accordion: it
// slides up into the pitch, then a slow vibrato comes in as it fades.
export function note(freq, duration = 0.5, volume = 0.16) {
  try {
    const ac = audio(), t = ac.currentTime, end = t + duration;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(1400, end);

    const amp = ac.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    amp.gain.exponentialRampToValueAtTime(volume * 0.7, t + 0.1);
    // held like a pressed key, then let go
    amp.gain.setValueAtTime(volume * 0.7, end - RELEASE);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    filter.connect(amp);
    amp.connect(melodyBus());

    const vibrato = ac.createOscillator();
    const depth = ac.createGain();
    vibrato.frequency.value = 5.5;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(freq * 0.006, t + 0.2);
    vibrato.connect(depth);
    vibrato.start(t);
    vibrato.stop(end + 0.05);

    for (const [wave, ratio, cents, level] of REEDS) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = wave;
      osc.detune.value = cents;
      // start about a quarter tone flat and slide up
      osc.frequency.setValueAtTime(freq * ratio * 0.97, t);
      osc.frequency.exponentialRampToValueAtTime(freq * ratio, t + 0.05);
      depth.connect(osc.frequency);
      gain.gain.value = level;
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(end + 0.05);
    }
  } catch {}
}

const later = (ms, play) => setTimeout(play, ms);

// A short raï phrase for the radio, on a Hijaz scale (A, B flat, G, F sharp).
const RADIO = [440, 466.2, 440, 392, 370, 392];

export const sfx = {
  tap: () => beep(660, 0.05, 'triangle', 0.06),
  no: () => beep(180, 0.15, 'square', 0.05),
  eat: () => [0, 110, 220].forEach((ms) => later(ms, () => beep(240, 0.05, 'square', 0.05))),
  wash: () => [0, 70, 140, 210].forEach((ms, i) => later(ms, () => beep(700 + i * 150, 0.07, 'sine', 0.06))),
  radio: () => RADIO.forEach((freq, i) => later(i * 230, () => note(freq, 0.32, 0.12))),
  sleep: () => [392, 330, 262].forEach((freq, i) => later(i * 200, () => beep(freq, 0.3, 'sine', 0.05))),
  wake: () => [262, 330, 392].forEach((freq, i) => later(i * 120, () => beep(freq, 0.15, 'triangle', 0.06))),
  giggle: () => [880, 990, 1100].forEach((freq, i) => later(i * 70, () => beep(freq, 0.06, 'sine', 0.06))),
  levelUp: () => [523, 659, 784, 1047].forEach((freq, i) => later(i * 110, () => beep(freq, 0.14, 'triangle', 0.07))),
  coins: () => [988, 1319, 1568].forEach((freq, i) => later(i * 80, () => beep(freq, 0.09, 'triangle', 0.07))),
};
