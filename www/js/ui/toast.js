// Short messages that float above the tab bar and fade out by themselves.
const MAX = 3;
const SHOW_MS = 2800;

export function toast(text, kind = '') {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  box.append(el);
  while (box.children.length > MAX) box.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, SHOW_MS);
}
