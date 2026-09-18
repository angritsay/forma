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

/**
 * The club's own colour.
 *
 * Colour in this product says which part of it you are in — a course wears the programme colour
 * content gives it, and the club wears orange everywhere it appears: the deck card, the row on
 * Home, the ring beside today's task. A marathon has no course tile of its own to read it from,
 * so this is where it lives, once.
 *
 * It must stay in step with `--course-marathon` in global.css, which is the same hex for the CSS
 * side of the same idea.
 *
 * **This value used to sit on a cliff, and no longer does.** The orange before it, `#ff7a1a`, had a
 * luminance of 0.353 against the 0.35 in {@link isLightTile} — three thousandths, one careless
 * character from flipping the club's cover from black type on orange to white type on a darker
 * orange, which is a different screen rather than a different shade. The owner's mockup samples to
 * `#F8A050`, whose luminance is 0.457: **0.107 of margin**, thirty-five times the old one. The
 * change moves the colour away from the cliff, not toward it, and black ink on it clears 9.2:1.
 *
 * The cliff is still there, so anyone nudging this hue toward red should check the luminance first
 * and expect the flip, and anyone changing the 0.35 should know it moves this screen. `tile.test.ts`
 * holds both promises — the ink and the CSS token — so neither can be broken quietly.
 */
export const GAME_TILE = '#f8a050';

/**
 * The coach tab's own colour.
 *
 * Same idea as {@link GAME_TILE}, same reason it has to live somewhere: «Тренер» is a screen
 * without a programme behind it, so there is no `course.tile` for it to read, and the brandbook's
 * «один экран — один цвет» still applies to it. Cyan is the courses', orange is the club's; blue
 * (`--course-yoga` in global.css, the third programme colour and the one nothing is using) is what
 * is left, and the three tabs then read as three colours rather than as two and a grey one.
 *
 * It paints the two pills at the top of the tab and nothing else — which is the whole of the
 * owner's «пилюли сделай цветными». Luminance 0.577, comfortably on the light side of the 0.35
 * cliff in {@link isLightTile}, and as type on the app's dark ground it clears 11.2:1.
 *
 * A course *can* be given this same hex in the admin's tile picker, and if one ever is, the two
 * never share a screen: a course wears it on the course screen, the coach wears it here.
 */
export const COACH_TILE = '#a8c8ff';

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
