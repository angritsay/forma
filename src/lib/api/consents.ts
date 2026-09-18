/**
 * The consent log (RPCs `record_consent`, `my_consents`, `revoke_consent`; table `consents`).
 *
 * Three rules hold everywhere in this file.
 *
 * **The version is the date the text last changed.** `PRICING.legalUpdatedAt` is already printed at
 * the top of /privacy/, /terms/ and /refund/ as «обновлено», so it is the version the person
 * actually saw, and using anything else would put a number in the log that appears nowhere a reader
 * could check it. It travels with the call rather than being read by the database, because the site
 * is static: a page held in a browser cache for a week shows last week's text, and the row has to
 * name the text that was on screen.
 *
 * **Recording never blocks.** A consent that could not be written down is a record-keeping failure,
 * not a reason to refuse somebody the app — and `record_consent` is the one call that will fail on
 * every project where 0018 has not been applied yet. So the callers swallow it, exactly as
 * `joinClub` does, and the screens carry on.
 *
 * **Reading is allowed to be wrong in one direction only.** `hasConsent` answers false when it
 * cannot tell, so a question gets asked twice rather than silently skipped. Asking again is a small
 * annoyance; not asking is the thing the law is about.
 */
import { supabase } from './client';
import { AppError } from './errors';
import { guard, requireUser, unwrap } from './internal';
import { isDemo } from './mode';
import { PRICING } from '@content/site/pricing';

/** What a person can agree to. Mirrors the `consents.kind` check in 0018. */
export type ConsentKind = 'privacy' | 'offer' | 'health';

export interface ConsentRecord {
  kind: ConsentKind;
  docVersion: string;
  grantedAt: string;
}

interface DbConsent {
  kind: ConsentKind;
  doc_version: string;
  granted_at: string;
}

/**
 * The version of the legal texts currently published. One constant, read from the same place the
 * pages print their «обновлено» date, so the log and the page can never disagree.
 */
export const CONSENT_VERSION: string = PRICING.legalUpdatedAt;

/**
 * Write down that the signed-in person agreed, and to which text. Returns how many kinds landed,
 * or null when the log is unavailable — never throws.
 */
export async function recordConsent(
  kinds: readonly ConsentKind[],
  source: string,
  locale: 'ru' | 'en' = 'ru',
): Promise<number | null> {
  if (kinds.length === 0) return 0;
  // Demo mode has no backend and no real person to be accountable to; pretending a row was written
  // would be the one lie this module cannot afford.
  if (isDemo()) return null;
  try {
    return await guard(async () => {
      await requireUser();
      return unwrap<number>(
        await supabase().rpc('record_consent', {
          p_kinds: [...kinds],
          p_version: CONSENT_VERSION,
          p_locale: locale,
          p_source: source.slice(0, 40),
        }),
      );
    });
  } catch {
    return null;
  }
}

/** Live consents of the signed-in person, newest first. Empty when the log is unavailable. */
export async function listMyConsents(): Promise<ConsentRecord[]> {
  if (isDemo()) return [];
  try {
    return await guard(async () => {
      await requireUser();
      const rows = unwrap<DbConsent[]>(await supabase().rpc('my_consents')) ?? [];
      return rows.map((r) => ({
        kind: r.kind,
        docVersion: r.doc_version,
        grantedAt: r.granted_at,
      }));
    });
  } catch {
    return [];
  }
}

/** True only when this exact text has been agreed to. Unknown reads as "not agreed" — see above. */
export function hasConsent(records: readonly ConsentRecord[], kind: ConsentKind): boolean {
  return records.some((r) => r.kind === kind && r.docVersion === CONSENT_VERSION);
}

/**
 * Withdraw a consent (152-ФЗ ст. 9 ч. 2). Unlike recording, this one reports its failure: a person
 * who pressed "withdraw" and was told nothing would reasonably believe it had happened.
 */
export async function revokeConsent(kind: ConsentKind): Promise<number> {
  if (isDemo()) throw new AppError('validation', 'demo_mode');
  return guard(async () => {
    await requireUser();
    return unwrap<number>(await supabase().rpc('revoke_consent', { p_kind: kind }));
  });
}
