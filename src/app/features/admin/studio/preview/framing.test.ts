import { describe, expect, it } from 'vitest';
import { clampCrop, type Crop } from '@/lib/media/crop';
import {
  cropFromFraming,
  DEFAULT_FRAMING,
  framingFromCrop,
  isPortraitCrop,
  MAX_ZOOM,
  panFraming,
  PORTRAIT_RATIO,
  portraitBase,
  zoomFraming,
} from './framing';

const LAND = [1920, 1080] as const;
const PORT = [1080, 1920] as const;
const FOUR3 = [1440, 1080] as const;

/** The crop's shape in pixels, w ÷ h. */
const pixelRatio = (c: Crop | null, [w, h]: readonly [number, number]) =>
  ((c?.w ?? 1) * w) / ((c?.h ?? 1) * h);

const inside = (c: Crop | null) => {
  if (!c) return;
  expect(c.x).toBeGreaterThanOrEqual(0);
  expect(c.y).toBeGreaterThanOrEqual(0);
  expect(c.x + c.w).toBeLessThanOrEqual(1 + 1e-9);
  expect(c.y + c.h).toBeLessThanOrEqual(1 + 1e-9);
};

describe('framing: the aspect lock', () => {
  it('starts as the largest centred 9:16 frame', () => {
    const c = cropFromFraming(DEFAULT_FRAMING, ...LAND);
    expect(pixelRatio(c, LAND)).toBeCloseTo(PORTRAIT_RATIO, 6);
    expect(c!.h).toBeCloseTo(1, 9);
    expect(c!.x + c!.w / 2).toBeCloseTo(0.5, 9);
    // A portrait phone clip is already the shape: the whole frame, stored as null.
    expect(cropFromFraming(DEFAULT_FRAMING, ...PORT)).toBeNull();
  });

  it('stays 9:16 and inside the picture whatever the drag and the zoom', () => {
    const sizes: (readonly [number, number])[] = [LAND, PORT, FOUR3];
    for (const size of sizes) {
      let f = DEFAULT_FRAMING;
      const moves: [number, number, number][] = [
        [2, 300, -40],
        [3.5, -900, 900],
        [1.2, 50, 50],
        [99, 10000, -10000],
        [0.1, -3, 7],
      ];
      for (const [zoom, dx, dy] of moves) {
        f = zoomFraming(f, zoom, ...size);
        f = panFraming(f, dx, dy, 270, 480, ...size);
        const c = cropFromFraming(f, ...size);
        expect(pixelRatio(c, size)).toBeCloseTo(PORTRAIT_RATIO, 6);
        inside(c);
        // What is stored survives the server's own clamp unchanged.
        expect(clampCrop(c)).toEqual(c);
      }
    }
  });

  it('keeps the zoom in range', () => {
    expect(zoomFraming(DEFAULT_FRAMING, 0.2, ...LAND).zoom).toBe(1);
    expect(zoomFraming(DEFAULT_FRAMING, 50, ...LAND).zoom).toBe(MAX_ZOOM);
    const c = cropFromFraming(zoomFraming(DEFAULT_FRAMING, MAX_ZOOM, ...LAND), ...LAND);
    expect(c!.w).toBeCloseTo(portraitBase(...LAND).w / MAX_ZOOM, 9);
  });

  it('moves the frame against the finger, by the share of the box dragged', () => {
    const f = zoomFraming(DEFAULT_FRAMING, 2, ...PORT);
    const moved = panFraming(f, 135, 0, 270, 480, ...PORT);
    // Half the box to the right: the frame (half the picture wide at zoom 2) moves a quarter left.
    expect(moved.cx).toBeCloseTo(0.25, 9);
    expect(moved.cy).toBe(f.cy);
  });

  it('reads a stored crop back, narrowing one of another shape to portrait', () => {
    const f = zoomFraming({ zoom: 2, cx: 0.3, cy: 0.6 }, 2, ...LAND);
    const c = cropFromFraming(f, ...LAND);
    const back = framingFromCrop(c, ...LAND);
    expect(back.zoom).toBeCloseTo(f.zoom, 9);
    expect(back.cx).toBeCloseTo(f.cx, 9);
    expect(back.cy).toBeCloseTo(f.cy, 9);

    const wide: Crop = { x: 0.1, y: 0.1, w: 0.8, h: 0.5 };
    const narrowed = cropFromFraming(framingFromCrop(wide, ...LAND), ...LAND);
    expect(isPortraitCrop(narrowed, ...LAND)).toBe(true);
    expect(narrowed!.h).toBeLessThanOrEqual(wide.h + 1e-9);
    expect(isPortraitCrop(wide, ...LAND)).toBe(false);
    expect(framingFromCrop(null, ...LAND)).toEqual(DEFAULT_FRAMING);
  });

  it('frames nothing before the video size is known', () => {
    expect(cropFromFraming(DEFAULT_FRAMING, 0, 0)).toBeNull();
  });
});
