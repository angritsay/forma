/**
 * The one course-level link the app still needs: where the subscription is sold.
 *
 * This file used to hold the Home rows' and the old Courses screen's labels (the signature
 * exercise, the weeks and per-week words, the gear chips, the three pills). Those screens are
 * gone and nothing read them any more; the landing keeps its own copies in
 * `components/landing/courseHelpers.ts`.
 */
import type { Locale } from '@/content/schema';
import { href } from '@/lib/util/paths';

/** The landing page that sells the subscription (every course). */
export function subscribeHref(locale: Locale): string {
  return href(locale, '/subscribe/');
}
