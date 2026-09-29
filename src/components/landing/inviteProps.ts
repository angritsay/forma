/**
 * What an Astro page hands to the invite, in one place — so the homepage's `#together`, the
 * friend's `/together/` and the one-tap «Позвать с собой» buttons cannot drift apart in wording.
 *
 * Build time only: this imports the dictionaries (`@/i18n`) and the path helpers, and returns
 * plain data — props for the `ShareInvite` island, or `data-*` attributes for a button that
 * `shareHome.ts` binds. The browser never loads this file.
 */
import type { Locale } from '@/content/schema';
import { t } from '@/i18n/index';
import { inviteCopy } from '@/lib/share/inviteCopy';
import { appHref, localePath, withBase } from '@/lib/util/paths';
import type { ShareInviteProps } from './ShareInvite';

/** Props for `<ShareInvite>`; `eyebrow` names the card where it stands. */
export function shareInviteProps(
  locale: Locale,
  origin: string,
  eyebrow: string = t(locale, 'landing.togetherLinkLabel'),
): ShareInviteProps {
  return {
    locale,
    copy: inviteCopy(locale),
    origin,
    shareTitle: t(locale, 'landing.shareTitle'),
    inviteHref: appHref('/invite', { locale }),
    startHref: appHref('/start', { locale }),
    labels: {
      eyebrow,
      chip: t(locale, 'landing.inviteChip'),
      nameLabel: t(locale, 'landing.inviteNameLabel'),
      namePlaceholder: t(locale, 'landing.inviteNamePlaceholder'),
      nameHint: t(locale, 'landing.inviteNameHint'),
      previewLabel: t(locale, 'landing.invitePreviewLabel'),
      send: t(locale, 'landing.inviteSend'),
      copy: t(locale, 'landing.copyLink'),
      copied: t(locale, 'landing.copyLinkDone'),
      copyFailed: t(locale, 'landing.copyLinkFailed'),
      calendar: t(locale, 'landing.inviteCalendar'),
      calendarGoogle: t(locale, 'landing.inviteCalendarGoogle'),
      calendarFile: t(locale, 'landing.inviteCalendarFile'),
      refOff: t(locale, 'landing.inviteRefOff'),
      refOffCta: t(locale, 'landing.togetherPersonalCta'),
      refOn: t(locale, 'landing.inviteRefOn'),
      note: t(locale, 'app.inviteNote'),
      noDiscount: t(locale, 'landing.togetherNoDiscount'),
    },
  };
}

/** The `/together/` page of a locale, base-prefixed — what every invite links to. */
export function togetherPath(locale: Locale): string {
  return withBase(localePath(locale, '/together/'));
}

/**
 * Attributes for a one-tap «Позвать с собой» (`[data-share-home]`, `shareHome.ts`): the share
 * sheet with the Monday message and the `/together/` link, built in the browser from these
 * templates. `data-share-path` is also where a device with no share sheet is sent when the page
 * has no together block to scroll to.
 */
export function inviteShareAttrs(locale: Locale): Record<`data-${string}`, string | boolean> {
  const c = inviteCopy(locale);
  const copy = {
    when: c.when,
    whenTomorrow: c.whenTomorrow,
    whenToday: c.whenToday,
    whenSoon: c.whenSoon,
    soonLabel: c.soonLabel,
    text: c.text,
    refLine: c.refLine,
  };
  return {
    'data-share-home': true,
    'data-share-path': togetherPath(locale),
    'data-share-title': t(locale, 'landing.shareTitle'),
    'data-share-locale': locale,
    'data-share-invite': JSON.stringify(copy),
  };
}
