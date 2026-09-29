/**
 * Полный адрес реферальной ссылки (0051) — то, что уедет в переписку.
 *
 * Ссылка ведёт на страницу `/together/` сайта на языке человека: `?ref=<код>&from=<имя>`.
 * Подруга видит «{Имя} зовёт тебя», первую тренировку и то, что +30 дней будут обеим, если она
 * оплатит клуб по этой ссылке; код откладывается сайтом (`forma.referral`) и едет в приложение
 * с каждой кнопкой. Раньше ссылка вела прямо в `/app/#/ref/<код>` — на экран выбора языка,
 * без единого слова о том, кто позвал и зачем. Старый маршрут в приложении остаётся: отправленные
 * ссылки работают.
 *
 * Имя — первое слово профиля, очищенное правилом приглашения (`cleanName`), или ничего.
 *
 * С настроенной ссылкой Mini App (`LINKS.telegramMiniApp`) правило прежнее —
 * `t.me/<bot>/<app>?startapp=ref_<код>`: внутри телеграма она открывает приложение, а не браузер.
 *
 * Отдельно от `duoInvite.ts`, который чистый и проверяется в node: здесь `window` и адрес сайта.
 */
import type { Locale } from '@/content/schema';
import { BRAND } from '@content/site/brand';
import { LINKS } from '@content/site/links';
import { referralLink } from '@/app/features/marathon/duoInvite';
import { firstName, togetherUrl } from '@/lib/share/invite';

function origin(): string {
  return typeof window === 'undefined' ? `https://${BRAND.domain}` : window.location.origin;
}

export function referralUrl(code: string, name: string | null | undefined, locale: Locale): string {
  const web = togetherUrl(origin(), locale, { ref: code, from: firstName(name) });
  return referralLink(code, web, LINKS.telegramMiniApp);
}
