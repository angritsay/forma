/**
 * What joining the club costs, and where the person goes to do it.
 *
 * The club is not a product of its own. `GAME_REQUIRES_SUBSCRIPTION` (content/site/plans.ts) says
 * it belongs to the subscription, so the figure on the join button is the subscription's own
 * monthly price, read from `PLANS` and never written down twice. Change the plan and the button
 * changes with it.
 *
 * **The owner has not decided whether that stays true.** The alternative on the table is the club
 * as a separate, cheaper product — the annual plan's note already quotes ≈ 666 ₽ a month, and that
 * figure has been said out loud. If the club becomes its own product, the change is one entry in
 * `PLANS` and one line here, and nothing on the screens moves.
 *
 * **The link is never a payment link with a price in it.** `docs/SETUP.md` §7.1: the site is
 * static and public, so `&price=…` in a URL is a price the payer can edit before paying. The
 * button goes to `/subscribe/`, which is the page that holds the plans, their prices, and the
 * Prodamus links whose amounts are locked on Prodamus's side.
 */
import { PLAN_BY_ID } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';
import type { Locale } from '@/i18n/index';
import { subscribeHref } from '@/app/features/courses/courseMeta';

/** The plan the club is sold with, or null when plans are not configured. */
export function clubPlan() {
  return PLAN_BY_ID.get('monthly') ?? null;
}

/** «1 990 ₽» in the visitor's currency, or null when there is no plan to price it from. */
export function clubPriceLabel(locale: Locale): string | null {
  const plan = clubPlan();
  return plan ? formatPrice(locale, plan.price) : null;
}

/** Where the join button goes: the plans page, never a payment URL carrying an amount. */
export function clubJoinHref(locale: Locale): string {
  return subscribeHref(locale);
}
