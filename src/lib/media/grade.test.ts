import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LUT_SIZE,
  GRADE_LIMITS,
  GRADE_SLIDERS,
  LUT_GLSL,
  LUT_TEXTURE,
  MAX_CURVE_POINTS,
  applyGrade,
  channelFunctions,
  clampCurve,
  clampGrade,
  curveFunction,
  defaultGrade,
  gradeToLut,
  isIdentityGrade,
  lutSize,
  lutTexCoord,
  lutToCube,
  sampleLut,
  type GradeParams,
} from './grade';
import { clampCrop, ffmpegCrop, isFullFrame, MIN_CROP } from './crop';

const grade = (patch: Partial<GradeParams>): GradeParams => ({ ...defaultGrade(), ...patch });

/** 0…1 in `n` even steps, both ends included. */
const ramp = (n = 257): number[] => Array.from({ length: n }, (_, i) => i / (n - 1));

const nonDecreasing = (f: (x: number) => number): boolean => {
  let prev = -Infinity;
  for (const x of ramp(1025)) {
    const y = f(x);
    if (y < prev - 1e-12) return false;
    prev = y;
  }
  return true;
};

describe('defaults and clamp', () => {
  it('the default grade is the identity', () => {
    expect(isIdentityGrade(defaultGrade())).toBe(true);
    expect(clampGrade(undefined)).toEqual(defaultGrade());
    expect(clampGrade(null)).toEqual(defaultGrade());
    expect(clampGrade('nope')).toEqual(defaultGrade());
    expect(clampGrade([])).toEqual(defaultGrade());
  });

  it('clamps every slider to its limits and reads junk as the default', () => {
    const g = clampGrade({
      exposure: 99,
      contrast: -5,
      brightness: Number.NaN,
      whites: '0.5',
      blacks: Infinity,
    });
    expect(g.exposure).toBe(GRADE_LIMITS.exposure.max);
    expect(g.contrast).toBe(GRADE_LIMITS.contrast.min);
    expect(g.brightness).toBe(0);
    expect(g.whites).toBe(0);
    expect(g.blacks).toBe(0);
  });

  it('keeps values inside the limits untouched', () => {
    const p = grade({ exposure: 0.7, contrast: -0.3, brightness: 0.2, whites: 0.4, blacks: -0.1 });
    expect(clampGrade(p)).toEqual(p);
  });

  it('cleans curves: drops junk, clamps, sorts, merges duplicate x, caps the count', () => {
    expect(clampCurve('x')).toEqual([]);
    expect(
      clampCurve([[0.5, 0.6], [2, -1], ['a', 0], [0.2], null, [0.1, 0.05], [0.5, 0.7]]),
    ).toEqual([
      [0.1, 0.05],
      [0.5, 0.7],
      [1, 0],
    ]);
    const many = Array.from({ length: 40 }, (_, i) => [i / 39, i / 39] as const);
    const capped = clampCurve(many);
    expect(capped).toHaveLength(MAX_CURVE_POINTS);
    expect(capped[0]).toEqual([0, 0]);
    expect(capped[capped.length - 1]).toEqual([1, 1]);
  });

  it('is identity when curves only hold points on the diagonal', () => {
    expect(
      isIdentityGrade(
        grade({
          curves: {
            master: [
              [0.25, 0.25],
              [0.75, 0.75],
            ],
            r: [],
            g: [],
            b: [],
          },
        }),
      ),
    ).toBe(true);
    expect(isIdentityGrade(grade({ exposure: 0.1 }))).toBe(false);
  });

  it('survives a JSON round trip unchanged', () => {
    const p = grade({
      exposure: 1,
      curves: { master: [[0.3, 0.4]], r: [], g: [[0.6, 0.5]], b: [] },
    });
    expect(clampGrade(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
});

describe('curves', () => {
  it('passes through its points and the implied ends', () => {
    const f = curveFunction([
      [0.25, 0.4],
      [0.75, 0.8],
    ]);
    expect(f(0)).toBeCloseTo(0, 12);
    expect(f(0.25)).toBeCloseTo(0.4, 12);
    expect(f(0.75)).toBeCloseTo(0.8, 12);
    expect(f(1)).toBeCloseTo(1, 12);
  });

  it('keeps an explicit end point instead of adding (0,0)/(1,1)', () => {
    const f = curveFunction([
      [0, 0.2],
      [1, 0.9],
    ]);
    expect(f(0)).toBeCloseTo(0.2, 12);
    expect(f(1)).toBeCloseTo(0.9, 12);
    expect(f(0.5)).toBeCloseTo(0.55, 12);
  });

  it('never dips between rising points, however steep', () => {
    const cases = [
      [
        [0.1, 0.0],
        [0.2, 0.9],
        [0.3, 0.91],
        [0.9, 0.95],
      ],
      [
        [0.4, 0.05],
        [0.45, 0.95],
      ],
      [
        [0.2, 0.2],
        [0.21, 0.21],
        [0.5, 0.9],
        [0.51, 0.9],
      ],
    ] as const;
    for (const pts of cases) expect(nonDecreasing(curveFunction(clampCurve(pts)))).toBe(true);
  });

  it('a flat run stays flat (no overshoot)', () => {
    const f = curveFunction([
      [0.3, 0.5],
      [0.7, 0.5],
    ]);
    for (const x of ramp(101).filter((x) => x >= 0.3 && x <= 0.7))
      expect(f(x)).toBeCloseTo(0.5, 12);
  });
});

describe('the grade', () => {
  it('every slider, at either end, gives a non-decreasing curve inside 0…1', () => {
    for (const k of GRADE_SLIDERS) {
      for (const v of [GRADE_LIMITS[k].min, GRADE_LIMITS[k].max, 0.37]) {
        const [fr] = channelFunctions(grade({ [k]: v }));
        expect(nonDecreasing(fr), `${k}=${v}`).toBe(true);
        for (const x of ramp(65)) {
          const y = fr(x);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('each slider moves mid grey the way its name says', () => {
    const mid = (p: Partial<GradeParams>) => applyGrade(grade(p), [0.5, 0.5, 0.5])[0];
    expect(mid({ exposure: 1 })).toBeGreaterThan(0.5);
    expect(mid({ exposure: -1 })).toBeLessThan(0.5);
    expect(mid({ brightness: 0.5 })).toBeGreaterThan(0.5);
    expect(mid({ brightness: -0.5 })).toBeLessThan(0.5);
    expect(mid({ blacks: 1 })).toBeGreaterThan(0.5);
    expect(mid({ whites: 1 })).toBeGreaterThan(0.5);
    expect(mid({ contrast: 1 })).toBeCloseTo(0.5, 12);
    // Contrast spreads values away from grey; negative pulls them in.
    const dark = (p: Partial<GradeParams>) => applyGrade(grade(p), [0.3, 0.3, 0.3])[0];
    expect(dark({ contrast: 0.5 })).toBeLessThan(0.3);
    expect(dark({ contrast: -0.5 })).toBeGreaterThan(0.3);
  });

  it('exposure +1 doubles linear light', () => {
    const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const out = applyGrade(grade({ exposure: 1 }), [0.3, 0.3, 0.3])[0];
    expect(toLin(out) / toLin(0.3)).toBeCloseTo(2, 6);
  });

  it('a channel curve touches only its own channel', () => {
    const p = grade({ curves: { master: [], r: [[0.5, 0.8]], g: [], b: [] } });
    const [r, g, b] = applyGrade(p, [0.5, 0.5, 0.5]);
    expect(r).toBeCloseTo(0.8, 12);
    expect(g).toBe(0.5);
    expect(b).toBe(0.5);
  });

  it('the master curve runs before the channel curve', () => {
    const p = grade({ curves: { master: [[0.5, 0.25]], r: [[0.25, 0.75]], g: [], b: [] } });
    expect(applyGrade(p, [0.5, 0.5, 0.5])[0]).toBeCloseTo(0.75, 12);
    expect(applyGrade(p, [0.5, 0.5, 0.5])[1]).toBeCloseTo(0.25, 12);
  });
});

describe('gradeToLut', () => {
  it('identity params give an exact identity LUT', () => {
    const n = DEFAULT_LUT_SIZE;
    const lut = gradeToLut(defaultGrade());
    expect(lut).toHaveLength(n * n * n * 3);
    for (let b = 0; b < n; b += 4) {
      for (let g = 0; g < n; g += 3) {
        for (let r = 0; r < n; r++) {
          const o = 3 * (r + n * (g + n * b));
          expect(lut[o]).toBe(Math.fround(r / (n - 1)));
          expect(lut[o + 1]).toBe(Math.fround(g / (n - 1)));
          expect(lut[o + 2]).toBe(Math.fround(b / (n - 1)));
        }
      }
    }
  });

  it('lays red out fastest, then green, then blue', () => {
    const lut = gradeToLut(defaultGrade(), 2);
    expect(Array.from(lut)).toEqual([
      0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
    ]);
  });

  it('every entry is the exact grade of its grid colour', () => {
    const p = grade({
      exposure: 0.8,
      contrast: 0.4,
      brightness: -0.2,
      whites: 0.3,
      blacks: -0.4,
      curves: { master: [[0.4, 0.5]], r: [], g: [[0.6, 0.5]], b: [[0.3, 0.4]] },
    });
    const n = 9;
    const lut = gradeToLut(p, n);
    for (const [r, g, b] of [
      [0, 0, 0],
      [8, 8, 8],
      [3, 5, 7],
      [6, 1, 2],
    ] as const) {
      const want = applyGrade(p, [r / (n - 1), g / (n - 1), b / (n - 1)]);
      const o = 3 * (r + n * (g + n * b));
      for (let ch = 0; ch < 3; ch++) expect(lut[o + ch]).toBeCloseTo(want[ch]!, 6);
    }
  });

  it('is monotonic along each axis for rising curves and any sliders', () => {
    const p = grade({
      exposure: -1.2,
      contrast: 0.9,
      curves: {
        master: [
          [0.2, 0.1],
          [0.8, 0.95],
        ],
        r: [[0.5, 0.6]],
        g: [],
        b: [[0.5, 0.4]],
      },
    });
    const n = 17;
    const lut = gradeToLut(p, n);
    for (let i = 1; i < n; i++) {
      expect(lut[3 * i]).toBeGreaterThanOrEqual(lut[3 * (i - 1)]!);
      expect(lut[3 * n * i + 1]).toBeGreaterThanOrEqual(lut[3 * n * (i - 1) + 1]!);
      expect(lut[3 * n * n * i + 2]).toBeGreaterThanOrEqual(lut[3 * n * n * (i - 1) + 2]!);
    }
  });

  it('clamps the size and knows its own size back', () => {
    expect(lutSize(gradeToLut(defaultGrade(), 1))).toBe(2);
    expect(lutSize(gradeToLut(defaultGrade(), 999))).toBe(65);
    expect(lutSize(gradeToLut(defaultGrade()))).toBe(33);
    expect(() => lutSize(new Float32Array(10))).toThrow('lut_shape');
  });

  it('trilinear sampling matches the exact grade closely between grid points', () => {
    const p = grade({ exposure: 0.6, contrast: 0.5, brightness: 0.2 });
    const lut = gradeToLut(p);
    let worst = 0;
    for (const v of ramp(97)) {
      const want = applyGrade(p, [v, 1 - v, v * v]);
      const got = sampleLut(lut, [v, 1 - v, v * v]);
      for (let ch = 0; ch < 3; ch++) worst = Math.max(worst, Math.abs(want[ch]! - got[ch]!));
    }
    // Within three 8-bit steps at worst, which is near black where the brightness gamma is
    // steepest; the preview and ffmpeg both interpolate the same grid, so they share this error.
    expect(worst).toBeLessThan(3 / 255);
  });

  it('sampling an identity LUT returns the colour', () => {
    const lut = gradeToLut(defaultGrade(), 5);
    const out = sampleLut(lut, [0.13, 0.5, 0.91]);
    expect(out[0]).toBeCloseTo(0.13, 6);
    expect(out[1]).toBeCloseTo(0.5, 6);
    expect(out[2]).toBeCloseTo(0.91, 6);
  });
});

describe('lutToCube', () => {
  it('writes the header and one line per entry, red fastest', () => {
    const text = lutToCube(gradeToLut(defaultGrade(), 2), 'a "b"\nc');
    const lines = text.trimEnd().split('\n');
    expect(lines.slice(0, 4)).toEqual([
      'TITLE "a bc"',
      'LUT_3D_SIZE 2',
      'DOMAIN_MIN 0.0 0.0 0.0',
      'DOMAIN_MAX 1.0 1.0 1.0',
    ]);
    expect(lines.slice(4)).toEqual([
      '0.000000 0.000000 0.000000',
      '1.000000 0.000000 0.000000',
      '0.000000 1.000000 0.000000',
      '1.000000 1.000000 0.000000',
      '0.000000 0.000000 1.000000',
      '1.000000 0.000000 1.000000',
      '0.000000 1.000000 1.000000',
      '1.000000 1.000000 1.000000',
    ]);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('has size³ data lines for the default size', () => {
    const lines = lutToCube(gradeToLut(grade({ exposure: 1 })))
      .trimEnd()
      .split('\n');
    expect(lines).toHaveLength(4 + 33 ** 3);
    expect(lines[4 + 33 ** 3 - 1]).toBe('1.000000 1.000000 1.000000');
  });
});

describe('WebGL description', () => {
  it('puts colour 0 and 1 on the centres of the edge texels', () => {
    expect(lutTexCoord(0, 33)).toBeCloseTo(0.5 / 33, 12);
    expect(lutTexCoord(1, 33)).toBeCloseTo(1 - 0.5 / 33, 12);
    expect(lutTexCoord(2, 33)).toBeCloseTo(1 - 0.5 / 33, 12);
  });

  it('describes a filterable 3D texture and a lookup with the same coordinates', () => {
    expect(LUT_TEXTURE).toMatchObject({ target: 'TEXTURE_3D', internalFormat: 'RGB16F' });
    expect(LUT_GLSL).toContain('sampler3D');
    expect(LUT_GLSL).toContain('(u_lutSize - 1.0) / u_lutSize) + 0.5 / u_lutSize');
  });
});

describe('crop', () => {
  it('reads junk and the whole frame as null', () => {
    expect(clampCrop(null)).toBeNull();
    expect(clampCrop({ x: 0, y: 0, w: 1 })).toBeNull();
    expect(clampCrop({ x: 0, y: 0, w: 1, h: 1 })).toBeNull();
    expect(clampCrop({ x: -1, y: -1, w: 3, h: 3 })).toBeNull();
    expect(clampCrop({ x: '0', y: 0, w: 0.5, h: 0.5 })).toBeNull();
  });

  it('keeps the frame inside the picture and not smaller than the minimum', () => {
    expect(clampCrop({ x: 0.8, y: 0.9, w: 0.5, h: 0.5 })).toEqual({
      x: 0.5,
      y: 0.5,
      w: 0.5,
      h: 0.5,
    });
    expect(clampCrop({ x: 0.2, y: 0.2, w: 0, h: 0.01 })).toEqual({
      x: 0.2,
      y: 0.2,
      w: MIN_CROP,
      h: MIN_CROP,
    });
    expect(isFullFrame({ x: 0, y: 0, w: 1, h: 1 })).toBe(true);
  });

  it('writes an ffmpeg crop with even sizes from the input dimensions', () => {
    expect(ffmpegCrop({ x: 0.1, y: 0.2, w: 0.5, h: 0.25 })).toBe(
      "crop=w='trunc(iw*0.500000/2)*2':h='trunc(ih*0.250000/2)*2':x='trunc(iw*0.100000)':y='trunc(ih*0.200000)'",
    );
  });
});
