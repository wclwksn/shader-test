export function mix (x, y, a) {
  return x * (1 - a) + y * a
}

export function clamp (x, a, b) {
  return Math.min(Math.max(x, a), b)
}
