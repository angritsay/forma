/** Small numeric helpers shared by the engine modules (not part of the public API). */

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

/** Round to 2 decimals, avoiding binary artefacts such as 1.0499999. */
export function round2(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

/** Round to the nearest multiple of 5. */
export function round5(x: number): number {
  return Math.round(x / 5) * 5;
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/** Guard against NaN/undefined numbers coming from stored JSON. */
export function num(x: number | undefined | null, fallback = 0): number {
  return typeof x === 'number' && Number.isFinite(x) ? x : fallback;
}

/**
 * Piecewise-linear interpolation through sorted `[x, y]` anchors.
 * Below the first anchor the value is clamped to its y, above the last to the last y.
 */
export function piecewiseLinear(
  anchors: readonly (readonly [number, number])[],
  x: number,
): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last) return 0;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (!a || !b) continue;
    if (x <= b[0]) {
      const span = b[0] - a[0];
      if (span <= 0) return b[1];
      return a[1] + ((x - a[0]) / span) * (b[1] - a[1]);
    }
  }
  return last[1];
}
