// Nemla's head for the mini-games, like De9De9 Play's face.js but for this
// game's image (assets/nemla-head.png, 300×343, face in the lower part).
const img = new Image();
img.src = 'assets/nemla-head.png';

// Draws the head with the face centred on (0, 0). r is the hitbox radius;
// the face comes out a little wider than it, so near misses feel fair.
export function drawFace(ctx, r) {
  if (!img.complete || !img.naturalWidth) return;
  const w = r * 2.67;
  const h = (w * img.naturalHeight) / img.naturalWidth;
  ctx.drawImage(img, -w / 2, -h * 0.64, w, h);
}
