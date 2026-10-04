import { describe, expect, it } from 'vitest';
import { curveFunction, MAX_CURVE_POINTS, type CurvePoint } from '@/lib/media/grade';
import {
  addPoint,
  curvePath,
  curveValueAt,
  MIN_GAP,
  movePoint,
  nearestPoint,
  removePoint,
} from './curveEdit';

const pts: CurvePoint[] = [
  [0.25, 0.2],
  [0.75, 0.85],
];

describe('addPoint', () => {
  it('inserts in x order and answers the new index', () => {
    const r = addPoint(pts, 0.5, 0.6);
    expect(r.index).toBe(1);
    expect(r.points.map((p) => p[0])).toEqual([0.25, 0.5, 0.75]);
    expect(addPoint([], 0.3, 0.3).index).toBe(0);
    expect(addPoint(pts, 0.9, 0.95).index).toBe(2);
  });

  it('clamps to the box', () => {
    expect(addPoint([], 1.4, -0.2).points).toEqual([[1, 0]]);
  });

  it('refuses a point on top of another and on a full curve', () => {
    expect(addPoint(pts, 0.25 + MIN_GAP / 2, 0.5).index).toBe(-1);
    const full: CurvePoint[] = Array.from({ length: MAX_CURVE_POINTS }, (_, i) => [
      i / MAX_CURVE_POINTS,
      i / MAX_CURVE_POINTS,
    ]);
    expect(addPoint(full, 0.99, 0.5).index).toBe(-1);
  });
});

describe('movePoint', () => {
  it('moves freely between its neighbours', () => {
    expect(movePoint(pts, 0, 0.3, 0.1).points[0]).toEqual([0.3, 0.1]);
  });

  it('never passes a neighbour, so the list stays sorted', () => {
    const r = movePoint(pts, 0, 0.9, 0.5);
    expect(r.points[0]![0]).toBeCloseTo(0.75 - MIN_GAP);
    expect(r.points[0]![0]).toBeLessThan(r.points[1]![0]);
    expect(movePoint(pts, 1, 0.1, 0.5).points[1]![0]).toBeCloseTo(0.25 + MIN_GAP);
  });

  it('holds the ends to the box and ignores a bad index', () => {
    expect(movePoint(pts, 1, 2, 2).points[1]).toEqual([1, 1]);
    expect(movePoint(pts, 5, 0, 0).index).toBe(-1);
  });
});

describe('removePoint', () => {
  it('drops one point', () => {
    expect(removePoint(pts, 0)).toEqual([[0.75, 0.85]]);
    expect(removePoint(pts, 9)).toEqual(pts);
  });
});

describe('nearestPoint', () => {
  it('finds the closest point inside the radius, or none', () => {
    expect(nearestPoint(pts, 0.27, 0.22, 0.05)).toBe(0);
    expect(nearestPoint(pts, 0.5, 0.5, 0.05)).toBe(-1);
    expect(nearestPoint(pts, 0.5, 0.5, 0.5)).toBe(0);
  });
});

describe('curvePath / curveValueAt', () => {
  it('draws the identity as the diagonal, y down', () => {
    const path = curvePath([], 100, 2);
    expect(path).toBe('M0.00 100.00 L50.00 50.00 L100.00 0.00');
  });

  it('samples the same function the LUT uses', () => {
    const f = curveFunction(pts);
    expect(curveValueAt(pts, 0.4)).toBeCloseTo(f(0.4), 10);
  });

  it('is monotone for rising points, whatever the editor does', () => {
    let list: CurvePoint[] = [];
    list = addPoint(list, 0.2, 0.05).points;
    list = addPoint(list, 0.4, 0.7).points;
    list = addPoint(list, 0.6, 0.72).points;
    list = addPoint(list, 0.8, 0.98).points;
    let prev = -1;
    for (let i = 0; i <= 200; i++) {
      const y = curveValueAt(list, i / 200);
      expect(y).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = y;
    }
  });
});
