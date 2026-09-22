import { DEFAULT_LOCALE, type Locale } from '@/content/schema';
import { href } from './paths';

/**
 * Following a payment link hands the visitor's email to a third party, so only an absolute
 * `https://` URL is ever navigated to. Anything else (relative path, `http:`, `javascript:`, a
 * typo) is ignored and the flow ends without a redirect. `PaymentUrlSchema` enforces the same rule
 * on course content at build time; this is the runtime half, and it also covers config the schema
 * does not see (the booking link).
 */
export function paymentTarget(url: string | undefined): URL | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  return parsed.protocol === 'https:' ? parsed : null;
}

/**
 * The payment page asks for the same email the order was made with; pass it along.
 *
 * Two parameter names, because that email is the key tying a payment back to its order: a
 * customer who retypes it — one letter different, or a second address — leaves a paid order
 * nobody can match to a purchase. `email` is the generic name; `customer_email` is the one
 * Prodamus, the processor in use, reads to prefill its form. A payment page ignores query
 * parameters it does not recognise, so sending both costs nothing and keeps these links working
 * if the processor is ever swapped.
 */
export function withEmail(target: URL, email: string): string {
  const url = new URL(target.href);
  url.searchParams.set('email', email);
  url.searchParams.set('customer_email', email);
  return url.href;
}

/* ---------------------------------------------------------------------------------------------
 * Тот, кто не может заплатить в рублях
 * ------------------------------------------------------------------------------------------- */

/** Страница с инструкцией для языков, у которых своей кассы нет. */
export const CHECKOUT_PATH = '/checkout/';

/** Путь к инструкции, с учётом языка и базового пути. */
export function checkoutPath(locale: Locale): string {
  return href(locale, CHECKOUT_PATH);
}

/** Нужна ли этому языку страница с инструкцией вместо кассы. */
export function needsManualCheckout(locale: Locale): boolean {
  return locale !== DEFAULT_LOCALE;
}

/**
 * Куда ведёт «купить» — и чем это место является.
 *
 * `external` — настоящая касса (Prodamus): туда уходит почта, и её хост можно назвать в подписи
 * под кнопкой, потому что человек сейчас окажется на чужом сайте и должен узнать его имя.
 *
 * `manual` — наша же страница `/en/checkout/`: перевод на PayPal, почта в комментарии, кнопка
 * «написать мне». Касса одна, она русская и в рублях, и английский читатель упирался в неё ровно
 * в тот момент, когда собрался платить.
 *
 * Два разных случая названы двумя разными вариантами, а не одним `URL` с догадками на месте
 * вызова, потому что различий ровно два и оба легко забыть: почту к нашей же странице
 * приписывать незачем (а ссылку с чужим адресом в строке ещё и перешлют), и её хост —
 * `forma-app.co` — в подписи «сейчас откроется …» звучит как ошибка.
 */
export type PayRoute = { kind: 'external'; url: URL } | { kind: 'manual'; href: string };

/**
 * Маршрут оплаты для этого языка, или `null`, если платить негде.
 *
 * Ссылка на кассу проверяется первой и на всех языках: она же и есть признак того, что вещь
 * продаётся. Нет её — значит не продаётся никому, и английский читатель получает ровно тот же
 * запасной путь, что русский («написать тренеру», «страница подписок»), а не инструкцию, как
 * заплатить за то, чего нет.
 */
export function payRoute(locale: Locale, url: string | undefined): PayRoute | null {
  const target = paymentTarget(url);
  if (!target) return null;
  if (needsManualCheckout(locale)) return { kind: 'manual', href: checkoutPath(locale) };
  return { kind: 'external', url: target };
}

/** Адрес для перехода. Почта приписывается только к настоящей кассе. */
export function payHref(route: PayRoute, email = ''): string {
  if (route.kind === 'manual') return route.href;
  return email ? withEmail(route.url, email) : route.url.href;
}

/** Хост, который честно назвать в подписи под кнопкой; для своей же страницы — `null`. */
export function payHost(route: PayRoute): string | null {
  return route.kind === 'external' ? route.url.host : null;
}
