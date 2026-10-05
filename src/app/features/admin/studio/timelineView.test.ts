import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  drawCell,
  drawWindow,
  dragTime,
  fillOrder,
  FLING_STOP,
  flingVelocity,
  IDLE_SEEK,
  MAX_ZOOM_CAP,
  maxZoom,
  MIN_LABEL_PX,
  MIN_TICK_PX,
  MIN_VISIBLE_SECONDS,
  pinchZoom,
  pxPerSecond,
  releaseVelocity,
  requestSeek,
  rulerLabel,
  rulerSteps,
  rulerTicks,
  seekSettled,
  stepZoom,
  stripOffset,
  timeAtX,
  visibleSpan,
  zoomLevels,
} from './timelineView';

describe('zoom', () => {
  it('goes as deep as about two seconds across the strip, at most ×128', () => {
    // The owner's video: 5:31.
    expect(maxZoom(331)).toBe(128);
    expect(331 / maxZoom(331)).toBeGreaterThanOrEqual(MIN_VISIBLE_SECONDS);
    expect(maxZoom(60)).toBe(16); // 60 / 16 = 3.75 s; ×32 would be 1.9 s
    expect(maxZoom(3600)).toBe(MAX_ZOOM_CAP);
    expect(maxZoom(1.5)).toBe(1);
    expect(maxZoom(null)).toBe(1);
    expect(maxZoom(Number.NaN)).toBe(1);
  });

  it('walks in powers of two', () => {
    expect(zoomLevels(16)).toEqual([1, 2, 4, 8, 16]);
    expect(zoomLevels(1)).toEqual([1]);
    expect(stepZoom(4, 1, 16)).toBe(8);
    expect(stepZoom(4, -1, 16)).toBe(2);
    expect(stepZoom(16, 1, 16)).toBe(16);
    expect(stepZoom(1, -1, 16)).toBe(1);
  });

  it('keeps a zoom on a step and inside the range', () => {
    expect(clampZoom(3.1, 128)).toBe(4);
    expect(clampZoom(0.2, 128)).toBe(1);
    expect(clampZoom(500, 32)).toBe(32);
    expect(clampZoom(Number.NaN, 32)).toBe(1);
  });

  it('turns a pinch into a step', () => {
    expect(pinchZoom(4, 1, 128)).toBe(4);
    expect(pinchZoom(4, 2.1, 128)).toBe(8);
    expect(pinchZoom(4, 0.45, 128)).toBe(2);
    expect(pinchZoom(4, 1.3, 128)).toBe(4); // not far enough for the next step
    expect(pinchZoom(64, 8, 128)).toBe(128);
    expect(pinchZoom(2, 0.01, 128)).toBe(1);
    expect(pinchZoom(4, 0, 128)).toBe(4);
  });
});

describe('time and the strip', () => {
  const W = 300;

  it('fits the whole video across the strip at ×1', () => {
    expect(pxPerSecond(W, 300, 1)).toBe(1);
    expect(pxPerSecond(W, 300, 8)).toBe(8);
    expect(pxPerSecond(W, null, 4)).toBe(0);
    expect(pxPerSecond(0, 300, 4)).toBe(0);
  });

  it('draws the playhead time in the middle', () => {
    const pps = 10;
    expect(stripOffset(W, 0, pps)).toBe(150);
    expect(stripOffset(W, 20, pps)).toBe(-50);
    // Time 20 at x = offset + 20 × pps = the middle.
    expect(stripOffset(W, 20, pps) + 20 * pps).toBe(W / 2);
  });

  it('reads the time under a finger, kept inside the video', () => {
    const pps = 10;
    expect(timeAtX(150, W, 20, pps, 60)).toBe(20);
    expect(timeAtX(250, W, 20, pps, 60)).toBe(30);
    expect(timeAtX(0, W, 5, pps, 60)).toBe(0); // before the start
    expect(timeAtX(300, W, 58, pps, 60)).toBe(60); // past the end
    expect(timeAtX(10, W, 7, 0, 60)).toBe(7);
  });

  it('drags the strip with the finger: right is back in time', () => {
    expect(dragTime(20, 50, 10, 60)).toBe(15);
    expect(dragTime(20, -50, 10, 60)).toBe(25);
    expect(dragTime(2, 50, 10, 60)).toBe(0);
    expect(dragTime(58, -50, 10, 60)).toBe(60);
    // At a deeper zoom the same move is a smaller step in time.
    expect(dragTime(20, 50, 100, 60)).toBeCloseTo(19.5, 6);
  });

  it('knows the span on screen', () => {
    expect(visibleSpan(W, 20, 10)).toEqual({ from: 5, to: 35 });
    expect(visibleSpan(W, 20, 0)).toEqual({ from: 0, to: 0 });
  });

  it('draws whole screens around the playhead and changes only between them', () => {
    expect(drawCell(12, 10)).toBe(1);
    expect(drawCell(19.99, 10)).toBe(1);
    expect(drawCell(20, 10)).toBe(2);
    const w = drawWindow(1, 10);
    expect(w.from).toBe(-5);
    expect(w.to).toBe(35);
    // Anywhere in the cell, the screen around the playhead is inside the window.
    for (const now of [10, 15, 19.9]) {
      expect(now - 5).toBeGreaterThanOrEqual(w.from);
      expect(now + 5).toBeLessThanOrEqual(w.to);
    }
    expect(drawWindow(3, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe('ruler', () => {
  it('ticks in minutes zoomed out and in frames zoomed in', () => {
    // 5:31 over 330px: 1px a second.
    const out = rulerSteps(1, 30);
    expect(out.minor).toBe(10);
    expect(out.major).toBe(60);
    // ×16: 16px a second.
    const mid = rulerSteps(16, 30);
    expect(mid.minor).toBe(0.5);
    expect(mid.major).toBe(5);
    // 300px a second: one frame at 30 fps is 10px.
    const deep = rulerSteps(300, 30);
    expect(deep.minor).toBeCloseTo(1 / 30, 9);
    expect(deep.major).toBe(0.5);
  });

  it('keeps ticks and labels apart, labels on ticks', () => {
    for (const pps of [0.2, 1, 3, 16, 60, 135, 300]) {
      const { minor, major } = rulerSteps(pps, 29.97);
      expect(minor * pps).toBeGreaterThanOrEqual(MIN_TICK_PX);
      expect(major * pps).toBeGreaterThanOrEqual(MIN_LABEL_PX);
      expect(major).toBeGreaterThanOrEqual(minor);
    }
  });

  it('lists the ticks inside the video only', () => {
    const ticks = rulerTicks(-5, 25, { minor: 5, major: 10 }, 20);
    expect(ticks.map((x) => x.t)).toEqual([0, 5, 10, 15, 20]);
    expect(ticks.filter((x) => x.major).map((x) => x.t)).toEqual([0, 10, 20]);
    expect(rulerTicks(0, 1000, { minor: 1, major: 10 }, 1000, 50)).toHaveLength(50);
    expect(rulerTicks(5, 2, { minor: 1, major: 10 }, 10)).toEqual([]);
  });

  it('labels whole seconds and tenths', () => {
    expect(rulerLabel(0, 60)).toBe('0:00');
    expect(rulerLabel(125, 5)).toBe('2:05');
    expect(rulerLabel(59.9999999, 1)).toBe('1:00');
    expect(rulerLabel(61.5, 0.5)).toBe('1:01.5');
  });
});

describe('filmstrip order', () => {
  it('makes every frame once, the ends first and the gaps evenly', () => {
    const order = fillOrder(40);
    expect(order).toHaveLength(40);
    expect(new Set(order).size).toBe(40);
    expect(order.slice(0, 2)).toEqual([0, 39]);
    // The first handful already spans the strip.
    const first = order.slice(0, 6);
    expect(Math.max(...first) - Math.min(...first)).toBe(39);
    expect(fillOrder(0)).toEqual([]);
    expect(fillOrder(1)).toEqual([0]);
  });
});

describe('fling', () => {
  it('slows down and stops', () => {
    let v = 1.5;
    let steps = 0;
    while (v !== 0 && steps < 1000) {
      v = flingVelocity(v, 16);
      steps++;
    }
    expect(v).toBe(0);
    expect(steps).toBeGreaterThan(10);
    expect(steps).toBeLessThan(200);
    expect(Math.abs(flingVelocity(FLING_STOP / 2, 0))).toBe(0);
  });

  it('reads the release speed from the last moments only', () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ x: 0, at: 0 }])).toBe(0);
    expect(
      releaseVelocity([
        { x: 0, at: 0 },
        { x: 0, at: 480 }, // a pause before the flick
        { x: 50, at: 550 },
        { x: 100, at: 600 },
      ]),
    ).toBe(1); // 50px in the last 50ms; the pause before it does not count
  });
});

describe('seek queue', () => {
  it('keeps one seek in flight and goes to the newest target next', () => {
    let r = requestSeek(IDLE_SEEK, { t: 1, fast: true });
    expect(r.start).toEqual({ t: 1, fast: true });
    let q = r.queue;
    expect(q.busy).toBe(true);

    // Three moves while the first seek is on its way: only the last is kept.
    for (const t of [2, 3, 4]) {
      r = requestSeek(q, { t, fast: true });
      expect(r.start).toBeNull();
      q = r.queue;
    }
    expect(q.next).toEqual({ t: 4, fast: true });

    // The finger lets go: the exact target replaces the waiting one.
    r = requestSeek(q, { t: 4.2, fast: false });
    q = r.queue;

    let s = seekSettled(q);
    expect(s.start).toEqual({ t: 4.2, fast: false });
    q = s.queue;
    expect(q.busy).toBe(true);

    s = seekSettled(q);
    expect(s.start).toBeNull();
    expect(s.queue).toEqual(IDLE_SEEK);
  });

  it('settling when idle stays idle', () => {
    expect(seekSettled(IDLE_SEEK)).toEqual({ queue: IDLE_SEEK, start: null });
  });
});
