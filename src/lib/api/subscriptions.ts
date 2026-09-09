/**
 * Subscriptions: the signed-in user's own row (view `my_subscription`) and the anonymous
 * subscribe form (RPC `create_subscription_order`). Access itself still arrives through
 * `my_entitlements`, which lists every course while the subscription is live.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { EMAIL_RE, guard, requireUser, unwrap, unwrapMaybe } from './internal';
import { subscriptionFromDb, type DbSubscription } from './mappers';
import { isDemo } from './mode';
import type { Subscription, SubscriptionOrderInput, SubscriptionPlan } from './types';

export const PLANS: readonly SubscriptionPlan[] = ['monthly', 'annual'];

export function isPlan(v: unknown): v is SubscriptionPlan {
  return typeof v === 'string' && (PLANS as readonly string[]).includes(v);
}

/** The current user's subscription, or null when they never subscribed. */
export async function getMySubscription(): Promise<Subscription | null> {
  if (isDemo()) return (await demo()).getMySubscription();
  return guard(async () => {
    await requireUser();
    const row = unwrapMaybe<DbSubscription>(
      await supabase()
        .from('my_subscription')
        .select('plan, status, started_at, expires_at, is_live')
        .maybeSingle(),
    );
    return row ? subscriptionFromDb(row) : null;
  });
}

/** Record `email ↔ plan` as a pending subscription; returns the row id. Never grants access. */
export async function createSubscriptionOrder(input: SubscriptionOrderInput): Promise<string> {
  if (isDemo()) return (await demo()).createSubscriptionOrder(input);
  return guard(async () => {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new AppError('validation', 'invalid_email');
    }
    if (!isPlan(input.plan)) throw new AppError('validation', 'invalid_plan');
    return unwrap<string>(
      await supabase().rpc('create_subscription_order', {
        p_email: email,
        p_plan: input.plan,
        p_locale: input.locale ?? 'ru',
        p_source: input.source ?? 'landing',
      }),
    );
  });
}
