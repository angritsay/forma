/**
 * The three custom properties a coloured section sets, from the one hex it is known by.
 *
 * A tile is any fill a section wears — a course's colour from content, the club's, the coach's. CSS
 * cannot derive what goes *on* that fill from the hex alone — `color-contrast()` is not shipped — so
 * whoever paints a tile sets all three properties, and `.hero-art`, `text-tile-fg` and
 * `text-course-accent` read them. Deciding it here, once, is what keeps a light cover from ever
 * carrying white text or a dark one black.
 *
 *   <div className="hero-art" style={courseTileVars(course.tile)} />
 *
 * ## Ink by measured contrast, not by lightness
 *
 * This used to be a cutoff: luminance above 0.35 took black ink, below took white. It worked while
 * every colour was pale. The third palette (global.css header, design/CHANGELOG.md §14) is not:
 * Portland orange measures 0.286 and bleu ciel 0.214, so the cutoff gave both white ink — 3.13:1 on
 * the orange, a failed AA on the beginners' own course. Now both inks are measured against the fill
 * and the better one wins. The same rule makes an unmigrated hex from the database (the admin's
 * course builder stores its own `tile`) render correctly, whatever it is.
 *
 * The light ink is #111111 rather than the ground itself. On the charcoal of §14 that was a matter
 * of contrast (charcoal on bleu ciel 4.37, a fail; #111111 4.75, a pass); the graphite ground would
 * pass too (4.71), and the ink stays its own token so it does not move every time the ground does.
 */
import type { CSSProperties } from 'react';

/**
 * The app's ground — `--bg` in global.css. Graphite #121212 (design/CHANGELOG.md §16); the ground
 * was charcoal #1a1a1a before. `tile.test.ts` holds the two in step; `ground-literals.test.ts`
 * hunts the old value everywhere else.
 */
export const APP_BG = '#121212';
/** `--ink` / `--tile-fg`: type on a light fill. */
export const INK_ON_LIGHT = '#111111';
/** `--text` / `--tile-fg-dark`: type on a dark fill. */
export const INK_ON_DARK = '#f6f6f7';

/**
 * The club's solid colour.
 *
 * The club *paints* with the crossroads gradient — owner: «давай градиент для клуба сделаем, всё
 * остальное как в стиле А» — on the streak ring, the day dots and the glow behind its screen. A
 * gradient cannot be a tile, though: the ink, the type accent and the `-ink` variant all need one
 * colour, and this is it. Electric blue, the gradient's deep end.
 *
 * White ink on it (7.71); never type on the ground (2.43), so its type accent is the light blue —
 * see {@link tileAccent}. It must stay in step with `--course-marathon` in global.css;
 * `tile.test.ts` holds that.
 */
export const GAME_TILE = '#2038e2';

/**
 * The coach tab's colour: bleu ciel.
 *
 * «Тренер» has no programme behind it, so no `course.tile` to read. It wears ciel on its section
 * tag and the pay button's fill. Ink on it is #111111 (4.75). As type on the graphite ground it
 * measures 4.71 — legal small type — so {@link tileAccent} returns ciel itself and the tab's
 * accent is its own colour. On the charcoal ground it was 4.37, large type only, and the accent
 * was the light blue; `tile.test.ts` pins the new floor (≥ 4.5): if the ground or the blue moves
 * back under it, BookScreen's small ciel type must be looked at again.
 */
export const COACH_TILE = '#007bff';

/**
 * Fills too dark to be read as type on graphite, and what speaks for them instead.
 *
 * Electric blue hands over to the brand's light blue — the one colour of the palette that belongs
 * on a blue ground as much as on graphite («поверх тёмно-синего или поверх чёрного»). Bleu ciel
 * was here too while the ground was charcoal; on graphite it reads on its own.
 */
const DARK_TILE_ACCENT: Readonly<Record<string, string>> = {
  '#2038e2': '#afe9fd',
};

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

/** WCAG contrast ratio between two opaque colours, 1–21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink for text and figures drawn on the given fill: whichever of the two inks reads better. */
export function tileInk(hex: string): string {
  return contrast(INK_ON_LIGHT, hex) >= contrast(INK_ON_DARK, hex) ? INK_ON_LIGHT : INK_ON_DARK;
}

/** True for a fill that takes the dark ink. Derived from {@link tileInk}, kept for callers. */
export function isLightTile(hex: string): boolean {
  return tileInk(hex) === INK_ON_LIGHT;
}

/**
 * The section's colour *as type* on the graphite ground: the fill itself when it reads (≥ 4.5),
 * the light blue when it is the electric blue, and `undefined` for a neutral dark surface — the
 * caller then falls back to plain white text.
 */
export function tileAccent(hex: string): string | undefined {
  if (contrast(hex, APP_BG) >= 4.5) return hex;
  return DARK_TILE_ACCENT[hex.toLowerCase()];
}

/**
 * Inline style carrying `--course-tile`, `--course-tile-fg` and `--course-accent` for React.
 * `undefined` in, `undefined` out, so it can be spread onto an element that may have no course.
 */
export function courseTileVars(tile: string | undefined): CSSProperties | undefined {
  if (!tile) return undefined;
  return {
    '--course-tile': tile,
    '--course-tile-fg': tileInk(tile),
    '--course-accent': tileAccent(tile) ?? 'var(--text)',
  } as CSSProperties;
}

/** The same three properties as a `style` attribute string, for .astro templates. */
export function courseTileStyle(tile: string): string {
  return `--course-tile:${tile};--course-tile-fg:${tileInk(tile)};--course-accent:${tileAccent(tile) ?? 'var(--text)'}`;
}
