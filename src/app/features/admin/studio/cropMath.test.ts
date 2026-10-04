import { describe, expect, it } from 'vitest';
import { MIN_CROP } from '@/lib/media/crop';
import {
  boxOf,
  cropOfBox,
  dragCorner,
  fitAspect,
  moveBox,
  normalisedRatio,
  pictureRatio,
  presetRatio,
  scaleBox,
} from './cropMath';

const LANDSCAPE = 16 / 9;
const PORTRAIT = 9 / 16;

const inside = (b: { x: number; y: number; w: number; h: number }) => {
  expect(b.x).toBeGreaterThanOrEqual(-1e-9);
  expect(b.y).toBeGreaterThanOrEqual(-1e-9);
  expect(b.x + b.w).toBeLessThanOrEqual(1 + 1e-9);
  expect(b.y + b.h).toBeLessThanOrEqual(1 + 1e-9);
  expect(b.w).toBeGreaterThanOrEqual(MIN_CROP - 1e-9);
  expect(b.h).toBeGreaterThanOrEqual(MIN_CROP - 1e-9);
};

describe('presets', () => {
  it('knows the ratios', () => {
    expect(presetRatio('free')).toBeNull();
    expect(presetRatio('4:3')).toBeCloseTo(4 / 3);
    expect(presetRatio('9:16')).toBeCloseTo(9 / 16);
  });

  it('a ratio of the picture’s own shape is a square in normalised units', () => {
    expect(normalisedRatio(LANDSCAPE, LANDSCAPE)).toBe(1);
  });

  it('fits the largest 9:16 box into a landscape picture, centred', () => {
    const b = fitAspect(9 / 16, LANDSCAPE);
    expect(b.h).toBe(1);
    expect(pictureRatio(b, LANDSCAPE)).toBeCloseTo(9 / 16);
    expect(b.x + b.w / 2).toBeCloseTo(0.5);
    inside(b);
  });

  it('fits a 4:3 box into a portrait picture across its full width', () => {
    const b = fitAspect(4 / 3, PORTRAIT);
    expect(b.w).toBe(1);
    expect(pictureRatio(b, PORTRAIT)).toBeCloseTo(4 / 3);
    inside(b);
  });

  it('keeps the framing near where it was, but inside the picture', () => {
    const b = fitAspect(9 / 16, LANDSCAPE, { cx: 0.99, cy: 0.5 });
    expect(b.x + b.w).toBeCloseTo(1);
    inside(b);
  });
});

describe('gestures', () => {
  const box = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };

  it('moves the box and stops at the edges', () => {
    expect(moveBox(box, 0.1, -0.1)).toEqual({ x: 0.30000000000000004, y: 0.1, w: 0.5, h: 0.5 });
    const far = moveBox(box, 5, 5);
    expect(far.x).toBe(0.5);
    expect(far.y).toBe(0.5);
  });

  it('drags a free corner while the opposite one stays', () => {
    const b = dragCorner(box, 'se', 0.1, 0.05, null, LANDSCAPE);
    expect(b.x).toBe(0.2);
    expect(b.y).toBe(0.2);
    expect(b.w).toBeCloseTo(0.6);
    expect(b.h).toBeCloseTo(0.55);
    const nw = dragCorner(box, 'nw', -0.1, -0.1, null, LANDSCAPE);
    expect(nw.x + nw.w).toBeCloseTo(0.7);
    expect(nw.y + nw.h).toBeCloseTo(0.7);
  });

  it('never drags a corner out of the picture or below the minimum', () => {
    inside(dragCorner(box, 'se', 3, 3, null, LANDSCAPE));
    inside(dragCorner(box, 'nw', -3, -3, null, LANDSCAPE));
    inside(dragCorner(box, 'se', -3, -3, null, LANDSCAPE));
  });

  it('keeps the ratio while dragging a locked corner', () => {
    const start = fitAspect(9 / 16, LANDSCAPE);
    for (const [dx, dy] of [
      [-0.1, 0],
      [0, -0.2],
      [0.3, 0.3],
      [-2, -2],
    ] as const) {
      const b = dragCorner(start, 'se', dx, dy, 9 / 16, LANDSCAPE);
      expect(pictureRatio(b, LANDSCAPE)).toBeCloseTo(9 / 16, 6);
      inside(b);
    }
  });

  it('pinches about the centre and stops at the picture', () => {
    const big = scaleBox(box, 1.2);
    expect(big.w).toBeCloseTo(0.6);
    expect(big.x + big.w / 2).toBeCloseTo(0.45);
    const huge = scaleBox(box, 10);
    expect(huge.w).toBeCloseTo(1);
    inside(huge);
    inside(scaleBox(box, 0.001));
    expect(scaleBox(box, NaN)).toBe(box);
  });
});

describe('saving', () => {
  it('stores the whole picture as no crop', () => {
    expect(cropOfBox(boxOf(null))).toBeNull();
    expect(cropOfBox({ x: 0.1, y: 0, w: 0.5, h: 1 })).toEqual({ x: 0.1, y: 0, w: 0.5, h: 1 });
  });

  it('reads no crop as the full box', () => {
    expect(boxOf(null)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    expect(pictureRatio(null, LANDSCAPE)).toBeCloseTo(LANDSCAPE);
  });
});
