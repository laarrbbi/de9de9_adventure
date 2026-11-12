// The Work screen: today's jobs, what they pay, the work streak, and the
// jobs still to unlock. Starting a job goes through `onStart(slot)`.
import { JOBS } from '../economy.js';
import { jobById, canTake, currentStreak, streakBonus } from '../jobs.js';
import { coin, icon } from '../art/icons.js';
import { msToMidnight } from '../clock.js';
import { DE9DE9_URL } from '../config.js';
import { t, num, duration } from '../text.js';

const serviceIcon = (service) => `<img src="assets/services/${service}.png" alt="">`;

function jobCard(entry, slot) {
  const job = jobById(entry.job);
  const name = t(`job.${job.id}`);
  const details = entry.by
    ? t('work.byWorkshop', { client: t(`client.${entry.client}`) })
    : t('work.for', {
      client: t(`client.${entry.client}`),
      service: t(`service.${job.service}`),
      game: t(`game.${job.game}`),
    });
  const action = entry.done
    ? `<span class="job-paid">${icon('check', 16)}+${num(entry.paid)}</span>`
    : `<button class="job-go" data-slot="${slot}" aria-label="${t('work.start', { job: name, coins: num(job.pay) })}">${coin(16)}+${num(job.pay)}</button>`;
  return `
    <div class="job${entry.done ? ' done' : ''}">
      <span class="job-icon">${serviceIcon(job.service)}</span>
      <span class="job-text"><b>${name}</b><small>${details}</small></span>
      ${action}
    </div>`;
}

function lockedCard(job) {
  const why = job.needs ? t('work.needsItem', { item: t(`item.${job.needs}`) }) : t('work.needsLevel', { level: job.level });
  return `
    <div class="job locked">
      <span class="job-icon">${icon('lock', 18)}</span>
      <span class="job-text"><b>${t(`job.${job.id}`)}</b><small>${why}</small></span>
      <span class="job-pay">${coin(14)}+${num(job.pay)}</span>
    </div>`;
}

export function mountWork(root, { onStart }) {
  root.innerHTML = `
  <section class="work">
    <div class="title-row">
      <div>
        <h1>${t('work.title')}</h1>
        <p class="sub">${t('work.sub')}</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat">
        <span class="stat-label">${t('work.earned')}</span>
        <span class="stat-value">${coin(18)}<b data-ref="earned"></b></span>
      </div>
      <div class="stat">
        <span class="stat-label">${t('work.left')}</span>
        <span class="stat-value"><b data-ref="left"></b></span>
      </div>
      <div class="stat">
        <span class="stat-label">${t('work.streak')}</span>
        <span class="stat-value"><span class="flame">${icon('flame', 18)}</span><b data-ref="streak"></b></span>
        <span class="stat-note" data-ref="bonus"></span>
      </div>
    </div>
    <div class="jobs" data-ref="list"></div>
    <p class="jobs-note" data-ref="note"></p>
    <div class="jobs" data-ref="locked"></div>
    <div class="real-life">
      <span class="real-text"><small>${t('work.realTitle')}</small><b>${t('work.realText')}</b></span>
      <a href="${DE9DE9_URL}" target="_blank" rel="noopener">${t('work.realLink')}</a>
    </div>
  </section>`;

  const ref = Object.fromEntries([...root.querySelectorAll('[data-ref]')].map((el) => [el.dataset.ref, el]));
  let drawn = '';

  ref.list.addEventListener('click', (e) => {
    const button = e.target.closest('[data-slot]');
    if (button) onStart(Number(button.dataset.slot));
  });

  function update(state, now) {
    const { board, earnedToday } = state.work;
    const left = board.filter((entry) => !entry.done).length;
    const streak = currentStreak(state, now);
    const bonus = Math.round(streakBonus(state, now) * 100);

    ref.earned.textContent = num(earnedToday);
    ref.left.textContent = t('work.leftValue', { left, total: board.length });
    ref.streak.textContent = streak === 1 ? t('work.streakOne') : t('work.streakValue', { days: streak });
    ref.bonus.textContent = bonus ? t('work.streakBonus', { pct: bonus }) : '';
    const time = duration(msToMidnight(now));
    ref.note.textContent = left ? t('work.newJobs', { time }) : t('work.allDone', { time });

    // The lists only change when a job is done, on a new day or a new level.
    const key = `${state.work.day}|${state.nemla.level}|${board.map((e) => e.paid).join()}`;
    if (key === drawn) return;
    drawn = key;
    ref.list.innerHTML = board.map(jobCard).join('');
    const locked = JOBS.filter((job) => !canTake(state, job));
    ref.locked.innerHTML = locked.length
      ? `<p class="jobs-title">${t('work.lockedTitle')}</p>${locked.map(lockedCard).join('')}`
      : '';
  }

  return { update };
}
