/**
 * Landing order form (RPC `create_order`, callable by anonymous visitors).
 */
import { supabase } from './client';
import { AppError } from './errors';
import { COURSE_ID_RE, EMAIL_RE, guard, unwrap } from './internal';
import type { OrderInput } from './types';

/** Record `email ↔ course` as a pending purchase; returns the purchase id. Idempotent per pair. */
export async function createOrder(input: OrderInput): Promise<string> {
  return guard(async () => {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new AppError('validation', 'invalid_email');
    }
    if (!COURSE_ID_RE.test(input.courseId)) throw new AppError('validation', 'invalid_course');

    const id = unwrap<string>(
      await supabase().rpc('create_order', {
        p_email: email,
        p_course_id: input.courseId,
        p_locale: input.locale ?? 'ru',
        p_source: input.source ?? 'landing',
      }),
    );
    return id;
  });
}
