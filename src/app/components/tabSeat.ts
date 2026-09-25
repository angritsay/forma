/**
 * The colour of the seat under the current tab, per tab.
 *
 * The owner: «сделай вкладки по цветам, а клуб градиентом». Until this, every seat was the hero
 * field's electric blue with a white word. Now each section wears its own colour (the owner chose
 * the set: «Курсы» neon, «Тренер» blue, «Клуб» the gradient), and the word on the seat takes the
 * ink its fill needs:
 *
 *   - «Курсы» `/` — neon, ink 17.3. Neon is the tab's identity here, the way it is on a coach card
 *     (§17); the one-neon-main-button rule is about buttons.
 *   - «Клуб» `/marathon` — the warm gradient `.bg-warm` under ink: ≥ 6.04 on every stop. The club
 *     has no neon anywhere (`club-no-neon.test.ts`), and its seat keeps that rule.
 *   - «Тренер» `/book` — the deep ciel of the coach's card, #0066e0, white 5.26.
 *   - «Админка» `/admin` — a neutral surface: a tool, not a section of the product.
 *
 * Anything not listed keeps the old electric blue. The figures are pinned in `tabSeat.test.ts`.
 */
export interface TabSeat {
  /** The fill of the sliding seat. */
  seat: string;
  /** The active word's colour on that fill. */
  ink: string;
}

export const DEFAULT_SEAT: TabSeat = { seat: 'bg-field', ink: 'text-on-field' };

export const TAB_SEAT: Readonly<Record<string, TabSeat>> = {
  '/': { seat: 'bg-action', ink: 'text-on-action' },
  '/marathon': { seat: 'bg-warm', ink: 'text-ink' },
  '/book': { seat: 'bg-ciel-deep', ink: 'text-paper' },
  '/admin': { seat: 'bg-surface-3', ink: 'text-text' },
};

export function tabSeat(to: string | undefined): TabSeat {
  return (to !== undefined ? TAB_SEAT[to] : undefined) ?? DEFAULT_SEAT;
}
