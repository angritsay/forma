/**
 * Who the «Тренер» tab is about right now — Sergey or Anastasia (design/CHANGELOG.md §23).
 *
 * With the `coach_nastia` flag the tab is a switch by person: two header cards in a snap strip,
 * and everything under them follows the card in view. The owner: «I swipe to the right and the
 * information below the card gets updated… Prices should be the same, the payment links should
 * be the same, the booking links should be different.»
 *
 * Two pure pieces live here so they can be tested without a DOM: which card a strip's scroll
 * position is resting on, and whose slot page the step after payment opens.
 */
import type { BookingOption } from '@content/site/booking';
import { BOOKING } from '@content/site/booking';
import { NASTIA } from '@content/site/nastia';

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

/** The slot pages each person's booking resolves against; injectable for tests. */
export interface ScheduleSources {
  /** `BOOKING.scheduleUrl` — the shared fallback for Sergey's lengths. */
  shared: string;
  /** `NASTIA.scheduleUrl` — hers, one page for both lengths. */
  nastia: string;
}

const SOURCES: ScheduleSources = { shared: BOOKING.scheduleUrl, nastia: NASTIA.scheduleUrl };

/**
 * The slot page the step after payment opens, for this person and this length.
 *
 * Sergey: the length's own page, else the shared one — a Google appointment schedule holds one
 * duration, so his two lengths are two pages. Anastasia: her own page for either length. Empty
 * resolves to `undefined`, which is the «pay, then message, and the time is set for you» path.
 * The payment itself is the same for both and is not decided here.
 */
export function scheduleUrlFor(
  person: CoachPerson,
  option: Pick<BookingOption, 'scheduleUrl'> | undefined,
  sources: ScheduleSources = SOURCES,
): string | undefined {
  if (person === 'nastia') return sources.nastia || undefined;
  return option?.scheduleUrl || sources.shared || undefined;
}
