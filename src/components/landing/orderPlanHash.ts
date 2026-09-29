/**
 * The plan a `#order-<plan id>` link picks in `OrderForm`.
 *
 * `/subscribe/`'s tickets (`club/ClubPlans.astro`) link to `#order-<id>`, and the page anchors
 * each of those ids at the form. The hash only ever selects a plan the form already offers:
 * anything else — a bare `#order`, an unknown id, another hash — picks nothing, and the form keeps
 * whatever plan it has.
 */
export function planFromOrderHash<P extends { id: string }>(
  hash: string | null | undefined,
  plans: readonly P[],
): P | undefined {
  const id = /^#order-([a-z]+)$/.exec(hash ?? '')?.[1];
  return id === undefined ? undefined : plans.find((p) => p.id === id);
}
