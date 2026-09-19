/**
 * «Я оплатил(а), но с другой почты» — RPC `claim_payment` (migration 0020).
 *
 * Everything that grants access is found by email, and the payer's email is not reliably ours to
 * set: the Prodamus short link drops the `?customer_email=` the app appends, so whoever is paying
 * types an address into the form — their work one, their spouse's, whatever the browser filled in.
 * The money arrives and matches no order.
 *
 * The way back is the order number on the receipt Prodamus emails the payer. Only they have it, so
 * it is proof rather than a claim — which is why this asks for a number and not simply for a second
 * address to trust.
 *
 * Every outcome is a string rather than a thrown error, because four of the six are things a person
 * did rather than faults: `not_found` (no such number, or somebody already claimed it),
 * `email_taken` (that payment address belongs to another account) and `rate_limited` (ten tries an
 * hour) are answers the screen shows, not exceptions to report.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap } from './internal';
import { isDemo } from './mode';

export const CLAIM_RESULTS = [
  /** A subscription was opened or extended. */
  'subscription',
  /** A pending course order was activated. */
  'course',
  /** The address is linked, but there was nothing waiting to activate. */
  'linked',
  'not_found',
  'email_taken',
  'rate_limited',
] as const;

export type ClaimResult = (typeof CLAIM_RESULTS)[number];

export function isClaimResult(v: unknown): v is ClaimResult {
  return typeof v === 'string' && (CLAIM_RESULTS as readonly string[]).includes(v);
}

/** Order numbers are short receipt references; anything longer is not one. */
export const ORDER_REF_MAX = 120;

/**
 * Attach a payment made from another address to this account.
 *
 * An unknown answer is reported as `not_found` rather than thrown: it means the database has not
 * got migration 0020 yet, and «такого номера не нашли» is both true and actionable, where a red
 * error screen would send the owner looking for a bug that is really a migration.
 */
export async function claimPayment(orderRef: string): Promise<ClaimResult> {
  const ref = orderRef.trim();
  if (!ref || ref.length > ORDER_REF_MAX) return 'not_found';
  if (isDemo()) {
    const answer = await (await demo()).claimPayment(ref);
    return isClaimResult(answer) ? answer : 'not_found';
  }
  return guard(async () => {
    await requireUser();
    const answer = unwrap<string>(await supabase().rpc('claim_payment', { p_provider_ref: ref }));
    return isClaimResult(answer) ? answer : 'not_found';
  });
}
