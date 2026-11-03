// From De9De9 Play. The De9De9 wordmark as a soft watermark for game
// backgrounds. The image is white on transparent, so it can be tinted to any
// colour.
const mark = new Image();
mark.src = 'assets/logo-mark.png';
const tints = new Map();

function tinted(color) {
  let canvas = tints.get(color);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = mark.naturalWidth;
    canvas.height = mark.naturalHeight;
    const c = canvas.getContext('2d');
    c.drawImage(mark, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color;
    c.fillRect(0, 0, canvas.width, canvas.height);
    tints.set(color, canvas);
  }
  return canvas;
}

// Draws the logo centred on (x, y) and `width` wide.
export function drawLogo(ctx, x, y, width, color, alpha) {
  if (!mark.complete || !mark.naturalWidth) return;
  const height = (width * mark.naturalHeight) / mark.naturalWidth;
  ctx.globalAlpha = alpha;
  ctx.drawImage(tinted(color), x - width / 2, y - height / 2, width, height);
  ctx.globalAlpha = 1;
}
