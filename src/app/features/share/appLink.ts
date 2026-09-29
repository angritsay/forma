/**
 * Where a friend who taps a shared link lands: the Mini App when the owner has given it a link
 * (`LINKS.telegramMiniApp`), else the app on the site.
 *
 * The stand-in for every share: the workout story and the club's story both carry the member's
 * referral link (`useReferralLink`), and this is what they carry until the code arrives, or when
 * it never does.
 */
import { appHref } from '@/lib/util/paths';
import { BRAND } from '@content/site/brand';
import { LINKS } from '@content/site/links';

export function appLink(): string {
  if (LINKS.telegramMiniApp) return LINKS.telegramMiniApp;
  if (typeof window === 'undefined') return `https://${BRAND.domain}/`;
  return new URL(appHref(), window.location.origin).href;
}
