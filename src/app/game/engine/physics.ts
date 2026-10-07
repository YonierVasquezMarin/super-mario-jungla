export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function overlaps(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** El actor sube y su cabeza cruza el borde inferior del bloque. */
export function hitsBlockFromBelow(
  actor: Aabb,
  previousY: number,
  velocityY: number,
  block: Aabb,
): boolean {
  if (velocityY >= 0) {
    return false;
  }

  const overlapsX = actor.x < block.x + block.w && actor.x + actor.w > block.x;
  if (!overlapsX) {
    return false;
  }

  const blockBottom = block.y + block.h;
  const startedBelow = previousY >= blockBottom - 0.5;
  const reachedBlock = actor.y < blockBottom;
  return startedBelow && reachedBlock;
}
