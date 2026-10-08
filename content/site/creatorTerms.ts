/**
 * What a creator pays Forma: two tiers, stated publicly on `/creators/` (docs/CREATORS.md).
 *
 * The owner chose the ladder (8 Oct 2026): «Both, in two tiers» for where creators live, and
 * «Free 20% → Pro» for what they pay.
 *
 * - **Start** — no monthly fee; Forma keeps 20% of course and club sales and 10% of one-to-one
 *   sessions. The creator's page, course and club live inside the Forma app. Self-serve: the
 *   creator signs up and builds without waiting for anybody. Not open yet — it needs the
 *   platform's creator accounts (docs/PLATFORM.md) — so `open: false` and the page says «скоро».
 * - **Pro** — a monthly fee; Forma keeps 10% and 5%. Everything under the creator's own name: their
 *   domain, bot, app and payment accounts, built with Forma's team. This is what Forma offers
 *   today, so `open: true`.
 *
 * Shares are counted on what is left after the payment processor's fee, as before. The page,
 * its calculator and the outreach message read the numbers from here, so a change is made once.
 */
import type { CoursePrice } from './pricing';

export type CreatorTierId = 'start' | 'pro';

export interface CreatorTier {
  id: CreatorTierId;
  /** Forma's share of course and club sales, 0…1. */
  salesShare: number;
  /** Forma's share of one-to-one sessions, 0…1. */
  sessionsShare: number;
  /** The monthly fee, in the locale's currency; zero for none. */
  monthlyFee: CoursePrice;
  /** Whether a creator can start on it today. */
  open: boolean;
}

export const CREATOR_TIERS: readonly CreatorTier[] = [
  {
    id: 'start',
    salesShare: 0.2,
    sessionsShare: 0.1,
    monthlyFee: { rub: 0, usd: 0 },
    open: false,
  },
  {
    id: 'pro',
    salesShare: 0.1,
    sessionsShare: 0.05,
    monthlyFee: { rub: 4990, usd: 59 },
    open: true,
  },
];

export const CREATOR_TIER_BY_ID: ReadonlyMap<CreatorTierId, CreatorTier> = new Map(
  CREATOR_TIERS.map((t) => [t.id, t]),
);

/** A share as the page says it: 0.2 → «20%». */
export function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * The monthly sales (after the processor's fee) at which Pro starts paying for itself: below it
 * Start leaves the creator more, above it Pro does. Sessions are left out — the point is a figure
 * a creator can hold in their head, and sales are where the fee is decided.
 */
export function proBreakEven(currency: keyof CoursePrice): number {
  const start = CREATOR_TIER_BY_ID.get('start')!;
  const pro = CREATOR_TIER_BY_ID.get('pro')!;
  const saved = start.salesShare - pro.salesShare;
  if (saved <= 0) return Infinity;
  return Math.ceil(pro.monthlyFee[currency] / saved);
}
