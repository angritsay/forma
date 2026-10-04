import { describe, expect, it } from 'vitest';
import { backingSize, cropUniform, fitInside, shownPixels } from './previewGeometry';
import { formatSlider, snapSlider } from './gradeFormat';

const crop = { x: 0.25, y: 0, w: 0.5, h: 1 };

describe('cropUniform / shownPixels', () => {
  it('samples the crop only when it is applied', () => {
    expect(cropUniform(crop, true)).toEqual([0.25, 0, 0.5, 1]);
    expect(cropUniform(crop, false)).toEqual([0, 0, 1, 1]);
    expect(cropUniform(null, true)).toEqual([0, 0, 1, 1]);
  });

  it('sizes what is shown', () => {
    expect(shownPixels({ w: 1920, h: 1080 }, crop, true)).toEqual({ w: 960, h: 1080 });
    expect(shownPixels({ w: 1920, h: 1080 }, crop, false)).toEqual({ w: 1920, h: 1080 });
  });
});

describe('fitInside', () => {
  it('fits by the tighter side', () => {
    expect(fitInside({ w: 1920, h: 1080 }, { w: 390, h: 500 })).toEqual({ w: 390, h: 219 });
    expect(fitInside({ w: 1080, h: 1920 }, { w: 390, h: 400 })).toEqual({ w: 225, h: 400 });
  });

  it('falls back to the room for unknown sizes', () => {
    expect(fitInside({ w: 0, h: 0 }, { w: 390, h: 400 })).toEqual({ w: 390, h: 400 });
  });
});

describe('backingSize', () => {
  it('uses device pixels up to what the video has', () => {
    expect(backingSize({ w: 390, h: 219 }, 3, { w: 1920, h: 1080 })).toEqual({ w: 1170, h: 657 });
    expect(backingSize({ w: 390, h: 219 }, 3, { w: 640, h: 360 })).toEqual({ w: 640, h: 359 });
  });

  it('caps the longest side', () => {
    const s = backingSize({ w: 2000, h: 1125 }, 2, { w: 3840, h: 2160 }, 2048);
    expect(Math.max(s.w, s.h)).toBe(2048);
  });
});

describe('gradeFormat', () => {
  it('writes values signed, exposure in EV', () => {
    expect(formatSlider('exposure', 0)).toBe('0 EV');
    expect(formatSlider('exposure', 0.5)).toBe('+0.50 EV');
    expect(formatSlider('exposure', -1.25)).toBe('−1.25 EV');
    expect(formatSlider('contrast', 0.234)).toBe('+23');
    expect(formatSlider('blacks', -0.5)).toBe('−50');
    expect(formatSlider('whites', 0.001)).toBe('0');
  });

  it('snaps to step and range', () => {
    expect(snapSlider('exposure', 0.333)).toBe(0.35);
    expect(snapSlider('contrast', 0.1 + 0.2)).toBe(0.3);
    expect(snapSlider('contrast', 5)).toBe(1);
    expect(snapSlider('exposure', -0.01)).toBe(0);
    expect(Object.is(snapSlider('exposure', -0.01), -0)).toBe(false);
  });
});
