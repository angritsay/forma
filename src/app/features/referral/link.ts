/**
 * Полный адрес реферальной ссылки (0051) — то, что уедет в переписку.
 *
 * Отдельно от `duoInvite.ts`, который чистый и проверяется в node: здесь `window` и адрес
 * приложения. То же правило, что у `inviteUrl` в `ClubDuoPair`: с настроенной ссылкой Mini App —
 * `t.me/<bot>/<app>?startapp=ref_<код>`, без неё — веб-адрес `#/ref/<код>`.
 */
import { appHref } from '@/lib/util/paths';
import { LINKS } from '@content/site/links';
import { referralLink } from '@/app/features/marathon/duoInvite';

export function referralUrl(code: string): string {
  const path = `${appHref('#/ref/')}${encodeURIComponent(code)}`;
  const web = typeof window === 'undefined' ? path : new URL(path, window.location.origin).href;
  return referralLink(code, web, LINKS.telegramMiniApp);
}
