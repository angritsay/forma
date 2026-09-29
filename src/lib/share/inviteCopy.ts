/**
 * The invite's templates for one language, read from the dictionaries (`landing.invite*`).
 *
 * Kept apart from `invite.ts` on purpose: this imports `@/i18n`, which carries every dictionary.
 * Astro calls it at build time and hands the result to the island as props, so a page ships the
 * handful of strings it uses and not the app's whole vocabulary.
 */
import type { Locale } from '@/content/schema';
import { t } from '@/i18n';
import type { ComposeCopy } from './compose';

export interface InviteCalendarCopy {
  /** «Forma — тренировка 1». */
  title: string;
  /** With {url}: where the event's note sends you. */
  details: string;
}

export function inviteCopy(locale: Locale): ComposeCopy & { calendar: InviteCalendarCopy } {
  return {
    when: t(locale, 'landing.inviteWhen'),
    whenTomorrow: t(locale, 'landing.inviteWhenTomorrow'),
    whenToday: t(locale, 'landing.inviteWhenToday'),
    whenSoon: t(locale, 'landing.inviteWhenSoon'),
    soonLabel: t(locale, 'landing.inviteSoonLabel'),
    text: t(locale, 'landing.inviteShareText'),
    refLine: t(locale, 'landing.inviteShareRef'),
    calendar: {
      title: t(locale, 'landing.inviteCalendarTitle'),
      details: t(locale, 'landing.inviteCalendarDetails'),
    },
  };
}
