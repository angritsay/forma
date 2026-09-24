import { describe, expect, it } from 'vitest';
import { fitRate, MIN_FIT_RATE } from './fit';

describe('fitRate', () => {
  it('slows a clip shorter than the step so that it fills it', () => {
    // A 10 s clip of entering the pose over a 20 s hold: half speed, exactly.
    expect(fitRate(10, 20)).toBe(0.5);
    expect(fitRate(30, 40)).toBeCloseTo(0.75);
  });

  it('never speeds a clip up: one longer than the step plays at 1 and is cut', () => {
    expect(fitRate(60, 30)).toBe(1);
    expect(fitRate(30, 30)).toBe(1);
  });

  it('stops at the floor Safari honours, however long the hold', () => {
    expect(fitRate(10, 60)).toBe(MIN_FIT_RATE);
    expect(fitRate(1, 600)).toBe(MIN_FIT_RATE);
    expect(MIN_FIT_RATE).toBe(0.5);
  });

  it('plays at 1 when either length is unknown', () => {
    // `video.duration` is NaN before metadata, Infinity for a live stream, 0 for a broken file.
    expect(fitRate(NaN, 30)).toBe(1);
    expect(fitRate(Infinity, 30)).toBe(1);
    expect(fitRate(0, 30)).toBe(1);
    expect(fitRate(-5, 30)).toBe(1);
    expect(fitRate(10, NaN)).toBe(1);
    expect(fitRate(10, 0)).toBe(1);
    expect(fitRate(10, -1)).toBe(1);
  });
});
