/**
 * How the grade sliders step and read. Ranges come from `GRADE_LIMITS` in `src/lib/media/grade.ts`;
 * only the step and the label are the screen's.
 */
import { GRADE_LIMITS, type GradeSlider } from '@/lib/media/grade';

/** Exposure is in stops, the rest −1…1: a hundredth of either is below what an eye can tell. */
export const SLIDER_STEP: Readonly<Record<GradeSlider, number>> = {
  exposure: 0.05,
  contrast: 0.01,
  brightness: 0.01,
  whites: 0.01,
  blacks: 0.01,
};

/**
 * The value as it is written next to the slider: signed, zero as a plain «0». Exposure keeps two
 * decimals and «EV» (stops, as cameras write it); the others read as −100…+100.
 */
export function formatSlider(key: GradeSlider, value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  if (key === 'exposure') {
    const r = Math.round(v * 100) / 100;
    if (r === 0) return '0 EV';
    return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(2)} EV`;
  }
  const n = Math.round(v * 100);
  if (n === 0) return '0';
  return `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
}

/** A slider value snapped to its step and range, so float noise never reads as a change. */
export function snapSlider(key: GradeSlider, value: number): number {
  const { min, max } = GRADE_LIMITS[key];
  const step = SLIDER_STEP[key];
  const v = Number.isFinite(value) ? value : 0;
  const snapped = Math.round(v / step) * step;
  // Round off the binary tail (0.1 + 0.2) so stored values are the ones on the label.
  const clean = Math.round(snapped * 1e6) / 1e6;
  return Math.min(max, Math.max(min, clean === 0 ? 0 : clean));
}
