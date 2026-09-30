/**
 * Why a proof did not go through, in words the athlete can act on.
 *
 * Every failure used to be «Что-то пошло не так», which is the right sentence for none of them:
 * no connection wants a retry, a round that closed wants nothing (the write policy only admits a
 * running marathon, 0011), and a file past the bucket's limit wants a shorter clip.
 */
import { isAppError } from '@/lib/api/errors';
import type { TKey } from '@/i18n/index';

/**
 * The largest photograph sent after the downscale. `downscaleImage` degrades to the original on
 * a phone that cannot re-encode, and a 40 MB original would spend the upload only to be refused.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ProofErrorKind = 'offline' | 'closed' | 'too_large' | 'generic';

export function proofErrorKind(e: unknown): ProofErrorKind {
  if (!isAppError(e)) return 'generic';
  if (e.code === 'network') return 'offline';
  if (e.status === 413 || /exceed|too large|payload/i.test(e.message)) return 'too_large';
  if (e.code === 'forbidden') return 'closed';
  return 'generic';
}

export function proofErrorKey(kind: ProofErrorKind): TKey {
  switch (kind) {
    case 'offline':
      return 'common.errorOffline';
    case 'closed':
      return 'app.marathonProofClosed';
    case 'too_large':
      return 'app.marathonProofTooLarge';
    case 'generic':
      return 'common.errorGeneric';
  }
}

/** The same file picked again: identity by what the picker hands back. */
export function sameFile(
  a: File,
  b: { name: string; size: number; lastModified: number },
): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}
