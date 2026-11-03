// The full-screen layer a job's mini-game runs in. The × button, or
// Android's back button (through a history entry), closes it; a run that is
// left before it ends pays nothing and the job stays on the board.
import { GAMES } from '../minigames/index.js';
import { t } from '../text.js';

// `job` is what the ready screen shows ({ name, client, pay }); onEnd(score)
// pays and returns the result to show; onLeave(finished) runs once at the end.
export function openGame(gameId, job, { onEnd, onLeave }) {
  const layer = document.createElement('div');
  layer.className = 'play';
  layer.innerHTML = `
    <canvas role="img"></canvas>
    <button class="play-close" aria-label="${t('play.close')}">×</button>`;
  document.body.append(layer);

  let finished = false;
  let closed = false;
  const game = GAMES[gameId].create(layer.querySelector('canvas'), {
    ...job,
    onEnd(score) {
      finished = true;
      return onEnd(score);
    },
    onClose: leave,
  });
  history.pushState({ play: true }, '');
  window.addEventListener('popstate', close);
  layer.querySelector('.play-close').addEventListener('click', leave);

  function close() {
    if (closed) return;
    closed = true;
    window.removeEventListener('popstate', close);
    game.destroy();
    layer.remove();
    onLeave(finished);
  }

  // Closing from inside the game also takes back the history entry.
  function leave() {
    close();
    history.back();
  }
}
