/**
 * The rules of the «Написать тренеру» field, kept out of the component so they are tested.
 *
 * They mirror `support_message` (0042): trimmed, not empty, at most a thousand characters. The
 * server enforces all of it again — this copy exists so the send button can be honest before the
 * round trip, not as a guard.
 */
import type { TKey } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';

/** The same cap as `support_message` in 0042. */
export const SUPPORT_MAX = 1000;

export type SupportCheck = { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' };

/**
 * Length in characters as a person counts them — code points, so an emoji is one and not two.
 * Postgres `length()` counts the same way, which is what keeps the two caps in agreement.
 */
export function supportLength(text: string): number {
  return Array.from(text.trim()).length;
}

export function checkSupportText(raw: string): SupportCheck {
  const text = raw.trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (supportLength(text) > SUPPORT_MAX) return { ok: false, reason: 'too_long' };
  return { ok: true, text };
}

/** The i18n key for a failed send. Every failure gets a sentence; none gets a code. */
export function supportErrorKey(e: unknown): TKey {
  if (isAppError(e)) {
    if (e.message.includes('rate_limited')) return 'app.supportErrorRate';
    if (e.message.includes('text_too_long')) return 'app.supportErrorLong';
    if (e.message.includes('text_empty')) return 'app.supportErrorEmpty';
    if (e.code === 'network') return 'app.supportErrorNetwork';
    if (e.code === 'auth') return 'app.supportErrorAuth';
  }
  return 'app.supportError';
}
