/**
 * Which bright field a coach workout card wears (design/CHANGELOG.md §17 — owner: «для тренировок
 * от тренера — яркие цвета»).
 *
 * The cards the coach assigns are solid fields rather than glass plates, and they cycle by
 * position in the carousel: **ciel first** — the coach's colour — then orange, then neon, then
 * ciel again. The second and third colours exist only so that several cards in one strip are
 * told apart at a glance while they are being swiped; a single card is always ciel, because with
 * nothing to tell it apart from, the coach's own colour is the only one that says anything.
 *
 * Ink is #111111 on all three — 4.75 on ciel, 6.04 on orange, 17.3 on neon (`tileInk()` picks the
 * same; `coachCardFill.test.ts` measures it). The whole card is ink, the meta line included: ink
 * at 80% over ciel composites to 3.9 and fails small type, so the hierarchy on these cards is
 * size and weight, never opacity.
 *
 * **Neon on a coach card is identity, not «сделай это сейчас».** The semantic map's rule that neon
 * is the one main action of a screen is about buttons and markers and still stands; a third card
 * in the strip wearing neon does not make it the screen's button, any more than the dumbbells
 * course's neon tile does.
 */
import { COACH_CARD_FILLS } from '@/lib/ui/semantic';

export type CoachCardFill = (typeof COACH_CARD_FILLS)[number];

/** The fill for the card at `index` in the carousel; a lone card (index 0) is ciel. */
export function coachCardFill(index: number): CoachCardFill {
  const i = Number.isFinite(index) && index > 0 ? Math.floor(index) : 0;
  return COACH_CARD_FILLS[i % COACH_CARD_FILLS.length]!;
}
