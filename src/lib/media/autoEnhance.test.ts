import { describe, expect, it } from 'vitest';
import {
  applyAuto,
  AUTO_LIMITS,
  computeAutoParams,
  identityAuto,
  isIdentityAuto,
  isIdentityLook,
  parseAutoParams,
  studioLut,
  type AutoParams,
  type PixelSample,
} from './autoEnhance';
import { defaultGrade, gradeToLut, sampleLut } from './grade';

/** A frame of `n` pixels made by `f(i / (n − 1))`, packed RGB bytes. */
function frame(n: number, f: (t: number) => [number, number, number]): PixelSample {
  const data = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = f(n > 1 ? i / (n - 1) : 0);
    data[i * 3] = Math.round(r * 255);
    data[i * 3 + 1] = Math.round(g * 255);
    data[i * 3 + 2] = Math.round(b * 255);
  }
  return { data, channels: 3 };
}

const greyRamp = frame(4096, (t) => [t, t, t]);

function within(p: AutoParams): void {
  const L = AUTO_LIMITS;
  expect(p.lo).toBeGreaterThanOrEqual(0);
  expect(p.lo).toBeLessThanOrEqual(L.maxBlack);
  expect(p.hi).toBeGreaterThanOrEqual(L.minWhite);
  expect(p.hi).toBeLessThanOrEqual(1);
  for (const g of p.gain) {
    expect(g).toBeGreaterThanOrEqual(1 - L.wb - 1e-9);
    expect(g).toBeLessThanOrEqual(1 + L.wb + 1e-9);
  }
  expect(p.gamma).toBeGreaterThanOrEqual(L.gamma.min);
  expect(p.gamma).toBeLessThanOrEqual(L.gamma.max);
  expect(p.contrast).toBeGreaterThanOrEqual(0);
  expect(p.contrast).toBeLessThanOrEqual(L.maxContrast);
}

describe('auto-enhance: the statistics', () => {
  it('leaves a neutral, full-range picture as it is', () => {
    const p = computeAutoParams([greyRamp]);
    expect(p.gain).toEqual([1, 1, 1]);
    expect(p.gamma).toBe(1);
    expect(p.contrast).toBe(0);
    for (let i = 0; i <= 20; i++) {
      const v = i / 20;
      const [r, g, b] = applyAuto(p, [v, v, v]);
      expect(r).toBeCloseTo(v, 1);
      expect(Math.abs(r - v)).toBeLessThan(0.02);
      expect(g).toBe(r);
      expect(b).toBe(r);
    }
  });

  it('takes the warm cast out of a warm picture', () => {
    // A grey scene shot under tungsten: red up, blue down.
    const warm = frame(4096, (t) => [Math.min(1, t * 0.9 * 1.1), t * 0.9, t * 0.9 * 0.86]);
    const p = computeAutoParams([warm]);
    expect(p.gain[0]).toBeLessThan(1);
    expect(p.gain[2]).toBeGreaterThan(1);
    const before = [0.6 * 1.1, 0.6, 0.6 * 0.86] as const;
    const after = applyAuto(p, before);
    expect(Math.abs(after[0] - after[2])).toBeLessThan(Math.abs(before[0] - before[2]));
  });

  it('keeps every correction inside its limits, however bad the picture', () => {
    const cases = [
      frame(2048, (t) => [0.02 * t, 0.03 * t, 0.2 * t + 0.01]), // dark and blue
      frame(2048, () => [1, 1, 1]), // blown out
      frame(2048, (t) => [0.5 + 0.02 * t, 0.5, 0.5]), // flat grey
      frame(2048, (t) => [t, 0, 0]), // pure red
    ];
    for (const c of cases) {
      const p = computeAutoParams([c]);
      within(p);
      for (const v of [0, 0.1, 0.5, 0.9, 1]) {
        for (const x of applyAuto(p, [v, v * 0.5, 1 - v])) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('brightens a dark picture and lifts a flat one, mildly', () => {
    const dark = computeAutoParams([frame(2048, (t) => [t * 0.25, t * 0.25, t * 0.25])]);
    expect(dark.gamma).toBeLessThan(1);
    const flat = computeAutoParams([
      frame(2048, (t) => [0.35 + 0.3 * t, 0.35 + 0.3 * t, 0.35 + 0.3 * t]),
    ]);
    expect(flat.contrast).toBeGreaterThan(0);
    expect(flat.contrast).toBeLessThanOrEqual(AUTO_LIMITS.maxContrast);
  });

  it('reads RGBA canvas data the same as RGB', () => {
    const rgb = frame(512, (t) => [t, t * 0.8, t * 0.6]);
    const rgba = new Uint8ClampedArray(512 * 4);
    for (let i = 0; i < 512; i++) {
      rgba[i * 4] = rgb.data[i * 3]!;
      rgba[i * 4 + 1] = rgb.data[i * 3 + 1]!;
      rgba[i * 4 + 2] = rgb.data[i * 3 + 2]!;
      rgba[i * 4 + 3] = 255;
    }
    expect(computeAutoParams([{ data: rgba, channels: 4 }])).toEqual(computeAutoParams([rgb]));
  });

  it('is the identity with nothing to look at', () => {
    expect(isIdentityAuto(computeAutoParams([]))).toBe(true);
  });
});

describe('auto-enhance: vibrance', () => {
  it('saturates a dull colour and spares skin', () => {
    const p = { ...identityAuto(), vibrance: AUTO_LIMITS.vibrance };
    const dull: [number, number, number] = [0.4, 0.5, 0.6];
    const out = applyAuto(p, dull);
    expect(out[2] - out[0]).toBeGreaterThan(dull[2] - dull[0]);
    const skin: [number, number, number] = [0.8, 0.6, 0.5];
    const skinOut = applyAuto(p, skin);
    const gain = (o: number[], i: number[]) => (o[0]! - o[2]!) / (i[0]! - i[2]!);
    const blue: [number, number, number] = [0.5, 0.6, 0.8];
    const blueOut = applyAuto(p, blue);
    expect(gain(skinOut, skin)).toBeLessThan(gain(blueOut, blue));
    expect(applyAuto(p, [0.5, 0.5, 0.5])).toEqual([0.5, 0.5, 0.5]);
  });
});

describe('auto-enhance: stored values', () => {
  it('clamps what it reads back and refuses another version', () => {
    expect(parseAutoParams(null)).toBeNull();
    expect(parseAutoParams([1])).toBeNull();
    expect(parseAutoParams({ v: 99 })).toBeNull();
    const p = parseAutoParams({
      v: 1,
      lo: 0.5,
      hi: 0.1,
      gain: [2, 0, 'x'],
      gamma: 9,
      contrast: -1,
    });
    expect(p).not.toBeNull();
    within(p!);
    expect(p!.gain[2]).toBe(1);
  });

  it('round-trips what it computed', () => {
    const p = computeAutoParams([frame(1024, (t) => [t * 0.7, t * 0.6, t * 0.5])]);
    expect(parseAutoParams(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
});

describe('auto-enhance: the LUT', () => {
  it('is the plain grade LUT without a pass', () => {
    const g = { ...defaultGrade(), exposure: 0.5 };
    expect(studioLut(g, null)).toEqual(gradeToLut(g));
    expect(studioLut(g, identityAuto())).toEqual(gradeToLut(g));
    expect(isIdentityLook(null, null)).toBe(true);
    expect(isIdentityLook(defaultGrade(), identityAuto())).toBe(true);
    expect(isIdentityLook(null, { ...identityAuto(), gamma: 0.9 })).toBe(false);
  });

  it('applies the pass first and the grade on top', () => {
    const auto = { ...identityAuto(), gain: [0.95, 1, 1.05] as [number, number, number] };
    const grade = { ...defaultGrade(), contrast: 0.3 };
    const lut = studioLut(grade, auto, 33);
    const want = studioLut(defaultGrade(), auto, 33);
    // At a grid point the table holds the exact value.
    const at = (l: Float32Array, r: number, g: number, b: number) =>
      sampleLut(l, [r / 32, g / 32, b / 32]);
    const [ar] = at(want, 16, 16, 16);
    const [gr] = at(lut, 16, 16, 16);
    expect(ar).toBeCloseTo(applyAuto(auto, [0.5, 0.5, 0.5])[0], 5);
    // Contrast pushes a value under mid grey further down.
    expect(gr).toBeLessThan(ar);
  });
});
