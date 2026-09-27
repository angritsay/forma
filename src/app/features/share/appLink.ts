/**
 * Where a friend who taps a shared link lands: the Mini App when the owner has given it a link
 * (`LINKS.telegramMiniApp`), else the app on the site.
 *
 * Shared by the workout story and the club's story. PR 2 replaces this with the member's own
 * referral link on the club's share (`startapp=ref_<code>`); until then it is the plain app link.
 */
import { appHref } from '@/lib/util/paths';
import { BRAND } from '@content/site/brand';
import { LINKS } from '@content/site/links';

export function appLink(): string {
  if (LINKS.telegramMiniApp) return LINKS.telegramMiniApp;
  if (typeof window === 'undefined') return `https://${BRAND.domain}/`;
  return new URL(appHref(), window.location.origin).href;
}
