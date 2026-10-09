/**
 * Every interface string that says how the 30-day plan renews, as a `manual | auto` pair of
 * dictionary keys — resolved by `RENEWAL` (content/site/plans.ts), the one switch.
 *
 * The manual key is the string the site has always shown; the auto key is its twin, a draft for
 * the lawyer that nobody sees until the switch is flipped (docs/SETUP.md §7.18). Callers never
 * name either key directly: they ask for `renewalKey('clubNoAutoRenew')`, so flipping the switch
 * changes every surface at once and none can be forgotten. The mode is a parameter so tests can
 * render the auto variant while the switch stays `'manual'`.
 *
 * Not covered here, because they are not dictionary keys: the monthly plan's note and link
 * (`plansFor`), the home FAQ (`content/site/faq.ts`), the legal texts (`legal.ts`), the app's
 * renewal row (`src/app/features/profile/subscription.ts`) and the bot's reminder
 * (`supabase/functions/telegram-notify/copy.ts`).
 */
import { byRenewal, RENEWAL, type RenewalMode } from '@content/site/plans';
import type { TKey } from '@/i18n/index';

export const RENEWAL_KEYS = {
  /** /subscribe/'s meta description (and the sitemap's, `src/lib/seo/pages.ts`). */
  subscribeDescription: {
    manual: 'landing.subscribeDescription',
    auto: 'landing.subscribeDescriptionAuto',
  },
  /** The line under the club's order form's pay button. */
  subscribeNote: { manual: 'landing.subscribeNote', auto: 'landing.subscribeNoteAuto' },
  /** /subscribe/'s FAQ answer to «Деньги спишутся сами?» (takes `{email}` in auto mode). */
  subscribeFaq5A: { manual: 'landing.subscribeFaq5A', auto: 'landing.subscribeFaq5AAuto' },
  /** Under the year's charge: true of the year in both modes, so auto mode names the year. */
  clubNoAutoRenew: { manual: 'landing.clubNoAutoRenew', auto: 'landing.clubNoAutoRenewAuto' },
  /** The price ladder's footnote. */
  ladderFootnoteShort: {
    manual: 'landing.ladderFootnoteShort',
    auto: 'landing.ladderFootnoteShortAuto',
  },
  /** /creators/'s club price note. */
  creatorsClubPriceNote: {
    manual: 'landing.creatorsClubPriceNote',
    auto: 'landing.creatorsClubPriceNoteAuto',
  },
} as const satisfies Record<string, { manual: TKey; auto: TKey }>;

export type RenewalCopy = keyof typeof RENEWAL_KEYS;

/** The dictionary key for `which` under `mode` (default: the live switch). */
export function renewalKey(which: RenewalCopy, mode: RenewalMode = RENEWAL): TKey {
  return byRenewal<TKey>(RENEWAL_KEYS[which], mode);
}
