/**
 * Landing order form (RPC `create_order`, callable by anonymous visitors).
 */
import { supabase } from './client';
import { CONSENT_VERSION } from './consents';
import { demo } from './demo/load';
import { AppError } from './errors';
import { COURSE_ID_RE, EMAIL_RE, guard, unwrap } from './internal';
import { isDemo } from './mode';
import type { OrderInput } from './types';

/**
 * "No function matches the name and argument types" — PostgREST's `PGRST202`, which is what a
 * database without migration 0018 answers to a call carrying the consent version. Matched on the
 * code, with the message as a fallback for older PostgREST builds that did not set one.
 */
function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '');
}

/** Record `email ↔ course` as a pending purchase; returns the purchase id. Idempotent per pair. */
export async function createOrder(input: OrderInput): Promise<string> {
  if (isDemo()) return (await demo()).createOrder(input);
  return guard(async () => {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new AppError('validation', 'invalid_email');
    }
    if (!COURSE_ID_RE.test(input.courseId)) throw new AppError('validation', 'invalid_course');

    const args = {
      p_email: email,
      p_course_id: input.courseId,
      p_locale: input.locale ?? 'ru',
      p_source: input.source ?? 'landing',
    };

    /*
     * The consent, recorded with the order it belongs to. The form refuses to submit until the box
     * is ticked, so reaching this line *is* the agreement; what was missing until 0018 was writing
     * it down — 152-ФЗ ст. 9 ч. 3 puts the burden of proving consent on the operator.
     *
     * The version is the date printed at the top of the policy the visitor was actually looking
     * at, not the date deployed today: the site is static and this page may have been in a browser
     * cache for a week.
     *
     * **And it falls back.** PostgREST resolves an RPC by the exact set of keys it is given, so on
     * a project where 0018 has not been applied the five-key call does not find a function and
     * fails — which would turn a record-keeping improvement into a broken "Получить доступ" button
     * for everyone. The order is what matters; the consent row is what we would like. So: try with
     * it, and on the one error that means "this database has not got the new signature", place the
     * order without it.
     */
    const withConsent = await supabase().rpc('create_order', {
      ...args,
      p_consent_version: CONSENT_VERSION,
    });
    const res = isMissingFunction(withConsent.error)
      ? await supabase().rpc('create_order', args)
      : withConsent;

    return unwrap<string>(res);
  });
}
