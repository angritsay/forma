/**
 * Who may play the game. Pure; unit-tested.
 *
 * The game belongs to the subscription (content/site/plans.ts) — its prize is an hour of the
 * coach's time every week, and given away it costs more the better it does. But the person who
 * just bought a course is exactly the person the subscription is for, and telling them about a
 * format they cannot enter is a worse advertisement than letting them into it.
 *
 * So a course buys a week of the game. It is the cheapest advertising the product has: the athlete
 * is already training, lands in the board, sees real people, and on the seventh day is told what it
 * costs to stay.
 *
 * No new state was needed for it. `purchases.activated_at` is already stamped when the coach
 * confirms a payment, and `my_entitlements` already carries it, so the trial is a subtraction
 * rather than a table — which also means it cannot drift out of sync with the purchase it belongs
 * to, and a refunded course takes its trial with it.
 */

/** How long a course opens the game for. */
export const GAME_TRIAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GameAccessInput {
  /** The server's verdict on the subscription: active or cancelled, period not over. */
  subscriptionLive: boolean;
  /** When the most recent course was activated, ISO; null when nothing is owned. */
  newestPurchaseAt: string | null;
  /** Now, in ms. */
  now: number;
  /** False while the subscription is not on sale: then nothing is gated. */
  gated: boolean;
}

export type GameAccess =
  | { allowed: true; reason: 'open' | 'subscription' | 'trial'; trialDaysLeft?: number }
  | { allowed: false; reason: 'locked' };

/**
 * Whether the game opens, and on what grounds.
 *
 * The grounds matter to the caller: a card entered on the trial says how long is left, and one
 * entered on a subscription says nothing at all, because there is nothing to count down to.
 */
export function gameAccess({
  subscriptionLive,
  newestPurchaseAt,
  now,
  gated,
}: GameAccessInput): GameAccess {
  if (!gated) return { allowed: true, reason: 'open' };
  if (subscriptionLive) return { allowed: true, reason: 'subscription' };

  const left = trialDaysLeft(newestPurchaseAt, now);
  if (left === null) return { allowed: false, reason: 'locked' };
  return { allowed: true, reason: 'trial', trialDaysLeft: left };
}

/**
 * Whole days left of the trial, or null when there is no trial running.
 *
 * Rounded up, so the last partial day still reads as «1 день» rather than «0» — the day is not
 * over until it is over, and a countdown that reaches zero while access still works is a bug the
 * athlete experiences as a lie.
 */
export function trialDaysLeft(newestPurchaseAt: string | null, now: number): number | null {
  if (!newestPurchaseAt) return null;
  const started = Date.parse(newestPurchaseAt);
  if (!Number.isFinite(started)) return null;
  const endsAt = started + GAME_TRIAL_DAYS * DAY_MS;
  if (now >= endsAt) return null;
  return Math.max(1, Math.ceil((endsAt - now) / DAY_MS));
}

/** The newest activation among what the athlete owns — the one whose trial runs longest. */
export function newestActivation(
  entitlements: readonly { activatedAt: string | null }[],
): string | null {
  let best: number | null = null;
  let bestIso: string | null = null;
  for (const e of entitlements) {
    if (!e.activatedAt) continue;
    const t = Date.parse(e.activatedAt);
    if (!Number.isFinite(t)) continue;
    if (best === null || t > best) {
      best = t;
      bestIso = e.activatedAt;
    }
  }
  return bestIso;
}
