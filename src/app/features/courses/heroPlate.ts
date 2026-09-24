/**
 * The class choices of a course card on «Курсы», kept out of the component so they can be tested
 * without a renderer (design/CHANGELOG.md §17: courses are photograph + glass).
 *
 * Two shapes of the same card:
 *
 *   - the **hero** — the first card of the deck, the course you are walking — is taller
 *     (347×400 on a 375 column) so a plate of glass pinned to its bottom fits the three pieces
 *     every card on the screen has (§18): the pill, a title on two lines, and the screen's one
 *     neon button — with half the photograph left untouched above it. Its scrim darkens from the
 *     bottom (`.photo-scrim`), under the plate, not over the sky;
 *   - every **other** card is very nearly square (347×345), the mockup's shape, with the same
 *     three pieces laid on the picture — the pill and the title in the top third under the scrim
 *     there (`.photo-scrim-top`), the button at the bottom.
 */
export type CourseCardFrame = {
  /** The article's aspect and corner. */
  article: string;
  /** The overlay that keeps the type legal on the picture. */
  scrim: string;
};

export function courseCardFrame(hero: boolean): CourseCardFrame {
  return hero
    ? { article: 'aspect-[347/400] rounded-card', scrim: 'photo-scrim' }
    : { article: 'aspect-[347/345] rounded-tile', scrim: 'photo-scrim-top' };
}

/**
 * The hero's plate: the ordinary `.glass-card` for the blur and the hairline, retinted from the
 * ground and stepped to the level-3 alphas by `.glass-card-on-art` (global.css), because the
 * thing behind it is a picture with a white sky in it. Measured there: white 7.5 and the
 * light-blue key word 5.7 at the sheer end over pure white; the level-2 alphas the spec first
 * named would have put the key word at 4.4.
 */
export function heroPlateClasses(): string {
  return 'glass-card glass-card-on-art';
}
