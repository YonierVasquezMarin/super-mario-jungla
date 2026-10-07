export function followCamera(
  current: number,
  focus: number,
  worldSize: number,
  viewSize: number,
  dt: number,
): number {
  const max = Math.max(0, worldSize - viewSize);
  const target = Math.min(max, Math.max(0, focus));
  return current + (target - current) * Math.min(1, dt * 7);
}
