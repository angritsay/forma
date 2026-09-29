/**
 * Who the «Тренер» tab is about right now — Sergey or Anastasia (design/CHANGELOG.md §23).
 *
 * With the `coach_nastia` flag the tab is a switch by person: two header cards in a snap strip,
 * and everything under them follows the card in view. The owner: «I swipe to the right and the
 * information below the card gets updated… Prices should be the same, the payment links should
 * be the same, the booking links should be different.»
 *
 * The pure piece lives here so it can be tested without a DOM: which card a strip's scroll
 * position is resting on. Whose calendar a booking goes to is the `coach_bookings.coach_id` the
 * picker holds a slot with (0055), not a link resolved here.
 */
export type CoachPerson = 'sergey' | 'nastia';

/** In strip order: his card first, hers second. */
export const COACH_PEOPLE: readonly CoachPerson[] = ['sergey', 'nastia'];

export interface StripScroll {
  /** The scroller's `scrollLeft`. */
  scrollLeft: number;
  /** `scrollWidth - clientWidth`: how far it can scroll at all. */
  maxScroll: number;
  /** The distance from one card's left edge to the next one's (card width + gap). */
  step: number;
  /** How many cards the strip holds. */
  count: number;
}

/**
 * The index of the card the strip is resting on, or `null` when the position says nothing.
 *
 * `null` when the strip cannot scroll (a wide screen shows both cards whole) — then only a tap
 * picks the person. At the far end the last card is the answer even when the strip stops short of
 * a full step, which it does: the last card is snapped to the start edge only as far as the
 * content allows, so rounding `scrollLeft / step` alone would never reach it on a wide phone.
 */
export function activeFromScroll({
  scrollLeft,
  maxScroll,
  step,
  count,
}: StripScroll): number | null {
  if (count <= 0 || maxScroll <= 1 || step <= 0) return null;
  if (scrollLeft >= maxScroll - 2) return count - 1;
  const i = Math.round(scrollLeft / step);
  return Math.min(count - 1, Math.max(0, i));
}
