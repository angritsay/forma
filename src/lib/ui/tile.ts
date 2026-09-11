/**
 * The two custom properties a course tile sets, from the one hex content stores.
 *
 * A tile is either a programme colour (yellow, blue, orange — light, so the ink on it is black)
 * or a neutral dark surface (so the ink is light). CSS cannot derive that from the hex on its
 * own — `color-contrast()` is not shipped — so whoever paints a tile sets both properties, and
 * `.hero-art` in global.css reads them. Deciding it here, once, is what keeps a yellow cover from
 * ever carrying white text or a dark one black.
 *
 *   <div className="hero-art" style={courseTileVars(course.tile)} />
 */
import type { CSSProperties } from 'react';

const INK_ON_LIGHT = '#0f0f11';
const INK_ON_DARK = '#f6f6f7';

/** Relative luminance per WCAG; 0 is black, 1 is white. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const channel = (i: number) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/** True for a tile light enough that black ink reads on it (the programme colours). */
export function isLightTile(hex: string): boolean {
  return luminance(hex) > 0.35;
}

/** Ink colour for text and figures drawn on the given tile. */
export function tileInk(hex: string): string {
  return isLightTile(hex) ? INK_ON_LIGHT : INK_ON_DARK;
}

/**
 * Inline style carrying `--course-tile` and `--course-tile-fg` for React. `undefined` in,
 * `undefined` out, so it can be spread straight onto an element that may have no course.
 */
export function courseTileVars(tile: string | undefined): CSSProperties | undefined {
  if (!tile) return undefined;
  return { '--course-tile': tile, '--course-tile-fg': tileInk(tile) } as CSSProperties;
}

/** The same two properties as a `style` attribute string, for .astro templates. */
export function courseTileStyle(tile: string): string {
  return `--course-tile:${tile};--course-tile-fg:${tileInk(tile)}`;
}
