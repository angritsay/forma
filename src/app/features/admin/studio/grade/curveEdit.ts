/**
 * Editing one tone curve: the points the curves editor adds, drags and removes.
 *
 * The curve itself is `curveFunction` from `src/lib/media/grade.ts` (monotone cubic through the
 * points), so what the editor draws is exactly what the LUT, the preview and the worker apply.
 * These helpers only keep the list of points well-formed while a finger moves it: sorted by x,
 * never two points on one x, never more than {@link MAX_CURVE_POINTS}, every value in 0…1.
 */
import { clampCurve, curveFunction, MAX_CURVE_POINTS, type CurvePoint } from '@/lib/media/grade';

/** The closest two points may come on x while one is dragged. */
export const MIN_GAP = 0.02;

const clamp01 = (v: number): number => (v <= 0 ? 0 : v >= 1 ? 1 : v);

export interface PointEdit {
  points: CurvePoint[];
  /** The index of the point that was added or moved, or −1 when nothing changed. */
  index: number;
}

/**
 * A point added at (x, y). Refused (index −1) when the curve is full, or when an existing point
 * is closer than {@link MIN_GAP} on x — the caller grabs that one instead.
 */
export function addPoint(points: readonly CurvePoint[], x: number, y: number): PointEdit {
  const list = [...points];
  if (list.length >= MAX_CURVE_POINTS) return { points: list, index: -1 };
  const px = clamp01(x);
  if (list.some((p) => Math.abs(p[0] - px) < MIN_GAP)) return { points: list, index: -1 };
  const p: CurvePoint = [px, clamp01(y)];
  let i = list.findIndex((q) => q[0] > px);
  if (i < 0) i = list.length;
  list.splice(i, 0, p);
  return { points: list, index: i };
}

/**
 * Point `index` moved to (x, y), held between its neighbours on x (at least {@link MIN_GAP} from
 * each) so dragging never reorders the list or folds the curve back on itself.
 */
export function movePoint(
  points: readonly CurvePoint[],
  index: number,
  x: number,
  y: number,
): PointEdit {
  if (index < 0 || index >= points.length) return { points: [...points], index: -1 };
  const prev = points[index - 1];
  const next = points[index + 1];
  const lo = prev ? prev[0] + MIN_GAP : 0;
  const hi = next ? next[0] - MIN_GAP : 1;
  const nx = lo > hi ? points[index]![0] : Math.min(hi, Math.max(lo, clamp01(x)));
  const list = [...points];
  list[index] = [nx, clamp01(y)];
  return { points: list, index };
}

/** Point `index` removed. */
export function removePoint(points: readonly CurvePoint[], index: number): CurvePoint[] {
  if (index < 0 || index >= points.length) return [...points];
  return points.filter((_, i) => i !== index);
}

/**
 * The point under a finger: the nearest one within `radius` (normalised units, measured with the
 * box's aspect already applied by the caller), or −1.
 */
export function nearestPoint(
  points: readonly CurvePoint[],
  x: number,
  y: number,
  radiusX: number,
  radiusY = radiusX,
): number {
  let best = -1;
  let bestD = Infinity;
  points.forEach(([px, py], i) => {
    const nx = (px - x) / radiusX;
    const ny = (py - y) / radiusY;
    const d = nx * nx + ny * ny;
    if (d <= 1 && d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/**
 * The curve as an SVG path in a `size`×`size` box with y pointing down (0 at the top), sampled at
 * `steps` intervals: the same function the LUT uses, drawn.
 */
export function curvePath(points: readonly CurvePoint[], size = 100, steps = 64): string {
  const f = curveFunction(clampCurve(points));
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const y = clamp01(f(x));
    const sx = (x * size).toFixed(2);
    const sy = ((1 - y) * size).toFixed(2);
    parts.push(`${i === 0 ? 'M' : 'L'}${sx} ${sy}`);
  }
  return parts.join(' ');
}

/** The curve's value at x, for placing a new point on the line under the finger. */
export function curveValueAt(points: readonly CurvePoint[], x: number): number {
  return clamp01(curveFunction(clampCurve(points))(clamp01(x)));
}
