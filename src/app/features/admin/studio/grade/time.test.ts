import { describe, expect, it } from 'vitest';
import {
  clipDuration,
  clipTime,
  formatClock,
  formatSpan,
  needsSeek,
  previewWindow,
  sourceTime,
  wrapTime,
} from './time';

const span = { startS: 12.5, endS: 30, rawOffsetS: 0.4 };

describe('clipDuration', () => {
  it('is end minus start, never negative', () => {
    expect(clipDuration(span)).toBeCloseTo(17.5);
    expect(clipDuration({ startS: 5, endS: 3, rawOffsetS: 0 })).toBe(0);
    expect(clipDuration({ startS: Number.NaN, endS: 3, rawOffsetS: 0 })).toBe(0);
  });
});

describe('previewWindow (the keyframe pad)', () => {
  it('starts after the pad and lasts the clip', () => {
    const w = previewWindow(span);
    expect(w.from).toBeCloseTo(0.4);
    expect(w.to).toBeCloseTo(17.9);
  });

  it('treats a missing or negative pad as none', () => {
    expect(previewWindow({ ...span, rawOffsetS: -1 })).toEqual({ from: 0, to: 17.5 });
    expect(previewWindow({ ...span, rawOffsetS: Number.NaN })).toEqual({ from: 0, to: 17.5 });
  });

  it('stops at the end of a piece that came out short', () => {
    expect(previewWindow(span, 10).to).toBe(10);
    expect(previewWindow(span, null).to).toBeCloseTo(17.9);
  });

  it('plays the whole piece when the pad is longer than the piece', () => {
    expect(previewWindow({ startS: 0, endS: 5, rawOffsetS: 4 }, 3)).toEqual({ from: 0, to: 3 });
  });
});

describe('wrapTime / needsSeek', () => {
  const w = { from: 0.4, to: 17.9 };

  it('leaves a time inside the window alone', () => {
    expect(wrapTime(5, w)).toBe(5);
    expect(needsSeek(5, w)).toBe(false);
  });

  it('jumps back to the start at the end (the loop) and out of the pad', () => {
    expect(wrapTime(17.9, w)).toBe(0.4);
    expect(wrapTime(18.5, w)).toBe(0.4);
    expect(wrapTime(0, w)).toBe(0.4);
    expect(needsSeek(0, w)).toBe(true);
  });

  it('treats a broken time as the start', () => {
    expect(wrapTime(Number.NaN, w)).toBe(0.4);
  });
});

describe('sourceTime / clipTime', () => {
  it('maps the raw piece back onto the long video', () => {
    expect(sourceTime(0.4, span)).toBeCloseTo(12.5);
    expect(sourceTime(5.4, span)).toBeCloseTo(17.5);
  });

  it('counts seconds from the clip start, held inside the clip', () => {
    const w = previewWindow(span);
    expect(clipTime(0.4, w)).toBe(0);
    expect(clipTime(5.4, w)).toBeCloseTo(5);
    expect(clipTime(0, w)).toBe(0);
    expect(clipTime(100, w)).toBeCloseTo(17.5);
  });
});

describe('formatClock', () => {
  it('writes m:ss.d', () => {
    expect(formatClock(0)).toBe('0:00.0');
    expect(formatClock(12.54)).toBe('0:12.5');
    expect(formatClock(75)).toBe('1:15.0');
    expect(formatClock(75, false)).toBe('1:15');
  });

  it('rounds once, so 59.96 is a minute and never 0:60.0', () => {
    expect(formatClock(59.96)).toBe('1:00.0');
  });

  it('switches to h:mm:ss from an hour and reads garbage as zero', () => {
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-3)).toBe('0:00.0');
    expect(formatClock(Number.NaN)).toBe('0:00.0');
  });

  it('formats a span', () => {
    expect(formatSpan(span)).toBe('0:12.5–0:30.0');
  });
});
