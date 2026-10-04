import { describe, expect, it } from 'vitest';
import { MIN_CROP } from '@/lib/media/crop';
import {
  aspectRatio,
  cropOrFull,
  cropPixels,
  fitAspect,
  FULL_FRAME,
  matchAspect,
  moveCrop,
  normalisedRatio,
  normaliseCrop,
  resizeCrop,
} from './cropEdit';

// A landscape 1920×1080 video.
const W = 1920;
const H = 1080;

describe('aspect ratios', () => {
  it('knows its presets', () => {
    expect(aspectRatio('free')).toBeNull();
    expect(aspectRatio('9:16')).toBeCloseTo(0.5625);
    expect(aspectRatio('1:1')).toBe(1);
  });

  it('turns a pixel ratio into a normalised one', () => {
    expect(normalisedRatio(1, W, H)).toBeCloseTo(H / W);
    expect(normalisedRatio(16 / 9, W, H)).toBeCloseTo(1);
    expect(normalisedRatio(1, 0, H)).toBe(1);
  });
});

describe('cropOrFull / normaliseCrop', () => {
  it('draws null as the whole frame and stores the whole frame as null', () => {
    expect(cropOrFull(null)).toEqual(FULL_FRAME);
    expect(normaliseCrop({ ...FULL_FRAME })).toBeNull();
    expect(normaliseCrop({ x: 0.1, y: 0.1, w: 0.5, h: 0.5 })).toEqual({
      x: 0.1,
      y: 0.1,
      w: 0.5,
      h: 0.5,
    });
  });
});

describe('fitAspect', () => {
  it('fits the largest 9:16 into a landscape frame, centred', () => {
    const c = fitAspect(null, 9 / 16, W, H)!;
    expect(c.h).toBe(1);
    expect((c.w * W) / (c.h * H)).toBeCloseTo(9 / 16);
    expect(c.x + c.w / 2).toBeCloseTo(0.5);
  });

  it('keeps the centre of the current crop, pushed back inside', () => {
    const c = fitAspect({ x: 0.85, y: 0, w: 0.15, h: 1 }, 1, W, H)!;
    expect(c.x + c.w).toBeCloseTo(1);
    expect((c.w * W) / (c.h * H)).toBeCloseTo(1);
  });

  it('leaves the crop as it is for free', () => {
    const cur = { x: 0.1, y: 0.1, w: 0.5, h: 0.5 };
    expect(fitAspect(cur, null, W, H)).toEqual(cur);
  });
});

describe('moveCrop', () => {
  it('moves and stops at the edges', () => {
    const c = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };
    expect(moveCrop(c, 0.1, -0.1)).toEqual({ x: 0.30000000000000004, y: 0.1, w: 0.5, h: 0.5 });
    expect(moveCrop(c, 1, 1)).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
    expect(moveCrop(c, -1, -1)).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 });
  });
});

describe('resizeCrop', () => {
  const c = { x: 0.2, y: 0.2, w: 0.5, h: 0.5 };

  it('keeps the opposite corner fixed', () => {
    const r = resizeCrop(c, 'se', 0.1, 0.1);
    expect(r.x).toBe(0.2);
    expect(r.y).toBe(0.2);
    expect(r.w).toBeCloseTo(0.6);
    const l = resizeCrop(c, 'nw', -0.1, -0.1);
    expect(l.x + l.w).toBeCloseTo(0.7);
    expect(l.y + l.h).toBeCloseTo(0.7);
  });

  it('never shrinks below the minimum nor leaves the picture', () => {
    const tiny = resizeCrop(c, 'se', -1, -1);
    expect(tiny.w).toBe(MIN_CROP);
    expect(tiny.h).toBe(MIN_CROP);
    const big = resizeCrop(c, 'se', 5, 5);
    expect(big.x + big.w).toBeCloseTo(1);
    expect(big.y + big.h).toBeCloseTo(1);
  });

  it('keeps a ratio when asked, within the room there is', () => {
    const ratio = normalisedRatio(9 / 16, W, H);
    const start = fitAspect({ x: 0.3, y: 0.2, w: 0.3, h: 0.6 }, 9 / 16, W, H)!;
    const r = resizeCrop({ ...start, h: start.h * 0.5, w: start.w * 0.5 }, 'se', 0.05, 0, ratio);
    expect(r.w / r.h).toBeCloseTo(ratio);
    expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
    expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe('cropPixels / matchAspect', () => {
  it('gives even pixel sizes, as the worker renders', () => {
    expect(cropPixels(null, W, H)).toEqual([1920, 1080]);
    expect(cropPixels({ x: 0, y: 0, w: 0.3333, h: 0.5 }, 1921, 1081)).toEqual([640, 540]);
  });

  it('recognises a preset a crop already matches', () => {
    expect(matchAspect(fitAspect(null, 9 / 16, W, H), W, H)).toBe('9:16');
    expect(matchAspect(fitAspect(null, 4 / 3, W, H), W, H)).toBe('4:3');
    expect(matchAspect({ x: 0, y: 0, w: 0.3, h: 0.9 }, W, H)).toBe('free');
    expect(matchAspect(null, W, H)).toBe('free');
  });
});
