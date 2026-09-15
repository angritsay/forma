import { describe, expect, it } from 'vitest';
import { clipFit } from './model';

/*
 * The coach shoots both ways round, and the two shapes want opposite treatment. Getting the
 * comparison backwards is silent — every clip still renders, just the wrong one gets cropped —
 * so the direction is pinned here with the real stage sizes and the real footage shapes.
 *
 * Every case below is checked for the one thing the rule promises: the clip fills the width.
 */
describe('clipFit', () => {
  /** The stage above the glass panel at 390×844 — see the inset in PlayerScreen. */
  const PHONE = [390, 704] as const;
  /** The stage beside the panel from `md`. */
  const LAPTOP = [1100, 900] as const;

  /** What a given fit actually paints, so a test can assert the promise and not the class name. */
  const painted = (vw: number, vh: number, bw: number, bh: number) => {
    const fit = clipFit(vw, vh, bw, bh);
    const ar = vw / vh;
    const wide = ar >= bw / bh;
    const byWidth = fit === 'contain' ? wide : !wide;
    return byWidth ? { fit, w: bw, h: bw / ar } : { fit, w: bh * ar, h: bh };
  };

  it('fills the width of a phone stage with a 9:16 clip, uncropped', () => {
    // The screenshot that started this: contain used to fit it by height and leave 76px of black
    // down each side. The stage is tall enough now that contain fits it by width instead.
    const r = painted(1080, 1920, ...PHONE);
    expect(r.fit).toBe('contain');
    expect(Math.round(r.w)).toBe(390);
    expect(Math.round(r.h)).toBe(693); // shorter than the stage: letterboxed, never cropped
  });

  it('letterboxes a landscape clip rather than cropping the movement out of it', () => {
    // 16:9 covered into a phone-shaped hole keeps a vertical strip through the middle.
    const r = painted(1920, 1080, ...PHONE);
    expect(r.fit).toBe('contain');
    expect(Math.round(r.w)).toBe(390);
    expect(clipFit(1920, 1080, ...LAPTOP)).toBe('contain');
  });

  it('covers footage taller than the stage, because the alternative is side bars', () => {
    // 9:20 — taller than the 390×704 stage. contain would paint 317px wide between two bars.
    const r = painted(1080, 2400, ...PHONE);
    expect(r.fit).toBe('cover');
    expect(Math.round(r.w)).toBe(390);
  });

  it('never covers on a stage wider than it is tall', () => {
    // From `md` the panel is a column on the right and the stage is landscape. Filling *that*
    // width with a portrait clip would crop half the movement away to solve a problem a laptop
    // does not have, so every shape is contained there — including the one a phone would cover.
    expect(clipFit(1080, 2400, ...LAPTOP)).toBe('contain');
    expect(clipFit(1080, 1920, ...LAPTOP)).toBe('contain');
    expect(clipFit(1920, 1080, ...LAPTOP)).toBe('contain');
  });

  it('contains a clip that matches its stage exactly, and never crops on a tie', () => {
    expect(clipFit(390, 704, ...PHONE)).toBe('contain');
  });

  it('falls back to contain while the metadata is still missing', () => {
    expect(clipFit(0, 0, ...PHONE)).toBe('contain');
    expect(clipFit(1080, 1920, 0, 0)).toBe('contain');
  });
});
